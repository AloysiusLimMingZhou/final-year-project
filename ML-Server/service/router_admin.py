# service/router_admin.py
from fastapi import APIRouter, HTTPException
from pathlib import Path
from pydantic import BaseModel
import json

router = APIRouter(prefix="/admin", tags=["admin"])

ROOT = Path(__file__).resolve().parents[1]  # project root
REGISTRY = ROOT / "ml" / "registry.json"


# ---------- Models ----------
class ActivateRequest(BaseModel):
    artifact: str
    task: str = "heart_disease"


# ---------- Endpoints ----------

@router.get("/list_artifacts")
def list_artifacts(task: str = "heart_disease"):
    task_dir = ROOT / "ml" / "tasks" / task
    files = sorted(str(p.resolve()) for p in task_dir.glob("artifact_v1*.pkl"))
    return {
        "task": task,
        "dir": str(task_dir),
        "count": len(files),
        "artifacts": files,
    }


@router.post("/activate_model")
def activate_model(req: ActivateRequest):
    artifact = req.artifact
    task = req.task

    art_path = Path(artifact)
    if not art_path.is_absolute():
        art_path = ROOT / artifact
    if not art_path.exists():
        raise HTTPException(status_code=404, detail=f"Artifact not found: {artifact}")

    if REGISTRY.exists():
        reg = json.loads(REGISTRY.read_text())
    else:
        reg = {"tasks": {}}

    reg["tasks"].setdefault(task, {})
    reg["tasks"][task]["active"] = str(art_path.resolve())
    REGISTRY.write_text(json.dumps(reg, indent=2))

    return {"ok": True, "task": task, "active": str(art_path.resolve())}


@router.post("/activate_by_label")
def activate_by_label(label: str, task: str = "heart_disease"):
    task_dir = ROOT / "ml" / "tasks" / task
    candidates = list(task_dir.glob(f"{label}.pkl"))
    if not candidates:
        # also allow full filename without .pkl
        candidates = list(task_dir.glob(label))
    if not candidates:
        raise HTTPException(status_code=404, detail=f"No artifact matches label: {label}")

    art = candidates[0]

    if REGISTRY.exists():
        reg = json.loads(REGISTRY.read_text())
    else:
        reg = {"tasks": {}}

    reg["tasks"].setdefault(task, {})
    reg["tasks"][task]["active"] = str(art.resolve())
    REGISTRY.write_text(json.dumps(reg, indent=2))

    return {"ok": True, "task": task, "active": str(art.resolve())}
