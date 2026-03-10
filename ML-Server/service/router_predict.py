from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
from .model_manager import load_active_model_pack

router = APIRouter(prefix="/predict", tags=["predict"])

# Schema matches training feature order
class HeartInput(BaseModel):
    age: float
    sex: int
    cp: int
    trestbps: float
    chol: float
    fbs: int
    restecg: int
    thalach: float
    exang: int
    oldpeak: float
    slope: int
    ca: float
    thal: int

@router.post("/heart_disease")
def predict_heart_disease(x: HeartInput):
    try:
        pack = load_active_model_pack("heart_disease")
        model = pack["model"]
        features = pack["features"]
        thresholds = pack.get("band_thresholds", {"low": 0.40, "high": 0.70})

        # build a DataFrame with correct column names
        row = pd.DataFrame([x.dict()], columns=features)

        prob = float(model.predict_proba(row)[0][1])
        band = "Low"
        if prob >= thresholds["high"]:
            band = "High"
        elif prob >= thresholds["low"]:
            band = "Medium"

        return {
            "task": "heart_disease",
            "probability": prob,
            "band": band,
            "band_thresholds": thresholds,
            "model_version": pack.get("label", "artifact_v1"),
            "disclaimer": "Educational decision-support only. Not a diagnosis."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference error: {e}")
