# service/admin_compare.py
from fastapi import APIRouter, Query
from typing import Optional
from .metrics_utils import load_all_metrics

router = APIRouter()

@router.get("/admin/compare_models")
def compare_models(
    task: str = "heart_disease",
    sort_by: Optional[str] = Query(default="roc_auc", description="Metric key to sort by"),
    top_n: Optional[int] = Query(default=None, ge=1, description="Return only top N rows")
):
    rows = load_all_metrics(task)

    # If the metric key isn't there, don't crash—just return unsorted
    if sort_by:
        try:
            rows.sort(key=lambda r: float(r.get(sort_by, 0.0)), reverse=True)
        except Exception:
            # ignore sort errors
            pass

    if top_n is not None:
        rows = rows[:top_n]

    return {
        "ok": True,
        "task": task,
        "sort_by": sort_by,
        "count": len(rows),
        "rows": rows
    }
