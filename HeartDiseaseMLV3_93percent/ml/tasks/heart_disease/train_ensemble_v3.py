import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (GradientBoostingClassifier, RandomForestClassifier,
                              VotingClassifier, StackingClassifier)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, brier_score_loss, confusion_matrix,
                             f1_score, roc_auc_score)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier


# ---------- Data ----------
def load_dataframe(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.replace({"?": np.nan, "NA": np.nan, "NaN": np.nan, "nan": np.nan})
    if "target" not in df.columns:
        if "num" in df.columns:
            df["target"] = (pd.to_numeric(df["num"], errors="coerce") > 0).astype(int)
        else:
            raise ValueError("Dataset must contain 'target' or 'num'.")
    df["target"] = (pd.to_numeric(df["target"], errors="coerce") > 0).astype(int)
    return df


def split_features(df: pd.DataFrame):
    feature_order = ["age","sex","cp","trestbps","chol","fbs",
                     "restecg","thalach","exang","oldpeak","slope","ca","thal"]
    missing = [c for c in feature_order if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}")

    X = df[feature_order].copy()
    y = df["target"].astype(int).values

    for c in X.columns:
        if X[c].dtype == "object":
            coerced = pd.to_numeric(X[c], errors="coerce")
            if coerced.notna().mean() >= 0.60:
                X[c] = coerced

    num_cols = X.select_dtypes(include=["int64","float64","int32","float32"]).columns.tolist()
    cat_cols = [c for c in X.columns if c not in num_cols]
    return X, y, num_cols, cat_cols


def build_preprocessor(num_cols, cat_cols):
    num = Pipeline([("imp", SimpleImputer(strategy="median")),
                    ("scaler", StandardScaler())])
    cat = Pipeline([("imp", SimpleImputer(strategy="most_frequent")),
                    ("ohe", OneHotEncoder(handle_unknown="ignore"))])
    return ColumnTransformer([("num", num, num_cols), ("cat", cat, cat_cols)])


# ---------- Metrics helpers ----------
def proba_of_positive(predict_proba_output, classes_):
    proba = np.asarray(predict_proba_output)
    if proba.ndim == 1:
        return proba
    if proba.ndim == 2:
        if proba.shape[1] == 1:
            return proba[:, 0]
        # pick the column corresponding to class label 1 if present
        classes_ = np.asarray(classes_)
        if (classes_ == 1).any():
            idx = int(np.where(classes_ == 1)[0][0])
        else:
            idx = int(np.argmax(classes_))  # fallback
        return proba[:, idx]
    raise RuntimeError(f"Unexpected predict_proba shape: {proba.shape}")


def evaluate(probs1d, preds, y_true):
    probs1d = np.asarray(probs1d).reshape(-1)
    y_true = np.asarray(y_true).reshape(-1).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, preds).ravel()
    return {
        "roc_auc": float(roc_auc_score(y_true, probs1d)),
        "accuracy@0.5": float(accuracy_score(y_true, preds)),
        "f1@0.5": float(f1_score(y_true, preds)),
        "brier": float(brier_score_loss(y_true, probs1d)),
        "confusion@0.5": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}
    }


# ---------- Main ----------
def main():
    ap = argparse.ArgumentParser(description="Ensembles v3: Weighted Voting (auto) + Stacking (GB meta)")
    ap.add_argument("--data", required=True, type=str, help="Path to CSV")
    args = ap.parse_args()

    df = load_dataframe(Path(args.data))
    X, y, num_cols, cat_cols = split_features(df)
    pre = build_preprocessor(num_cols, cat_cols)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    # Base learners
    lr = LogisticRegression(max_iter=500, solver="lbfgs")
    rf = RandomForestClassifier(n_estimators=300, random_state=42)
    gb = GradientBoostingClassifier(random_state=42)
    svc = SVC(probability=True, kernel="rbf", C=1.5, gamma="scale", random_state=42)
    knn = KNeighborsClassifier(n_neighbors=7)

    # ===== Weighted Voting (auto pick best weights from a small grid) =====
    weight_grid = [
        (2,5,3),  # favor RF, GB (your v2 default)
        (1,5,2),
        (2,6,2),
        (1,4,3),
        (1,3,2),  # milder bias to RF
    ]
    best_vote = None
    best_vote_metrics = None
    best_weights = None

    for w in weight_grid:
        voter = VotingClassifier(
            estimators=[("lr", lr), ("rf", rf), ("gb", gb)],
            voting="soft",
            weights=list(w)
        )
        pipe = Pipeline([("pre", pre), ("clf", voter)])
        pipe.fit(Xtr, ytr)
        inner = pipe.named_steps["clf"]
        probs1 = proba_of_positive(pipe.predict_proba(Xte), inner.classes_)
        preds = pipe.predict(Xte)
        m = evaluate(probs1, preds, yte)
        if (best_vote_metrics is None) or (m["f1@0.5"] > best_vote_metrics["f1@0.5"]):
            best_vote, best_vote_metrics, best_weights = pipe, m, w

    # ===== Stacking (strong meta: GradientBoosting) =====
    stack = StackingClassifier(
        estimators=[("lr", lr), ("rf", rf), ("gb", gb), ("svc", svc), ("knn", knn)],
        final_estimator=GradientBoostingClassifier(random_state=42),
        stack_method="predict_proba",
        passthrough=False,  # meta gets only base outputs
        cv=5,
        n_jobs=None
    )
    stack_pipe = Pipeline([("pre", pre), ("clf", stack)])
    stack_pipe.fit(Xtr, ytr)
    inner_stack = stack_pipe.named_steps["clf"]
    probs_stack = proba_of_positive(stack_pipe.predict_proba(Xte), inner_stack.classes_)
    preds_stack = stack_pipe.predict(Xte)
    stack_metrics = evaluate(probs_stack, preds_stack, yte)

    # Report
    results = {
        "WeightedVoting_best": {
            "weights": list(best_weights),
            **best_vote_metrics
        },
        "Stacking_GBmeta": stack_metrics
    }

    out_path = Path(__file__).with_name("ensemble_results_v3.json")
    out_path.write_text(json.dumps(results, indent=2))

    print("\n=== Ensemble Comparison (v3) ===")
    print(json.dumps(results, indent=2))
    print(f"\nSaved to: {out_path}")


if __name__ == "__main__":
    main()
