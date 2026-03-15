from fastapi import APIRouter
from pathlib import Path
import json

router = APIRouter(tags=["health"])

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "ml" / "registry.json"

@router.get("/healthz")
def healthz():
    active = None
    try:
        if REGISTRY.exists():
            reg = json.loads(REGISTRY.read_text())
            active = reg.get("tasks", {}).get("heart_disease", {}).get("active")
            if active:
                p = Path(active)
                if not p.is_absolute():
                    p = ROOT / p
                active = str(p.resolve())
    except Exception:
        active = None

    return {
        "ok": True,
        "task": "heart_disease",
        "artifact": active
    }
