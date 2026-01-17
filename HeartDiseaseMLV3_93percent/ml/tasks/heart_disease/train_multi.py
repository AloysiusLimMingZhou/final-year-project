import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, brier_score_loss, confusion_matrix, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def load_dataframe(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.replace({"?": np.nan, "NA": np.nan, "NaN": np.nan, "nan": np.nan})

    if "target" not in df.columns:
        # Some UCI files use 'num' (0..4). Convert to binary.
        if "num" in df.columns:
            df["target"] = (pd.to_numeric(df["num"], errors="coerce") > 0).astype(int)
        else:
            raise ValueError("Dataset must contain 'target' (0/1) or 'num' (0..4).")

    # If target looks multiclass (0..4), collapse to binary 0/1
    t = pd.to_numeric(df["target"], errors="coerce")
    if t.dropna().nunique() > 2 or (t.max(skipna=True) is not np.nan and t.max(skipna=True) > 1):
        df["target"] = (t > 0).astype(int)

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

    # Coerce textual numbers to numeric when ≥60% parseable
    for c in X.columns:
        if X[c].dtype == "object":
            coerced = pd.to_numeric(X[c], errors="coerce")
            if coerced.notna().mean() >= 0.60:
                X[c] = coerced

    num_cols = X.select_dtypes(include=["int64","float64","int32","float32"]).columns.tolist()
    cat_cols = [c for c in X.columns if c not in num_cols]
    return X, y, num_cols, cat_cols, feature_order


def build_pipeline(num_cols, cat_cols, clf) -> Pipeline:
    num_pipe = Pipeline(steps=[
        ("imp", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    cat_pipe = Pipeline(steps=[
        ("imp", SimpleImputer(strategy="most_frequent")),
        ("ohe", OneHotEncoder(handle_unknown="ignore"))
    ])
    pre = ColumnTransformer(
        transformers=[("num", num_pipe, num_cols), ("cat", cat_pipe, cat_cols)],
        remainder="drop"
    )
    return Pipeline(steps=[("pre", pre), ("clf", clf)])


def evaluate(probs_1d, preds, y_true):
    # probs_1d must be positive-class probability, shape (n_samples,)
    probs_1d = np.asarray(probs_1d).reshape(-1)
    y_true = np.asarray(y_true).astype(int).reshape(-1)

    return {
        "roc_auc": float(roc_auc_score(y_true, probs_1d)),
        "accuracy@0.5": float(accuracy_score(y_true, preds)),
        "f1@0.5": float(f1_score(y_true, preds)),
        "brier": float(brier_score_loss(y_true, probs_1d)),
        "confusion@0.5": dict(zip(
            ["tn","fp","fn","tp"],
            [int(x) for x in confusion_matrix(y_true, preds).ravel()]
        ))
    }


def main():
    ap = argparse.ArgumentParser(description="Compare multiple classifiers on UCI Heart dataset.")
    ap.add_argument("--data", required=True, help="Path to CSV (e.g., ./data/cleveland.csv or heart4_merged.csv)")
    args = ap.parse_args()

    df = load_dataframe(Path(args.data))
    X, y, num_cols, cat_cols, _ = split_features(df)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    classifiers = {
        "LogisticRegression": LogisticRegression(max_iter=500, solver="lbfgs"),
        "RandomForest":      RandomForestClassifier(n_estimators=200, random_state=42),
        "GradientBoosting":  GradientBoostingClassifier(random_state=42),
        "SVC":               SVC(probability=True, kernel="rbf", random_state=42),
        "KNN":               KNeighborsClassifier(n_neighbors=7),
        "DecisionTree":      DecisionTreeClassifier(random_state=42),
    }

    results = {}
    for name, base_clf in classifiers.items():
        print(f"\n🔹 Training {name}...")
        pipe = build_pipeline(num_cols, cat_cols, base_clf)
        pipe.fit(Xtr, ytr)

        # Positive-class probabilities as 1-D vector
        if hasattr(pipe, "predict_proba"):
            p = pipe.predict_proba(Xte)
            probs = p[:, 1] if p.ndim == 2 else p
        elif hasattr(pipe, "decision_function"):
            d = pipe.decision_function(Xte)
            d = np.asarray(d).reshape(-1)
            dmin, dmax = d.min(), d.max()
            probs = (d - dmin) / (dmax - dmin + 1e-12)
        else:
            # Last resort: hard predictions only → treat as 0/1 probs
            probs = pipe.predict(Xte).astype(float)

        preds = (probs >= 0.5).astype(int)
        results[name] = evaluate(probs, preds, yte)

    out = Path("ml/tasks/heart_disease/multi_results.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(results, indent=2))

    print("\n✅ All classifiers evaluated. Results saved to:", out)
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
