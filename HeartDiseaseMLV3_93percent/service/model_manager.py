from pathlib import Path
import json
import joblib
from functools import lru_cache

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "ml" / "registry.json"

def _read_registry():
    if REGISTRY.exists():
        return json.loads(REGISTRY.read_text())
    return {"tasks": {}}

def get_active_artifact_path(task: str = "heart_disease") -> Path | None:
    reg = _read_registry()
    rel = reg.get("tasks", {}).get(task, {}).get("active")
    if not rel:
        return None
    p = Path(rel)
    if not p.is_absolute():
        p = ROOT / rel
    return p

@lru_cache(maxsize=1)
def load_active_model_pack(task: str = "heart_disease"):
    art = get_active_artifact_path(task)
    if not art or not art.exists():
        raise FileNotFoundError(f"Active artifact not found for task {task}: {art}")
    pack = joblib.load(art)
    # expected keys: model, features, band_thresholds (optional), metrics (optional)
    return pack

def hot_reload():
    # clear cache so next call reloads from disk
    load_active_model_pack.cache_clear()
