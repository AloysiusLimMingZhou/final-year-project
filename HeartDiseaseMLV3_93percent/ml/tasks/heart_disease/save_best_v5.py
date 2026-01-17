import argparse, json, time
from pathlib import Path
import numpy as np
import pandas as pd
import joblib

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.calibration import CalibratedClassifierCV

# optional
try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except Exception:
    HAS_XGB = False

try:
    from lightgbm import LGBMClassifier
    HAS_LGBM = True
except Exception:
    HAS_LGBM = False


def load_df(path: Path) -> pd.DataFrame:
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

def split_cols(df: pd.DataFrame):
    feats = ["age","sex","cp","trestbps","chol","fbs",
             "restecg","thalach","exang","oldpeak","slope","ca","thal"]
    X = df[feats].copy()
    y = df["target"].astype(int).values
    for c in X.columns:
        if X[c].dtype == "object":
            coerced = pd.to_numeric(X[c], errors="coerce")
            if coerced.notna().mean() >= 0.60:
                X[c] = coerced
    num_cols = X.select_dtypes(include=["int64","float64","int32","float32"]).columns.tolist()
    cat_cols = [c for c in X.columns if c not in num_cols]
    return X, y, feats, num_cols, cat_cols

def preproc(num_cols, cat_cols):
    num = Pipeline([("imp", SimpleImputer(strategy="median")), ("scaler", StandardScaler())])
    cat = Pipeline([("imp", SimpleImputer(strategy="most_frequent")), ("ohe", OneHotEncoder(handle_unknown="ignore"))])
    return ColumnTransformer([("num", num, num_cols), ("cat", cat, cat_cols)])

def build_model(kind: str, weights=None):
    # Base learners
    lr = LogisticRegression(max_iter=700, solver="lbfgs")
    rf = RandomForestClassifier(n_estimators=500, random_state=42)
    gb = GradientBoostingClassifier(random_state=42)
    svc = SVC(probability=True, kernel="rbf", C=1.5, gamma="scale", random_state=42)
    knn = KNeighborsClassifier(n_neighbors=7)
    xgb = XGBClassifier(n_estimators=500, max_depth=3, learning_rate=0.05,
                        subsample=0.9, colsample_bytree=0.9, eval_metric="logloss",
                        random_state=42, tree_method="hist") if HAS_XGB else None
    lgbm = LGBMClassifier(n_estimators=800, num_leaves=31, learning_rate=0.05,
                          subsample=0.9, colsample_bytree=0.9, random_state=42) if HAS_LGBM else None

    if kind == "rf_cal":
        base = rf
        return CalibratedClassifierCV(base, method="sigmoid", cv=5)

    if kind == "rf":
        return rf

    if kind == "vote":
        ests = [("lr", lr), ("rf", rf), ("gb", gb)]
        if HAS_XGB: ests.append(("xgb", xgb))
        if HAS_LGBM: ests.append(("lgbm", lgbm))
        ests.append(("svc", svc))
        if not weights:
            weights = [1,3,2,1,1,1][:len(ests)]  # default
        return VotingClassifier(estimators=ests, voting="soft", weights=weights)

    raise ValueError(f"Unknown kind: {kind}")

def main():
    p = argparse.ArgumentParser(description="Retrain & save best v5 winner as deployable artifact")
    p.add_argument("--data", required=True, help="CSV path")
    p.add_argument("--kind", required=True, choices=["rf_cal","rf","vote"], help="Winner kind")
    p.add_argument("--threshold", required=True, type=float, help="Decision threshold for positive class")
    p.add_argument("--weights", default="", help="Comma-separated ints for voting weights (only for kind=vote)")
    p.add_argument("--out", default="", help="Output artifact path (default: ml/tasks/heart_disease/artifact_best_v5.pkl)")
    args = p.parse_args()

    df = load_df(Path(args.data))
    X, y, feats, num_cols, cat_cols = split_cols(df)
    pre = preproc(num_cols, cat_cols)

    weights = None
    if args.kind == "vote" and args.weights:
        weights = [int(x.strip()) for x in args.weights.split(",") if x.strip()]

    clf = build_model(args.kind, weights)
    pipe = Pipeline([("pre", pre), ("clf", clf)])
    # Fit on ALL data for deployment
    pipe.fit(X, y)

    artifact = {
        "task": "heart_disease",
        "model": pipe,
        "features": feats,
        "threshold": float(args.threshold),
        "trained_at": int(time.time())
    }
    out_path = Path(args.out) if args.out else Path(__file__).with_name("artifact_best_v5.pkl")
    joblib.dump(artifact, out_path)
    print(f"? Saved deployable artifact to: {out_path}")
    print(f"Kind={args.kind}, threshold={args.threshold}, weights={weights}")
    print("Use proba = model.predict_proba(sample)[:,1]; predict = (proba >= threshold).astype(int)")
if __name__ == "__main__":
    main()
