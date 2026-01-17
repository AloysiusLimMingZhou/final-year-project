# ml/tasks/heart_disease/predict_v6.py
import argparse, json
from pathlib import Path
import numpy as np
import pandas as pd
from joblib import load

FEATURES = ["age","sex","cp","trestbps","chol","fbs","restecg",
            "thalach","exang","oldpeak","slope","ca","thal"]

def load_df(p: Path) -> pd.DataFrame:
    df = pd.read_csv(p)
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.replace({"?": np.nan})
    return df

def coerce_binary_target_if_present(df: pd.DataFrame):
    """Return binary y (np.ndarray) if target/num present; otherwise None."""
    if "target" in df.columns:
        t = pd.to_numeric(df["target"], errors="coerce")
        if t.nunique(dropna=True) > 2 or not set(t.dropna().unique()).issubset({0, 1}):
            return (t > 0).astype(int).values
        return t.fillna(0).astype(int).values
    if "num" in df.columns:
        return (pd.to_numeric(df["num"], errors="coerce") > 0).astype(int).values
    return None

def to_pos1d(probs: np.ndarray) -> np.ndarray:
    if probs.ndim == 2 and probs.shape[1] == 2:
        return probs[:, 1]
    if probs.ndim == 2:
        return probs.max(axis=1)
    return probs

def get_threshold(models_dir: Path, model_key: str, override: str | None):
    if override is None or override == "auto":
        tune_path = models_dir / f"tuned_threshold_{model_key}_v6.json"
        if tune_path.exists():
            data = json.loads(tune_path.read_text())
            return float(data["best_by_f1"]["thr"]), "auto(best_by_f1)"
        return 0.5, "default(0.5)"
    try:
        return float(override), "override"
    except Exception:
        raise ValueError(f"Bad --threshold value: {override}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True, help="CSV to score")
    ap.add_argument("--model", required=True, choices=["xgb","lgbm","logreg"])
    ap.add_argument("--threshold", default="auto",
                    help="'auto' (best_by_f1 from tuner) or a float like 0.47")
    ap.add_argument("--skip-metrics", action="store_true",
                    help="Don't compute metrics even if labels exist")
    args = ap.parse_args()

    here = Path(__file__).parent
    model_file = {
        "xgb":   "best_xgb_v6.joblib",
        "lgbm":  "best_lgbm_v6.joblib",
        "logreg":"best_logreg_v6.joblib",
    }[args.model]
    pipe = load(here / model_file)

    thr, src = get_threshold(here, args.model, args.threshold)

    df = load_df(Path(args.data))
    missing = [c for c in FEATURES if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required feature columns in data: {missing}")

    # Keep as DataFrame so pipeline retains feature names
    X = df[FEATURES].copy()
    p_pos = to_pos1d(pipe.predict_proba(X))
    pred = (p_pos >= thr).astype(int)

    out_df = df.copy()
    out_df["p_pos"] = p_pos
    out_df["pred@thr"] = pred
    out_df["threshold_used"] = thr

    report = {}
    if not args.skip_metrics:
        y = coerce_binary_target_if_present(df)
        if y is not None:
            try:
                from sklearn.metrics import (
                    roc_auc_score, accuracy_score, f1_score,
                    brier_score_loss, confusion_matrix
                )
                # AUC: robust for binary/edge cases
                auc = None
                uniq = np.unique(y[~np.isnan(y)])
                if len(uniq) == 2:
                    auc = float(roc_auc_score(y, p_pos, multi_class="ovr"))
                # Confusion matrix: force 2x2 even if a class is missing
                cm = confusion_matrix(y, pred, labels=[0, 1])
                tn, fp, fn, tp = cm.ravel()
                report = {
                    "auc": auc,
                    "acc": float(accuracy_score(y, pred)),
                    "f1": float(f1_score(y, pred)),
                    "brier": float(brier_score_loss(y, p_pos)),
                    "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp),
                }
            except Exception as e:
                report = {"metrics_error": repr(e)}

    out_path = Path(args.data).with_name(f"predictions_{args.model}_v6.csv")
    out_df.to_csv(out_path, index=False)

    print("=== predict v6 ===")
    print(json.dumps({
        "model_file": model_file,
        "threshold": thr,
        "threshold_source": src,
        "scored_rows": int(len(df)),
        "metrics_if_available": report
    }, indent=2))
    print(f"Saved predictions to: {out_path}")

if __name__ == "__main__":
    main()
