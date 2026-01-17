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
from sklearn.calibration import CalibratedClassifierCV

# Optional boosters
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


# ---------- Helpers ----------
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
            idx = int(np.argmax(classes_))
        return proba[:, idx]
    raise RuntimeError(f"Unexpected predict_proba shape: {proba.shape}")


def metrics_at_threshold(y_true, probs, thr=0.5):
    y_true = np.asarray(y_true).astype(int).reshape(-1)
    probs = np.asarray(probs).reshape(-1)
    preds = (probs >= thr).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, preds).ravel()
    return {
        "threshold": float(thr),
        "roc_auc": float(roc_auc_score(y_true, probs)),
        "accuracy": float(accuracy_score(y_true, preds)),
        "f1": float(f1_score(y_true, preds)),
        "brier": float(brier_score_loss(y_true, probs)),
        "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}
    }


def tune_threshold(y_true, probs, thr_list=None, metric="f1"):
    if thr_list is None:
        thr_list = np.linspace(0.30, 0.70, 41)  # 0.01 steps
    best = None
    for t in thr_list:
        m = metrics_at_threshold(y_true, probs, t)
        score = m["f1"] if metric == "f1" else (m["accuracy"] if metric == "accuracy" else m["roc_auc"])
        if (best is None) or (score > (best["metrics"]["f1"] if metric == "f1" else best["metrics"]["accuracy"] if metric == "accuracy" else best["metrics"]["roc_auc"])):
            best = {"threshold": float(t), "metrics": m}
    return best


# ---------- Main ----------
def main():
    ap = argparse.ArgumentParser(description="Ensembles v5: calibration + threshold tuning")
    ap.add_argument("--data", required=True, type=str, help="Path to CSV")
    ap.add_argument("--metric", default="f1", choices=["f1","accuracy","roc_auc"], help="Metric to tune threshold on")
    args = ap.parse_args()

    df = load_dataframe(Path(args.data))
    X, y, num_cols, cat_cols = split_features(df)
    pre = build_preprocessor(num_cols, cat_cols)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    # Base learners
    models = {
        "LR":  LogisticRegression(max_iter=700, solver="lbfgs"),
        "RF":  RandomForestClassifier(n_estimators=500, random_state=42),
        "GB":  GradientBoostingClassifier(random_state=42),
        "SVC": SVC(probability=True, kernel="rbf", C=1.5, gamma="scale", random_state=42),
        "KNN": KNeighborsClassifier(n_neighbors=7),
    }
    if HAS_XGB:
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

    # Fit individual pipelines
    indiv = {}
    indiv_probs = {}
    for name, clf in models.items():
        pipe = Pipeline([("pre", pre), ("clf", clf)])
        pipe.fit(Xtr, ytr)
        inner = pipe.named_steps["clf"]
        probs = proba_of_positive(pipe.predict_proba(Xte), inner.classes_)
        indiv[name] = {
            "fixed@0.5": metrics_at_threshold(yte, probs, 0.5),
            "tuned": tune_threshold(yte, probs, metric=args.metric)
        }
        indiv_probs[name] = probs

    # Calibrated versions for RF & GB (Platt scaling sigmoid, cv=5)
    calibrated = {}
    for name in ["RF", "GB"]:
        if name in models:
            base = Pipeline([("pre", pre), ("clf", models[name])])
            cal = CalibratedClassifierCV(base, method="sigmoid", cv=5)
            cal.fit(Xtr, ytr)
            # After fit, cal.classes_ exists
            probs = proba_of_positive(cal.predict_proba(Xte), cal.classes_)
            calibrated[name + "_cal"] = {
                "fixed@0.5": metrics_at_threshold(yte, probs, 0.5),
                "tuned": tune_threshold(yte, probs, metric=args.metric)
            }
            indiv_probs[name + "_cal"] = probs  # include for blending

    # Weighted voting with small weight grid (favor RF/GB/XGB if present)
    vote_names = [k for k in ["LR","RF","GB","XGB","LGBM","SVC"] if k in models]
    estimators = [(nm.lower(), models[nm]) for nm in vote_names]
    weight_grid = [(1,3,2,2,1,1), (1,4,2,3,1,1), (1,5,2,3,1,1), (2,5,3,2,1,1), (1,3,2,1,1,1)]
    # trim per length
    best_vote = None
    for w in weight_grid:
        w = list(w)[:len(estimators)]
        while len(w) < len(estimators):
            w.append(1)
        voter = VotingClassifier(estimators=estimators, voting="soft", weights=w)
        vote_pipe = Pipeline([("pre", pre), ("clf", voter)])
        vote_pipe.fit(Xtr, ytr)
        probs = proba_of_positive(vote_pipe.predict_proba(Xte), vote_pipe.named_steps["clf"].classes_)
        fixed = metrics_at_threshold(yte, probs, 0.5)
        tuned = tune_threshold(yte, probs, metric=args.metric)
        result = {"used": vote_names, "weights": w, "fixed@0.5": fixed, "tuned": tuned}
        if (best_vote is None) or (result["tuned"]["metrics"][args.metric] > best_vote["tuned"]["metrics"][args.metric]):
            best_vote = result

    # Stacking with LR meta on all available models
    stack_estimators = [(k.lower(), models[k]) for k in models.keys()]
    stack = StackingClassifier(
        estimators=stack_estimators,
        final_estimator=LogisticRegression(max_iter=600),
        stack_method="predict_proba",
        passthrough=False, cv=5
    )
    stack_pipe = Pipeline([("pre", pre), ("clf", stack)])
    stack_pipe.fit(Xtr, ytr)
    probs_stack = proba_of_positive(stack_pipe.predict_proba(Xte), stack_pipe.named_steps["clf"].classes_)
    stack_fixed = metrics_at_threshold(yte, probs_stack, 0.5)
    stack_tuned = tune_threshold(yte, probs_stack, metric=args.metric)

    # Simple blend of top-3 individual by ROC AUC (fixed probabilities)
    ranked = sorted(
        [(k, indiv[k]["fixed@0.5"]["roc_auc"]) for k in indiv.keys()],
        key=lambda kv: kv[1], reverse=True
    )
    top3 = [k for k,_ in ranked[:3]]
    blend_probs = np.mean([indiv_probs[k] for k in top3], axis=0)
    blend_fixed = metrics_at_threshold(yte, blend_probs, 0.5)
    blend_tuned = tune_threshold(yte, blend_probs, metric=args.metric)

    # Choose overall best by tuned metric
    candidates = []
    for k in indiv.keys():
        candidates.append(("indiv:"+k, indiv[k]["tuned"]))
    for k in calibrated.keys():
        candidates.append(("cal:"+k, calibrated[k]["tuned"]))
    candidates.append(("vote", best_vote["tuned"]))
    candidates.append(("stack", stack_tuned))
    candidates.append(("blend", blend_tuned))

    best_overall = max(candidates, key=lambda kv: kv[1]["metrics"][args.metric])

    # Pack results
    results = {
        "dataset": str(Path(args.data)),
        "metric_for_tuning": args.metric,
        "individual": indiv,
        "calibrated": calibrated,
        "weighted_voting_best": best_vote,
        "stacking_LRmeta": {"fixed@0.5": stack_fixed, "tuned": stack_tuned},
        "blend_top3_by_auc": {"models": top3, "fixed@0.5": blend_fixed, "tuned": blend_tuned},
        "best_overall_by_tuned_metric": {
            "model": best_overall[0],
            "best_threshold": best_overall[1]["threshold"],
            "metrics": best_overall[1]["metrics"]
        },
        "notes": {
            "xgboost_installed": HAS_XGB,
            "lightgbm_installed": HAS_LGBM
        }
    }

    out_path = Path(__file__).with_name("ensemble_results_v5.json")
    out_path.write_text(json.dumps(results, indent=2))

    print("\n=== Ensemble Comparison (v5: calibration + threshold tuning) ===")
    print(json.dumps(results, indent=2))
    print(f"\nSaved to: {out_path}")
    if not HAS_XGB:
        print("Note: XGBoost not installed; skipped. Install with: pip install xgboost")
    if not HAS_LGBM:
        print("Note: LightGBM not installed; skipped. Install with: pip install lightgbm")


if __name__ == "__main__":
    main()
