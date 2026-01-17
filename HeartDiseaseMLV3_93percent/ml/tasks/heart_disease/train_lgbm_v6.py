import argparse, json, warnings
from pathlib import Path
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    roc_auc_score, accuracy_score, f1_score, brier_score_loss, confusion_matrix
)

from lightgbm import LGBMClassifier

warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

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

def split_feats(df: pd.DataFrame):
    X = df[FEATURES].copy()
    y = df["target"].astype(int).values

    for c in X.columns:
        if X[c].dtype == "object":
            coerced = pd.to_numeric(X[c], errors="coerce")
            if coerced.notna().mean() >= 0.6:
                X[c] = coerced

    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = [c for c in X.columns if c not in num_cols]
    return X, y, num_cols, cat_cols

def preprocessor(num_cols, cat_cols):
    num_pipe = Pipeline([("imp", SimpleImputer(strategy="median")),
                         ("sc", StandardScaler())])
    cat_pipe = Pipeline([("imp", SimpleImputer(strategy="most_frequent")),
                         ("ohe", OneHotEncoder(handle_unknown="ignore"))])
    return ColumnTransformer([("num", num_pipe, num_cols),
                              ("cat", cat_pipe, cat_cols)])

def to_pos1d(probs: np.ndarray) -> np.ndarray:
    if probs.ndim == 2 and probs.shape[1] == 2:
        return probs[:, 1]
    if probs.ndim == 2:
        return probs.max(axis=1)
    return probs

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    args = ap.parse_args()

    df = load_df(Path(args.data))
    X, y, num_cols, cat_cols = split_feats(df)
    pre = preprocessor(num_cols, cat_cols)

    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    lgb = LGBMClassifier(
        objective="binary",
        n_estimators=400,
        learning_rate=0.03,
        num_leaves=31,
        subsample=0.9,
        colsample_bytree=0.9,
        min_child_samples=20,
        reg_lambda=1.0,
        verbose=-1,
        random_state=42
    )

    pipe = Pipeline([("pre", pre), ("clf", lgb)])

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    grid = {
        "clf__n_estimators": [200, 400, 600],
        "clf__learning_rate": [0.03, 0.05],
        "clf__num_leaves": [15, 31, 63],
        "clf__subsample": [0.8, 0.9, 1.0],
        "clf__colsample_bytree": [0.7, 0.9, 1.0],
    }

    gs = GridSearchCV(pipe, grid, scoring="roc_auc", cv=cv, n_jobs=-1, refit=True, verbose=0)
    gs.fit(Xtr, ytr)

    from joblib import dump
    dump(gs.best_estimator_, Path(__file__).with_name("best_lgbm_v6.joblib"))

    best = gs.best_estimator_
    probs1d = to_pos1d(best.predict_proba(Xte))
    preds = (probs1d >= 0.5).astype(int)

    metrics = {
        "dataset": str(Path(args.data)),
        "best_params": gs.best_params_,
        "cv_best_roc_auc": float(gs.best_score_),
        "test@0.5": {
            "roc_auc": float(roc_auc_score(yte, probs1d)),
            "accuracy": float(accuracy_score(yte, preds)),
            "f1": float(f1_score(yte, preds)),
            "brier": float(brier_score_loss(yte, probs1d)),
            "confusion": dict(zip(["tn","fp","fn","tp"],
                                  map(int, confusion_matrix(yte, preds).ravel())))
        }
    }

    out = Path(__file__).with_name("metrics_lgbm_v6.json")
    out.write_text(json.dumps(metrics, indent=2))
    print("=== LGBM v6 ===")
    print(json.dumps(metrics, indent=2))
    print(f"Saved to: {out}")

if __name__ == "__main__":
    main()
