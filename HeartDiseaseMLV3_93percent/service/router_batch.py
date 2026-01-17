from fastapi import APIRouter, UploadFile, File, HTTPException
import io, csv
import pandas as pd
from .model_manager import load_active_model_pack

router = APIRouter(prefix="/predict", tags=["batch"])

@router.post("/batch")
async def predict_batch(file: UploadFile = File(...)):
    try:
        content = await file.read()
        # detect delimiter automatically
        sniffer = csv.Sniffer()
        sample = content[:1000].decode("utf-8", errors="ignore")
        dialect = sniffer.sniff(sample)
        df = pd.read_csv(io.BytesIO(content), delimiter=dialect.delimiter)

        pack = load_active_model_pack("heart_disease")
        model = pack["model"]
        features = pack["features"]

        # Align columns exactly
        df_in = df[features].copy()
        probs = model.predict_proba(df_in)[:, 1]
        out = df.copy()
        out["probability"] = probs

        # stream back as CSV
        buf = io.StringIO()
        out.to_csv(buf, index=False)
        return buf.getvalue()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {e}")
