import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier, VotingClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, brier_score_loss, confusion_matrix,
                             f1_score, roc_auc_score)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


# ----------------------------
# Data loader
# ----------------------------
def load_dataframe(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.replace({"?": np.nan, "NA": np.nan, "NaN": np.nan, "nan": np.nan})
    # derive target if only 'num' present
    if "target" not in df.columns:
        if "num" in df.columns:
            df["target"] = (pd.to_numeric(df["num"], errors="coerce") > 0).astype(int)
        else:
            raise ValueError("Dataset must contain 'target' or 'num'.")
    # ensure strictly binary 0/1 ints
    df["target"] = (pd.to_numeric(df["target"], errors="coerce") > 0).astype(int)
    return df


def split_features(df: pd.DataFrame):
    feature_order = [
        "age","sex","cp","trestbps","chol","fbs",
        "restecg","thalach","exang","oldpeak","slope","ca","thal"
    ]
    missing = [c for c in feature_order if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}")

    X = df[feature_order].copy()
    y = df["target"].astype(int).values

    # convert object columns that are mostly numeric
    for c in X.columns:
        if X[c].dtype == "object":
            coerced = pd.to_numeric(X[c], errors="coerce")
            if coerced.notna().mean() >= 0.60:
                X[c] = coerced

    num_cols = X.select_dtypes(include=["int64","float64","int32","float32"]).columns.tolist()
    cat_cols = [c for c in X.columns if c not in num_cols]
    return X, y, num_cols, cat_cols


def build_preprocessor(num_cols, cat_cols):
    num_pipe = Pipeline(steps=[
        ("imp", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    cat_pipe = Pipeline(steps=[
        ("imp", SimpleImputer(strategy="most_frequent")),
        ("ohe", OneHotEncoder(handle_unknown="ignore"))
    ])
    return ColumnTransformer(
        transformers=[("num", num_pipe, num_cols), ("cat", cat_pipe, cat_cols)]
    )


def evaluate(probs_1d, preds, yte):
    # force 1D numpy arrays
    probs_1d = np.asarray(probs_1d).reshape(-1)
    yte = np.asarray(yte).reshape(-1).astype(int)

    # sanity check
    if probs_1d.ndim != 1:
        raise RuntimeError(f"Expected 1D probs, got shape {probs_1d.shape}")

    metrics = {
        "roc_auc": float(roc_auc_score(yte, probs_1d)),
        "accuracy@0.5": float(accuracy_score(yte, preds)),
        "f1@0.5": float(f1_score(yte, preds)),
        "brier": float(brier_score_loss(yte, probs_1d)),
    }
    tn, fp, fn, tp = confusion_matrix(yte, preds).ravel()
    metrics["confusion@0.5"] = {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}
    return metrics


def proba_of_positive(predict_proba_output, classes_):
    """
    Given predict_proba(X) output (n_samples, n_classes) and classes_,
    return a 1D vector of P(y=1). Works even if class order != [0,1].
    """
    proba = np.asarray(predict_proba_output)
    if proba.ndim == 1:
        # already 1D (rare): assume it's P(y=1)
        return proba
    if proba.ndim == 2 and proba.shape[1] == 1:
        # single column: already positive class probs
        return proba[:, 0]
    if proba.ndim == 2 and proba.shape[1] >= 2:
        classes_ = np.asarray(classes_)
        # find index of class label 1 if present, else fall back to the highest column
        if (classes_ == 1).any():
            idx = int(np.where(classes_ == 1)[0][0])
        else:
            # fallback: assume the "positive" class is the max column
            idx = int(np.argmax(classes_))
        return proba[:, idx]
    raise RuntimeError(f"Unexpected predict_proba shape: {proba.shape}")


# ----------------------------
# Main
# ----------------------------
def main():
    parser = argparse.ArgumentParser(description="Weighted Voting ensemble for heart disease")
    parser.add_argument("--data", type=str, required=True, help="Path to CSV dataset")
    args = parser.parse_args()

    df = load_dataframe(Path(args.data))
    X, y, num_cols, cat_cols = split_features(df)
    pre = build_preprocessor(num_cols, cat_cols)

    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    # Base models
    lr = LogisticRegression(max_iter=500, solver="lbfgs", n_jobs=None)
    rf = RandomForestClassifier(n_estimators=200, random_state=42)
    gb = GradientBoostingClassifier(random_state=42)

    # Weighted soft-voting (favor RF, GB)
    voting = VotingClassifier(
        estimators=[("lr", lr), ("rf", rf), ("gb", gb)],
        voting="soft",
        weights=[2, 5, 3]
    )

    model = Pipeline(steps=[("pre", pre), ("clf", voting)])
    model.fit(Xtr, ytr)

    # Get proba for positive class using the *inner* voting classifier's classes_
    inner = model.named_steps["clf"]
    probs1 = proba_of_positive(model.predict_proba(Xte), inner.classes_)
    preds = model.predict(Xte)

    metrics = evaluate(probs1, preds, yte)

    out_path = Path(__file__).with_name("ensemble_results_v2.json")
    out_path.write_text(json.dumps({"WeightedVoting": metrics}, indent=2))
    print("? Weighted Voting Ensemble done.")
    print(json.dumps({"WeightedVoting": metrics}, indent=2))
    print(f"?? Results saved to: {out_path}")


if __name__ == "__main__":
    main()
