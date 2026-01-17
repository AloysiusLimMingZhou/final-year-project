# ml/tasks/heart_disease/merge_predictions_v6.py
import argparse
from pathlib import Path
import pandas as pd
import numpy as np

FEATURES = ["age","sex","cp","trestbps","chol","fbs","restecg",
            "thalach","exang","oldpeak","slope","ca","thal"]

def load_preds(path: Path, tag: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    # normalize column names
    df.columns = [c.strip() for c in df.columns]
    # must have p_pos and (optionally) threshold_used
    if "p_pos" not in df.columns:
        raise ValueError(f"{path} is missing 'p_pos' column. Re-run predict_v6 first.")
    out = pd.DataFrame()
    out["p_pos_"+tag] = pd.to_numeric(df["p_pos"], errors="coerce")
    if "threshold_used" in df.columns:
        out["threshold_used_"+tag] = pd.to_numeric(df["threshold_used"], errors="coerce")
    else:
        out["threshold_used_"+tag] = 0.5
    # keep features (best-effort, if present)
    for f in FEATURES:
        if f in df.columns:
            out[f] = pd.to_numeric(df[f], errors="coerce")
    return out.reset_index(drop=True)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--xgb", type=str, help="predictions_xgb_v6.csv")
    ap.add_argument("--lgbm", type=str, help="predictions_lgbm_v6.csv")
    ap.add_argument("--logreg", type=str, help="predictions_logreg_v6.csv")
    ap.add_argument("--out", type=str, required=True, help="output CSV")
    ap.add_argument("--topk", type=int, default=0, help="also write top-K by ensemble prob")
    ap.add_argument("--weights", type=str, default="1,1,1",
                    help="optional weights for xgb,lgbm,logreg (e.g. 0.4,0.4,0.2)")
    args = ap.parse_args()

    weights = [float(x) for x in args.weights.split(",")]
    if len(weights) != 3:
        raise ValueError("--weights must have 3 numbers for xgb,lgbm,logreg")

    frames = []
    tags = []
    if args.xgb:
        frames.append(load_preds(Path(args.xgb), "xgb")); tags.append("xgb")
    if args.lgbm:
        frames.append(load_preds(Path(args.lgbm), "lgbm")); tags.append("lgbm")
    if args.logreg:
        frames.append(load_preds(Path(args.logreg), "logreg")); tags.append("logreg")
    if not frames:
        raise ValueError("Provide at least one of --xgb/--lgbm/--logreg")

    # align rows by order
    merged = frames[0]
    for f in frames[1:]:
        merged = merged.join(f, how="inner", rsuffix="_r")

    # compute per-model preds from its own threshold
    for t in tags:
        p = merged[f"p_pos_{t}"].astype(float)
        thr = merged[f"threshold_used_{t}"].astype(float)
        merged[f"pred_{t}"] = (p >= thr).astype(int)

    # ensemble (weighted average over the provided models only)
    w_map = dict(zip(["xgb","lgbm","logreg"], weights))
    use_tags = [t for t in tags if f"p_pos_{t}" in merged.columns]
    w = np.array([w_map[t] for t in use_tags], dtype=float)
    if w.sum() == 0:
        w = np.ones_like(w)
    w = w / w.sum()

    probs = np.column_stack([merged[f"p_pos_{t}"].astype(float).values for t in use_tags])
    merged["ensemble_prob"] = (probs * w).sum(axis=1)

    # Default ensemble threshold = average of model thresholds (feel free to change)
    thr_vals = [merged[f"threshold_used_{t}"].astype(float).values for t in use_tags]
    merged["threshold_used_ensemble"] = np.vstack(thr_vals).mean(axis=0)
    merged["pred_ensemble"] = (merged["ensemble_prob"] >= merged["threshold_used_ensemble"]).astype(int)

    # arrange columns
    ordered = [*FEATURES]
    for t in ["xgb","lgbm","logreg"]:
        if f"p_pos_{t}" in merged.columns:
            ordered += [f"p_pos_{t}", f"threshold_used_{t}", f"pred_{t}"]
    ordered += ["ensemble_prob", "threshold_used_ensemble", "pred_ensemble"]

    # keep only available columns in that order
    ordered = [c for c in ordered if c in merged.columns]
    merged[ordered].to_csv(args.out, index=False)

    # optional top-k
    if args.topk and args.topk > 0:
        top_path = Path(args.out).with_name(Path(args.out).stem + f"_top{args.topk}.csv")
        merged.sort_values("ensemble_prob", ascending=False)[ordered].head(args.topk).to_csv(top_path, index=False)
        print(f"Wrote top-{args.topk} by ensemble prob -> {top_path}")
    print("=== merged predictions v6 ===")
    print({
        "rows": int(len(merged)),
        **{f"thr_{t}": float(merged[f'threshold_used_{t}'].iloc[0]) for t in tags},
        "thr_ensemble_avg": float(merged["threshold_used_ensemble"].iloc[0]),
        "out": str(args.out),
        "weights_used": {t: w_map[t] for t in tags}
    })

if __name__ == "__main__":
    main()
