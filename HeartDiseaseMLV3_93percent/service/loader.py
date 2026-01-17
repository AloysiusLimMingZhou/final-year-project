from pathlib import Path
import json, joblib

# Project root is one level up from /service
ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "ml" / "registry.json"
DEFAULT_TASK = "heart_disease"

def _resolve_path(p):
    p = Path(p)
    if not p.is_absolute():
        p = (ROOT / p).resolve()
    return p

def _default_artifact(task: str):
    task_dir = ROOT / "ml" / "tasks" / task
    candidates = sorted(task_dir.glob("artifact_v1*.pkl"))
    if not candidates:
        raise FileNotFoundError(f"No artifacts found for task {task} in {task_dir}")
    return candidates[0]

def get_registry_active_path(task: str = DEFAULT_TASK) -> Path:
    if REGISTRY.exists():
        reg = json.loads(REGISTRY.read_text())
        art = reg.get("tasks", {}).get(task, {}).get("active")
        if art:
            return _resolve_path(art)
    return _default_artifact(task)

def load_active_artifact(task: str = DEFAULT_TASK):
    art_path = get_registry_active_path(task)
    pack = joblib.load(art_path)
    return pack, art_path
