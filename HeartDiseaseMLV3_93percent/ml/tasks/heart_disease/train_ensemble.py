import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier, StackingClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, brier_score_loss, confusion_matrix, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer


def load_dataframe(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.replace({"?": np.nan, "NA": np.nan, "NaN": np.nan, "nan": np.nan})
    if "target" not in df.columns:
        if "num" in df.columns:
            df["target"] = (pd.to_numeric(df["num"], errors="coerce") > 0).astype(int)
        else:
            raise ValueError("Dataset must contain 'target' or 'num'.")
    # ensure binary target (collapse 0..4 to 0/1 if needed)
    t = pd.to_numeric(df["target"], errors="coerce")
    if t.dropna().nunique() > 2 or (t.max(skipna=True) is not np.nan and t.max(skipna=True) > 1):
        df["target"] = (t > 0).astype(int)
    return df


def split_features(df: pd.DataFrame):
    feature_order = ["age","sex","cp","trestbps","chol","fbs","restecg",
                     "thalach","exang","oldpeak","slope","ca","thal"]
    missing = [c for c in feature_order if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}")

    X = df[feature_order].copy()
    y = df["target"].astype(int)

    # Coerce text-like numerics
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


def evaluate(probs, preds, yte):
    probs = np.asarray(probs).reshape(-1)
    yte = np.asarray(yte).reshape(-1).astype(int)
    metrics = {
        "roc_auc": float(roc_auc_score(yte, probs)),
        "accuracy@0.5": float(accuracy_score(yte, preds)),
        "f1@0.5": float(f1_score(yte, preds)),
        "brier": float(brier_score_loss(yte, probs)),
    }
    tn, fp, fn, tp = confusion_matrix(yte, preds).ravel()
    metrics["confusion@0.5"] = {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}
    return metrics


def main():
    parser = argparse.ArgumentParser(description="Train ensemble heart disease models.")
    parser.add_argument("--data", type=str, required=True, help="Path to CSV dataset")
    args = parser.parse_args()

    df = load_dataframe(Path(args.data))
    X, y, num_cols, cat_cols = split_features(df)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    pre = build_preprocessor(num_cols, cat_cols)

    # Base models
    clf1 = LogisticRegression(max_iter=500, solver="lbfgs")
    clf2 = RandomForestClassifier(n_estimators=200, random_state=42)
    clf3 = GradientBoostingClassifier(random_state=42)
    clf4 = SVC(probability=True, random_state=42)

    # Voting ensemble (soft)
    voting = Pipeline(steps=[
        ("pre", pre),
        ("clf", VotingClassifier(
            estimators=[('lr', clf1), ('rf', clf2), ('gb', clf3), ('svc', clf4)],
            voting='soft'
        ))
    ])

    # Stacking ensemble
    stacking = Pipeline(steps=[
        ("pre", pre),
        ("clf", StackingClassifier(
            estimators=[('lr', clf1), ('rf', clf2), ('gb', clf3)],
            final_estimator=LogisticRegression(max_iter=500),
            cv=5
        ))
    ])

    results = {}
    for name, model in [("Voting", voting), ("Stacking", stacking)]:
        print(f"\n?? Training {name} ensemble...")
        model.fit(Xtr, ytr)
        probs = model.predict_proba(Xte)[:, 1]
        preds = (probs >= 0.5).astype(int)
        results[name] = evaluate(probs, preds, yte)

    out_path = Path(__file__).with_name("ensemble_results.json")
    out_path.write_text(json.dumps(results, indent=2))
    print("\n? All ensembles evaluated. Results saved to:", out_path)
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
