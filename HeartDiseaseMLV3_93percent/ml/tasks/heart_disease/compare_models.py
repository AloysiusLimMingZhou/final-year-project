import argparse
import json
import time
from pathlib import Path
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# ---------------------------------------
# Utilities
# ---------------------------------------
THIS = Path(__file__).resolve()
ROOT = THIS.parents[3]          # project root: .../Heart_Disease_ML/
DATA_DIR = ROOT / "data"
TASK_DIR = THIS.parent          # .../ml/tasks/heart_disease/
REGISTRY = ROOT / "ml" / "registry.json"
REPORT_DIR = ROOT / "reports"
REPORT_DIR.mkdir(parents=True, exist_ok=True)

FEATURES = [
    "age","sex","cp","trestbps","chol","fbs","restecg",
    "thalach","exang","oldpeak","slope","ca","thal"
]
BAND_THRESHOLDS = {"low": 0.40, "high": 0.70}


def find_candidate_csvs():
    # Typical names we created earlier + any matching pattern
    patterns = [
        "heart_cleveland.csv",
        "heart_hungary.csv",
        "heart_switzerland.csv",
        "heart_va_long_beach.csv",
        "heart_merged_from_kaggle.csv",
        "heart_merged.csv",
    ]
    found = []
    for pat in patterns:
        p = DATA_DIR / pat
        if p.exists():
            found.append(p)

    # Also include any heart_*.csv the user added
    for p in DATA_DIR.glob("heart_*.csv"):
        if p not in found:
            found.append(p)

    # Deduplicate while preserving order
    uniq = []
    seen = set()
    for p in found:
        if p.resolve() not in seen:
            uniq.append(p)
            seen.add(p.resolve())
    return uniq


def load_df(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.replace({"?": np.nan, "NA": np.nan, "NaN": np.nan, "nan": np.nan})

    # Build target from 'num' if needed
    if "target" not in df.columns:
        if "num" in df.columns:
            df["target"] = (pd.to_numeric(df["num"], errors="coerce") > 0).astype(int)
        else:
            raise ValueError(f"{path.name} must contain 'target' or 'num'.")

    # Verify minimal columns
    missing = [c for c in FEATURES if c not in df.columns]
    if missing:
        raise ValueError(f"{path.name} missing required columns: {missing}")

    # Coerce object→numeric if mostly numeric
    for c in FEATURES:
        if df[c].dtype == "object":
            coerced = pd.to_numeric(df[c], errors="coerce")
            if coerced.notna().mean() >= 0.60:
                df[c] = coerced

    return df


def build_pipeline(num_cols, cat_cols) -> Pipeline:
    num_pipe = Pipeline(
        steps=[
            ("imp", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    cat_pipe = Pipeline(
        steps=[
            ("imp", SimpleImputer(strategy="most_frequent")),
            ("ohe", OneHotEncoder(handle_unknown="ignore")),
        ]
    )
    pre = ColumnTransformer(
        transformers=[("num", num_pipe, num_cols), ("cat", cat_pipe, cat_cols)],
        remainder="drop",
    )
    clf = Pipeline(
        steps=[("pre", pre), ("lr", LogisticRegression(max_iter=500, solver="lbfgs"))]
    )
    return clf


def evaluate(probs, preds, y_true):
    metrics = {
        "roc_auc": float(roc_auc_score(y_true, probs)),
        "accuracy@0.5": float(accuracy_score(y_true, preds)),
        "f1@0.5": float(f1_score(y_true, preds)),
        "precision@0.5": float(precision_score(y_true, preds)),
        "recall@0.5": float(recall_score(y_true, preds)),
        "brier": float(brier_score_loss(y_true, probs)),
    }
    tn, fp, fn, tp = confusion_matrix(y_true, preds).ravel()
    metrics["tn"] = int(tn)
    metrics["fp"] = int(fp)
    metrics["fn"] = int(fn)
    metrics["tp"] = int(tp)
    return metrics


def save_artifact(suffix: str, clf: Pipeline, df: pd.DataFrame, metrics: dict, dataset_rel: str):
    artifact_name = f"artifact_v1_{suffix}.pkl"
    metrics_name = f"metrics_v1_{suffix}.json"
    ARTIFACT = TASK_DIR / artifact_name
    METRICS = TASK_DIR / metrics_name

    num_cols = df[FEATURES].select_dtypes(include=["int64","float64","int32","float32"]).columns.tolist()
    cat_cols = [c for c in FEATURES if c not in num_cols]

    artifact = {
        "task": "heart_disease",
        "model": clf,
        "features": FEATURES,
        "num_cols": num_cols,
        "cat_cols": cat_cols,
        "metrics": {
            **metrics,
            "rows": int(df.shape[0]),
            "cols": int(df.shape[1]),
            "dataset": dataset_rel,
        },
        "trained_at": int(time.time()),
        "band_thresholds": BAND_THRESHOLDS,
    }
    joblib.dump(artifact, ARTIFACT)
    METRICS.write_text(json.dumps(artifact["metrics"], indent=2))
    return ARTIFACT, METRICS


def update_registry_active(artifact_path: Path):
    REGISTRY.parent.mkdir(parents=True, exist_ok=True)
    if REGISTRY.exists():
        reg = json.loads(REGISTRY.read_text())
    else:
        reg = {"tasks": {}}
    # Record relative to project root
    rel = str(artifact_path.relative_to(ROOT))
    reg["tasks"]["heart_disease"] = {"active": rel}
    REGISTRY.write_text(json.dumps(reg, indent=2))
    return rel


def main():
    ap = argparse.ArgumentParser(description="Train and compare heart disease models for multiple datasets.")
    ap.add_argument("--test-size", type=float, default=0.2, help="Test split size (default 0.2)")
    ap.add_argument("--seed", type=int, default=42, help="Random seed (default 42)")
    ap.add_argument("--min-rows", type=int, default=40, help="Skip datasets with <min-rows rows (default 40)")
    ap.add_argument("--activate-best", action="store_true", help="Activate the best model in registry.json")
    args = ap.parse_args()

    csvs = find_candidate_csvs()
    if not csvs:
        raise SystemExit(f"No datasets found under {DATA_DIR}. Place heart_*.csv files there.")

    results = []
    for p in csvs:
        try:
            df = load_df(p)
            if df.shape[0] < args.min_rows:
                print(f"~ Skipping {p.name}: only {df.shape[0]} rows (< {args.min_rows})")
                continue

            X = df[FEATURES].copy()
            y = df["target"].astype(int)
            # Split numeric vs categorical after coercion
            num_cols = X.select_dtypes(include=["int64","float64","int32","float32"]).columns.tolist()
            cat_cols = [c for c in FEATURES if c not in num_cols]

            clf = build_pipeline(num_cols, cat_cols)
            Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=args.test_size, stratify=y, random_state=args.seed)
            clf.fit(Xtr, ytr)
            probs = clf.predict_proba(Xte)[:, 1]
            preds = (probs >= 0.5).astype(int)
            m = evaluate(probs, preds, yte)

            # Suffix from filename (e.g., heart_cleveland.csv → cleveland)
            base = p.stem
            suffix = base.replace("heart_", "")
            dataset_rel = str(p.relative_to(ROOT)) if str(p).startswith(str(ROOT)) else str(p)

            art_path, met_path = save_artifact(suffix, clf, df, m, dataset_rel)

            row = {
                "dataset": base,
                "rows": df.shape[0],
                "artifact": str(art_path.relative_to(ROOT)),
                "metrics_file": str(met_path.relative_to(ROOT)),
                "roc_auc": m["roc_auc"],
                "accuracy@0.5": m["accuracy@0.5"],
                "f1@0.5": m["f1@0.5"],
                "precision@0.5": m["precision@0.5"],
                "recall@0.5": m["recall@0.5"],
                "brier": m["brier"],
                "tn": m["tn"], "fp": m["fp"], "fn": m["fn"], "tp": m["tp"],
            }
            results.append(row)
            print(f"✅ Trained on {p.name} | AUC={row['roc_auc']:.3f} | saved → {art_path.name}")
        except Exception as e:
            print(f"! Failed on {p.name}: {e}")

    if not results:
        raise SystemExit("No models trained. Check datasets and try again.")

    # Build report
    ts = datetime.now().strftime("%Y%m%d_%H%M")
    report_csv = REPORT_DIR / f"model_comparison_{ts}.csv"
    report_md  = REPORT_DIR / f"model_comparison_{ts}.md"

    dfres = pd.DataFrame(results).sort_values(by="roc_auc", ascending=False)
    dfres.to_csv(report_csv, index=False)

    # Markdown summary
    md = ["# Heart Disease Model Comparison",
          f"_Generated: {ts}_",
          "",
          "| dataset | rows | roc_auc | accuracy@0.5 | f1@0.5 | brier | artifact |",
          "|---|---:|---:|---:|---:|---:|---|"]
    for r in dfres.to_dict(orient="records"):
        md.append(f"| {r['dataset']} | {r['rows']} | {r['roc_auc']:.3f} | {r['accuracy@0.5']:.3f} | {r['f1@0.5']:.3f} | {r['brier']:.3f} | `{r['artifact']}` |")
    report_md.write_text("\n".join(md), encoding="utf-8")

    print("\n📊 Comparison report:")
    print(" CSV:", report_csv)
    print(" MD :", report_md)

    if args.activate_best:
        best_artifact = ROOT / dfres.iloc[0]["artifact"]
        rel = update_registry_active(best_artifact)
        print(f"⭐ Activated best model in registry → {rel}")


if __name__ == "__main__":
    main()
