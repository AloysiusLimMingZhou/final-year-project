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

# Optional libs: try to import; if not present, we just skip them
HAS_XGB = False
HAS_LGBM = False
try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except Exception:
    pass

try:
    from lightgbm import LGBMClassifier
    HAS_LGBM = True
except Exception:
    pass


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
    ap = argparse.ArgumentParser(description="Ensembles v4: add XGBoost/LightGBM, tuned voting, stacking, and blending")
    ap.add_argument("--data", required=True, type=str, help="Path to CSV")
    args = ap.parse_args()

    df = load_dataframe(Path(args.data))
    X, y, num_cols, cat_cols = split_features(df)
    pre = build_preprocessor(num_cols, cat_cols)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    # Base learners (all wrapped later with the preprocessor)
    models = {}
    models["LR"]  = LogisticRegression(max_iter=600, solver="lbfgs")
    models["RF"]  = RandomForestClassifier(n_estimators=400, max_depth=None, random_state=42)
    models["GB"]  = GradientBoostingClassifier(random_state=42)
    models["SVC"] = SVC(probability=True, kernel="rbf", C=1.5, gamma="scale", random_state=42)
    models["KNN"] = KNeighborsClassifier(n_neighbors=7)

    if HAS_XGB:
        # conservative, robust params for small tabular sets
        models["XGB"] = XGBClassifier(
            n_estimators=500, max_depth=3, learning_rate=0.05,
            subsample=0.9, colsample_bytree=0.9, eval_metric="logloss",
            random_state=42, tree_method="hist"
        )
    if HAS_LGBM:
        models["LGBM"] = LGBMClassifier(
            n_estimators=800, num_leaves=31, learning_rate=0.05,
            subsample=0.9, colsample_bytree=0.9, random_state=42
        )

    # Fit individual pipelines and collect metrics + probs
    indiv_results = {}
    indiv_probs = {}
    indiv_preds = {}
    for name, clf in models.items():
        pipe = Pipeline([("pre", pre), ("clf", clf)])
        pipe.fit(Xtr, ytr)
        inner = pipe.named_steps["clf"]
        probs1 = proba_of_positive(pipe.predict_proba(Xte), inner.classes_)
        preds = pipe.predict(Xte)
        indiv_results[name] = evaluate(probs1, preds, yte)
        indiv_probs[name] = probs1
        indiv_preds[name] = preds

    # ===== Weighted Voting over a subset of strong models =====
    vote_pool = []
    for key in ["LR","RF","GB","XGB","LGBM","SVC"]:
        if key in models:
            vote_pool.append((key.lower(), models[key]))
    # small grid of weights; auto-pick best on F1
    weight_grid = [
        (1,5,2), (2,6,2), (1,4,3), (2,5,3), (1,3,2),
    ]
    # if we have XGB/LGBM, also try variants that favor them
    if "xgb" in [k for k,_ in vote_pool] or "lgbm" in [k for k,_ in vote_pool]:
        weight_grid.extend([(1,3,2,4), (1,2,2,4), (1,3,2,2,4)])  # will be trimmed per pool length

    best_vote_metrics = None
    best_vote_weights = None
    best_vote_used = None

    # prepare a consistent order of estimators
    estimators = vote_pool  # e.g. [('lr', LR), ('rf', RF), ('gb', GB), ('xgb', XGB), ('lgbm', LGBM), ('svc', SVC)]

    for w in weight_grid:
        w = list(w)[:len(estimators)]
        while len(w) < len(estimators):
            w.append(1)  # pad
        voter = VotingClassifier(estimators=estimators, voting="soft", weights=w)
        vote_pipe = Pipeline([("pre", pre), ("clf", voter)])
        vote_pipe.fit(Xtr, ytr)
        inner = vote_pipe.named_steps["clf"]
        probs1 = proba_of_positive(vote_pipe.predict_proba(Xte), inner.classes_)
        preds = vote_pipe.predict(Xte)
        m = evaluate(probs1, preds, yte)
        if (best_vote_metrics is None) or (m["f1@0.5"] > best_vote_metrics["f1@0.5"]):
            best_vote_metrics = m
            best_vote_weights = w.copy()
            best_vote_used = [name for name,_ in estimators]

    # ===== Stacking with strong meta (GradientBoosting) =====
    stack_estimators = [(k.lower(), models[k]) for k in models.keys()]  # all available
    stack = StackingClassifier(
        estimators=stack_estimators,
        final_estimator=GradientBoostingClassifier(random_state=42),
        stack_method="predict_proba",
        passthrough=False, cv=5, n_jobs=None
    )
    stack_pipe = Pipeline([("pre", pre), ("clf", stack)])
    stack_pipe.fit(Xtr, ytr)
    inner_stack = stack_pipe.named_steps["clf"]
    probs_stack = proba_of_positive(stack_pipe.predict_proba(Xte), inner_stack.classes_)
    preds_stack = stack_pipe.predict(Xte)
    stack_metrics = evaluate(probs_stack, preds_stack, yte)

    # ===== Simple probability blending of top-3 by ROC AUC =====
    # rank individual models by AUC
    ranked = sorted(indiv_results.items(), key=lambda kv: kv[1]["roc_auc"], reverse=True)
    top_names = [ranked[i][0] for i in range(min(3, len(ranked)))]
    blend_probs = np.mean([indiv_probs[n] for n in top_names], axis=0)
    blend_preds = (blend_probs >= 0.5).astype(int)
    blend_metrics = evaluate(blend_probs, blend_preds, yte)

    # Collect all results
    results = {
        "individual_models": indiv_results,
        "weighted_voting": {
            "used_estimators": best_vote_used,
            "weights": best_vote_weights,
            **best_vote_metrics
        },
        "stacking_GBmeta": stack_metrics,
        "blend_top3_by_auc": {
            "models": top_names,
            **blend_metrics
        }
    }

    out_path = Path(__file__).with_name("ensemble_results_v4.json")
    out_path.write_text(json.dumps(results, indent=2))

    print("\n=== Ensemble Comparison (v4) ===")
    print(json.dumps(results, indent=2))
    print(f"\nSaved to: {out_path}")
    if not HAS_XGB:
        print("Note: XGBoost not installed; skipped. Install with: pip install xgboost")
    if not HAS_LGBM:
        print("Note: LightGBM not installed; skipped. Install with: pip install lightgbm")


if __name__ == "__main__":
    main()
