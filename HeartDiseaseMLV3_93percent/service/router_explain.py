from fastapi import APIRouter
router = APIRouter(prefix="/explain", tags=["explain"])

@router.get("/status")
def explain_status():
    return {"ok": True, "message": "Local explanations not enabled yet (SHAP optional)."}
