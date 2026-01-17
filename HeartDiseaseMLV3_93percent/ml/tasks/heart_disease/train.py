import argparse
import json
import time
from pathlib import Path

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
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def infer_project_root(this_file: Path) -> Path:
    # .../ml/tasks/heart_disease/train.py  → project root is parents[3]
    return this_file.resolve().parents[3]


def choose_dataset(root: Path, cli_data: str | None) -> Path:
    if cli_data:
        p = Path(cli_data)
        if not p.is_absolute():
            p = root / p
        if not p.exists():
            raise FileNotFoundError(f"--data not found: {p}")
        return p

    # default: cleveland.csv if present
    cleveland = root / "data" / "cleveland.csv"
    merged = root / "data" / "heart4_merged.csv"
    if merged.exists():
        return merged
    if cleveland.exists():
        return cleveland

    raise FileNotFoundError("No dataset found in ./data (expected cleveland.csv or heart4_merged.csv)")


def load_dataframe(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.replace({"?": np.nan, "NA": np.nan, "NaN": np.nan, "nan": np.nan})

    # make binary target if only 0..4
    if "target" not in df.columns:
        raise ValueError("Dataset must contain 'target' column.")

    if df["target"].dropna().max() > 1:
        df["target"] = (pd.to_numeric(df["target"], errors="coerce") > 0).astype(int)

    return df


def split_features(df: pd.DataFrame):
    feature_order = [
        "age","sex","cp","trestbps","chol","fbs","restecg",
        "thalach","exang","oldpeak","slope","ca","thal"
    ]
    missing = [c for c in feature_order if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}")

    X = df[feature_order].copy()
    y = df["target"].astype(int)

    for c in X.columns:
        if X[c].dtype == "object":
            coerced = pd.to_numeric(X[c], errors="coerce")
            if coerced.notna().mean() >= 0.60:
                X[c] = coerced

    num_cols = X.select_dtypes(include=["int64","float64","int32","float32"]).columns.tolist()
    cat_cols = [c for c in X.columns if c not in num_cols]
    return X, y, num_cols, cat_cols, feature_order


def build_pipeline(num_cols, cat_cols) -> Pipeline:
    num_pipe = Pipeline(
        steps=[("imp", SimpleImputer(strategy="median")), ("scaler", StandardScaler())]
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


def evaluate(probs, preds, yte):
    metrics = {
        "roc_auc": float(roc_auc_score(yte, probs)),
        "accuracy@0.5": float(accuracy_score(yte, preds)),
        "f1@0.5": float(f1_score(yte, preds)),
        "brier": float(brier_score_loss(yte, probs)),
    }
    tn, fp, fn, tp = confusion_matrix(yte, preds).ravel()
    metrics["confusion@0.5"] = {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}
    return metrics


def save_artifacts(artifact_path: Path, metrics_path: Path, artifact: dict, metrics: dict):
    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, artifact_path)
    metrics_path.write_text(json.dumps(metrics, indent=2))


def update_registry(registry_path: Path, artifact_rel_path: str):
    registry_path.parent.mkdir(parents=True, exist_ok=True)
    if registry_path.exists():
        reg = json.loads(registry_path.read_text())
    else:
        reg = {"tasks": {}}
    reg["tasks"]["heart_disease"] = {"active": artifact_rel_path}
    registry_path.write_text(json.dumps(reg, indent=2))


def main():
    parser = argparse.ArgumentParser(description="Train heart disease model.")
    parser.add_argument("--data", type=str, default=None, help="Path to CSV in ./data/")
    parser.add_argument("--artifact_suffix", type=str, default="", help="Suffix for artifact/metrics names, e.g. _cleveland, _hungary, _merged.")
    parser.add_argument("--activate", action="store_true", help="If set, update ml/registry.json to point to the new artifact.")
    args = parser.parse_args()

    THIS = Path(__file__)
    ROOT = infer_project_root(THIS)

    data_path = choose_dataset(ROOT, args.data)
    print(f"📄 Using dataset: {data_path}")

    df = load_dataframe(data_path)
    X, y, num_cols, cat_cols, feature_order = split_features(df)

    clf = build_pipeline(num_cols, cat_cols)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    clf.fit(Xtr, ytr)

    probs = clf.predict_proba(Xte)[:, 1]
    preds = (probs >= 0.5).astype(int)
    m = evaluate(probs, preds, yte)

    suffix = args.artifact_suffix.strip()
    base_name = f"artifact_v1{suffix}.pkl" if suffix else "artifact_v1.pkl"
    metrics_name = f"metrics_v1{suffix}.json" if suffix else "metrics_v1.json"

    ARTIFACT = THIS.with_name(base_name)
    METRICS = THIS.with_name(metrics_name)
    REGISTRY = ROOT / "ml" / "registry.json"

    artifact = {
        "task": "heart_disease",
        "model": clf,
        "features": feature_order,
        "num_cols": num_cols,
        "cat_cols": cat_cols,
        "metrics": {
            **m,
            "rows": int(df.shape[0]),
            "cols": int(df.shape[1]),
            "dataset": str(data_path.relative_to(ROOT)) if str(data_path).startswith(str(ROOT)) else str(data_path),
        },
        "trained_at": int(time.time()),
        "band_thresholds": {"low": 0.40, "high": 0.70},
        "label": base_name.replace(".pkl", ""),
    }

    save_artifacts(ARTIFACT, METRICS, artifact, artifact["metrics"])
    print("✅ Model training complete")
    print("📦 Saved artifact:", ARTIFACT)
    print("📊 Metrics:", json.dumps(artifact["metrics"], indent=2))

    if args.activate:
        rel_path = str(ARTIFACT.relative_to(ROOT))
        update_registry(REGISTRY, rel_path)
        print("🗂 Updated registry:", REGISTRY)
        print("⭐ Active artifact set to:", rel_path)
    else:
        print("ℹ️ Not activating in registry (use --activate to set active model).")


if __name__ == "__main__":
    main()
