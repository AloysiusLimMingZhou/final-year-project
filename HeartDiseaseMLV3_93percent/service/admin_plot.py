# service/admin_plot.py
from fastapi import APIRouter, Response, Query
from .metrics_utils import load_all_metrics
import io
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

router = APIRouter()

@router.get("/admin/compare_models_plot")
def compare_models_plot(
    metric: str = Query(default="roc_auc", description="y metric (e.g., roc_auc)"),
    kind:   str = Query(default="bar", description="bar|hbar|line|hist|box"),
    w:      int = Query(default=900, ge=300, le=4000, description="width px"),
    h:      int = Query(default=500, ge=250, le=3000, description="height px"),
    task:   str = "heart_disease",
):
    rows = load_all_metrics(task)

    # numeric values for the selected metric
    try:
        rows.sort(key=lambda r: float(r.get(metric, 0.0)), reverse=True)
    except Exception:
        pass

    labels = [r.get("label", "?") for r in rows]
    values = [float(r.get(metric, 0.0)) for r in rows]

    # figure size in inches (dpi=96 makes px≈inch*96)
    dpi = 96
    fig_w, fig_h = max(4, w / dpi), max(3, h / dpi)
    fig, ax = plt.subplots(figsize=(fig_w, fig_h), dpi=dpi)

    k = (kind or "bar").lower()

    if k == "hbar":
        ax.barh(labels, values)
        ax.set_xlabel(metric)
        ax.invert_yaxis()  # highest at top
    elif k == "line":
        ax.plot(range(len(values)), values, marker="o")
        ax.set_xticks(range(len(labels)))
        ax.set_xticklabels(labels, rotation=45, ha="right")
        ax.set_ylabel(metric)
    elif k == "hist":
        ax.hist(values, bins=min(10, max(3, len(values)//2)))
        ax.set_xlabel(metric)
        ax.set_ylabel("count")
    elif k == "box":
        ax.boxplot(values, vert=True, labels=[metric])
        ax.set_ylabel(metric)
    else:  # "bar"
        ax.bar(labels, values)
        ax.set_ylabel(metric)
        ax.set_xticklabels(labels, rotation=45, ha="right")

    # For typical metrics (AUC/accuracy), clamp 0..1
    if k in {"bar","hbar","line","box"}:
        ax.set_ylim(0, 1)

    ax.set_title(f"Model comparison: {metric}")

    buf = io.BytesIO()
    plt.tight_layout()
    fig.savefig(buf, format="png")
    plt.close(fig)
    return Response(buf.getvalue(), media_type="image/png")
