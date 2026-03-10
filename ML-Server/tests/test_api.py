import json
from fastapi.testclient import TestClient
from service.api import app

client = TestClient(app)

def test_healthz():
    r = client.get("/healthz")
    assert r.status_code == 200
    j = r.json()
    assert j["ok"] is True
    assert j["task"] == "heart_disease"

def test_predict():
    payload = {
        "age": 54, "sex": 1, "cp": 0, "trestbps": 140, "chol": 239,
        "fbs": 0, "restecg": 1, "thalach": 160, "exang": 0,
        "oldpeak": 1.2, "slope": 2, "ca": 0, "thal": 2
    }
    r = client.post("/predict/heart_disease", json=payload)
    assert r.status_code == 200
    j = r.json()
    assert "probability" in j and 0.0 <= j["probability"] <= 1.0
    assert j["task"] == "heart_disease"
