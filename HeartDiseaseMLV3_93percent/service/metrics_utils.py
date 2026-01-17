# service/metrics_utils.py
from pathlib import Path
import json

def project_root() -> Path:
    # /service -> parent is project root
    return Path(__file__).resolve().parents[1]

def artifacts_dir(task: str = "heart_disease") -> Path:
    return project_root() / "ml" / "tasks" / task

def load_all_metrics(task: str = "heart_disease"):
    """
    Reads all metrics_*.json files in ml/tasks/<task>/ and returns a list of dicts.
    Expected examples:
      metrics_v1_kaggle.json
      metrics_v1_cleveland.json
    Each dict gets a 'label' field (from metrics or filename).
    """
    a_dir = artifacts_dir(task)
    if not a_dir.exists():
        return []

    rows = []
    for p in a_dir.glob("metrics*.json"):
        try:
            with p.open("r", encoding="utf-8") as f:
                m = json.load(f)
        except Exception:
            continue

        # Infer a label if not present
        label = (
            m.get("label")
            or m.get("artifact_label")
            or p.stem.replace("metrics_", "").replace(".json", "")
        )
        m["label"] = label

        # Normalize common numeric fields to float where possible
        for k, v in list(m.items()):
            if isinstance(v, (int, float)):
                continue
            try:
                m[k] = float(v)
            except Exception:
                pass

        rows.append(m)

    return rows
