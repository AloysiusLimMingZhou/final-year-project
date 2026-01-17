import argparse, json
from pathlib import Path
import numpy as np
import pandas as pd

from joblib import load
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    roc_auc_score, accuracy_score, f1_score, brier_score_loss,
    confusion_matrix, precision_recall_curve, roc_curve
)

FEATURES = ["age","sex","cp","trestbps","chol","fbs","restecg",
            "thalach","exang","oldpeak","slope","ca","thal"]

def load_df(p: Path) -> pd.DataFrame:
    df = pd.read_csv(p)
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.replace({"?": np.nan})
    if "target" in df.columns:
        t = pd.to_numeric(df["target"], errors="coerce")
        if t.nunique(dropna=True) > 2 or not set(t.dropna().unique()).issubset({0, 1}):
            df["target"] = (t > 0).astype(int)
        else:
            df["target"] = t.astype(int)
    elif "num" in df.columns:
        t = pd.to_numeric(df["num"], errors="coerce")
        df["target"] = (t > 0).astype(int)
    else:
        raise ValueError("Need a 'target' or 'num' column")
    return df[df["target"].isin([0, 1])].copy()

def to_pos1d(probs: np.ndarray) -> np.ndarray:
    if probs.ndim == 2 and probs.shape[1] == 2:
        return probs[:, 1]
    if probs.ndim == 2:
        return probs.max(axis=1)
    return probs

def sweep(y_true, p_pos, thresholds):
    rows = []
    for t in thresholds:
        pred = (p_pos >= t).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true, pred).ravel()
        rows.append({
            "thr": float(t),
            "f1": float(f1_score(y_true, pred)),
            "acc": float(accuracy_score(y_true, pred)),
            "brier": float(brier_score_loss(y_true, p_pos)),
            "youdenJ": float(tp/(tp+fn) + tn/(tn+fp) - 1.0),
            "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)
        })
    return rows

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True, help="CSV path used in training")
    ap.add_argument("--model", required=True, choices=["xgb","lgbm","logreg"])
    ap.add_argument("--n", type=int, default=100, help="#thresholds in sweep")
    args = ap.parse_args()

    here = Path(__file__).parent
    model_file = {
        "xgb":   "best_xgb_v6.joblib",
        "lgbm":  "best_lgbm_v6.joblib",
        "logreg":"best_logreg_v6.joblib",
    }[args.model]

    pipe = load(here / model_file)

    df = load_df(Path(args.data))
    X = df[FEATURES].copy()
    y = df["target"].astype(int).values

    # same split as trainers
    Xtr, Xte, ytr, yte = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    p_pos = to_pos1d(pipe.predict_proba(Xte))

    # baseline @0.5
    base_pred = (p_pos >= 0.5).astype(int)
    base_tn, base_fp, base_fn, base_tp = confusion_matrix(yte, base_pred).ravel()
    baseline = {
        "thr": 0.5,
        "auc": float(roc_auc_score(yte, p_pos)),
        "acc": float(accuracy_score(yte, base_pred)),
        "f1": float(f1_score(yte, base_pred)),
        "brier": float(brier_score_loss(yte, p_pos)),
        "tn": int(base_tn), "fp": int(base_fp), "fn": int(base_fn), "tp": int(base_tp)
    }

    thresholds = np.linspace(0.01, 0.99, args.n)
    grid = sweep(yte, p_pos, thresholds)

    best_f1 = max(grid, key=lambda r: r["f1"])
    best_j  = max(grid, key=lambda r: r["youdenJ"])

    # curves (points only; easy to plot later if you want)
    fpr, tpr, roc_thr = roc_curve(yte, p_pos)
    pr_prec, pr_rec, pr_thr = precision_recall_curve(yte, p_pos)

    out = {
        "dataset": str(Path(args.data)),
        "model_file": model_file,
        "baseline@0.5": baseline,
        "best_by_f1": best_f1,
        "best_by_youdenJ": best_j,
        "roc_points": {"fpr": fpr.tolist(), "tpr": tpr.tolist(), "thr": roc_thr.tolist()},
        "pr_points": {"precision": pr_prec.tolist(), "recall": pr_rec.tolist(), "thr": pr_thr.tolist()},
        "grid": grid
    }

    out_path = here / f"tuned_threshold_{args.model}_v6.json"
    out_path.write_text(json.dumps(out, indent=2))
    print("=== threshold tuning v6 ===")
    print(json.dumps({k: out[k] for k in ["model_file","baseline@0.5","best_by_f1","best_by_youdenJ"]}, indent=2))
    print(f"Saved to: {out_path}")

if __name__ == "__main__":
    main()
