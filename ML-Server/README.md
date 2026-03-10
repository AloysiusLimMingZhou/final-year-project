# Heart Disease ML (API-first)

Python service that predicts heart disease risk from tabular inputs using a scikit-learn pipeline. 
API is FastAPI-based and ready for future multi-condition expansion.

## Quickstart

```bash
pip install -r requirements.txt
uvicorn service.api:app --reload --port 8000
```

Health:
```
GET http://localhost:8000/healthz
```

Predict:
```bash
curl -X POST http://localhost:8000/predict/heart_disease   -H "Content-Type: application/json"   -d '{"age": 54, "sex": 1, "cp": 0, "trestbps": 140, "chol": 239, "fbs": 0, "restecg": 1, "thalach": 160, "exang": 0, "oldpeak": 1.2, "slope": 2, "ca": 0, "thal": 2}'
```
