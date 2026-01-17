import argparse, json
from pathlib import Path
import pandas as pd, numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, brier_score_loss, roc_auc_score, confusion_matrix

def load_dataframe(path: Path):
    df = pd.read_csv(path)
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.replace({"?": np.nan})
    if "target" not in df.columns:
        if "num" in df.columns:
            df["target"] = (pd.to_numeric(df["num"], errors="coerce") > 0).astype(int)
        else:
            raise ValueError("Dataset must contain 'target' column")
    return df

def split_features(df):
    order = ["age","sex","cp","trestbps","chol","fbs","restecg","thalach","exang","oldpeak","slope","ca","thal"]
    X, y = df[order].copy(), df["target"].astype(int).values
    for c in X.columns:
        if X[c].dtype == "object":
            coerced = pd.to_numeric(X[c], errors="coerce")
            if coerced.notna().mean() >= 0.6: X[c] = coerced
    num_cols = X.select_dtypes(include=["int64","float64"]).columns.tolist()
    cat_cols = [c for c in X.columns if c not in num_cols]
    return X, y, num_cols, cat_cols

def build_pre(num_cols, cat_cols):
    return ColumnTransformer([
        ("num", Pipeline([("imp", SimpleImputer(strategy="median")),("scaler", StandardScaler())]), num_cols),
        ("cat", Pipeline([("imp", SimpleImputer(strategy="most_frequent")),("ohe", OneHotEncoder(handle_unknown="ignore"))]), cat_cols)
    ])

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--data", required=True)
    args = p.parse_args()
    df = load_dataframe(Path(args.data))
    X, y, num, cat = split_features(df)
    pre = build_pre(num, cat)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    rf = RandomForestClassifier(random_state=42)
    grid = {"n_estimators":[100,200,400],"max_depth":[None,5,10],"min_samples_split":[2,5,10]}
    gs = GridSearchCV(rf, grid, cv=5, scoring="roc_auc", n_jobs=-1)
    pipe = Pipeline([("pre",pre),("clf",gs)])
    pipe.fit(Xtr,ytr)
    best = gs.best_estimator_
    probs = pipe.predict_proba(Xte)[:,1]; preds = pipe.predict(Xte)
    metrics = {
        "best_params": gs.best_params_,
        "roc_auc": roc_auc_score(yte, probs),
        "accuracy": accuracy_score(yte, preds),
        "f1": f1_score(yte, preds),
        "brier": brier_score_loss(yte, probs),
        "confusion": dict(zip(["tn","fp","fn","tp"], confusion_matrix(yte,preds).ravel()))
    }
    out = Path(__file__).with_name("rf_results_v6.json")
    out.write_text(json.dumps(metrics,indent=2))
    print("RF v6 done. Results:", json.dumps(metrics,indent=2))

if __name__=="__main__": main()
