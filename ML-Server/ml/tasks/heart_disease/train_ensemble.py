import argparse
import json
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (GradientBoostingClassifier, RandomForestClassifier,
                              VotingClassifier, StackingClassifier)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, brier_score_loss, confusion_matrix,
                             f1_score, roc_auc_score, recall_score, precision_score)
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


def infer_project_root(this_file: Path) -> Path:
    return this_file.resolve().parents[3]


def choose_dataset(root: Path, cli_data: str | None) -> Path:
    if cli_data:
        p = Path(cli_data)
        if not p.is_absolute():
            p = root / p
        if not p.exists():
            raise FileNotFoundError(f"--data not found: {p}")
        return p
    cleveland = root / "data" / "cleveland.csv"
    if cleveland.exists():
        return cleveland
    raise FileNotFoundError("No dataset found in ./data (expected cleveland.csv)")


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
    return X, y, num_cols, cat_cols, feature_order


def build_preprocessor(num_cols, cat_cols):
    num = Pipeline([("imp", SimpleImputer(strategy="median")),
                    ("scaler", StandardScaler())])
    cat = Pipeline([("imp", SimpleImputer(strategy="most_frequent")),
                    ("ohe", OneHotEncoder(handle_unknown="ignore"))])
    return ColumnTransformer([("num", num, num_cols), ("cat", cat, cat_cols)])


def evaluate_standard(probs, preds, yte):
    metrics = {
        "roc_auc": float(roc_auc_score(yte, probs)),
        "accuracy@0.5": float(accuracy_score(yte, preds)),
        "f1@0.5": float(f1_score(yte, preds)),
        "recall@0.5": float(recall_score(yte, preds)),
        "precision@0.5": float(precision_score(yte, preds)),
        "brier": float(brier_score_loss(yte, probs)),
    }
    tn, fp, fn, tp = confusion_matrix(yte, preds).ravel()
    metrics["confusion@0.5"] = {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}
    return metrics


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
        thr_list = np.linspace(0.30, 0.70, 41)
    best = None
    for t in thr_list:
        m = metrics_at_threshold(y_true, probs, t)
        score = m["f1"] if metric == "f1" else (m["accuracy"] if metric == "accuracy" else m["roc_auc"])
        if (best is None) or (score > (best["metrics"]["f1"] if metric == "f1" else best["metrics"]["accuracy"] if metric == "accuracy" else best["metrics"]["roc_auc"])):
            best = {"threshold": float(t), "metrics": m}
    return best


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
    reg.setdefault("tasks", {}).setdefault("heart_disease", {})["active"] = artifact_rel_path
    registry_path.write_text(json.dumps(reg, indent=2))


def main():
    parser = argparse.ArgumentParser(description="Train ensemble and save standardized artifacts.")
    parser.add_argument("--data", type=str, default=None, help="Path to CSV in ./data/")
    parser.add_argument("--metric", default="f1", choices=["f1","accuracy","roc_auc"], help="Metric to tune threshold on")
    parser.add_argument("--artifact_suffix", type=str, default="_ensemble", help="Suffix for artifact/metrics names.")
    parser.add_argument("--activate", action="store_true", help="If set, update ml/registry.json.")
    args = parser.parse_args()

    THIS = Path(__file__)
    ROOT = infer_project_root(THIS)

    data_path = choose_dataset(ROOT, args.data)
    print(f"📄 Using dataset: {data_path}")

    df = load_dataframe(data_path)
    X, y, num_cols, cat_cols, feature_order = split_features(df)
    pre = build_preprocessor(num_cols, cat_cols)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

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

    fitted_pipelines = {}
    candidate_scores = {}

    for name, clf in models.items():
        pipe = Pipeline([("pre", pre), ("clf", clf)])
        pipe.fit(Xtr, ytr)
        fitted_pipelines[name] = pipe
        inner = pipe.named_steps["clf"]
        probs = proba_of_positive(pipe.predict_proba(Xte), inner.classes_)
        tuned = tune_threshold(yte, probs, metric=args.metric)
        candidate_scores[name] = tuned["metrics"][args.metric]

    for name in ["RF", "GB"]:
        if name in models:
            base = Pipeline([("pre", pre), ("clf", models[name])])
            cal = CalibratedClassifierCV(base, method="sigmoid", cv=5)
            cal.fit(Xtr, ytr)
            cal_name = name + "_cal"
            fitted_pipelines[cal_name] = cal
            probs = proba_of_positive(cal.predict_proba(Xte), cal.classes_)
            tuned = tune_threshold(yte, probs, metric=args.metric)
            candidate_scores[cal_name] = tuned["metrics"][args.metric]

    vote_names = [k for k in ["LR","RF","GB","XGB","LGBM","SVC"] if k in models]
    estimators = [(nm.lower(), models[nm]) for nm in vote_names]
    w = [1, 3, 2, 2, 1, 1][:len(estimators)]
    while len(w) < len(estimators): w.append(1)
    voter = VotingClassifier(estimators=estimators, voting="soft", weights=w)
    vote_pipe = Pipeline([("pre", pre), ("clf", voter)])
    vote_pipe.fit(Xtr, ytr)
    fitted_pipelines["voting"] = vote_pipe
    probs = proba_of_positive(vote_pipe.predict_proba(Xte), vote_pipe.named_steps["clf"].classes_)
    tuned = tune_threshold(yte, probs, metric=args.metric)
    candidate_scores["voting"] = tuned["metrics"][args.metric]

    stack_estimators = [(k.lower(), models[k]) for k in models.keys()]
    stack = StackingClassifier(
        estimators=stack_estimators,
        final_estimator=LogisticRegression(max_iter=600),
        stack_method="predict_proba",
        passthrough=False, cv=5
    )
    stack_pipe = Pipeline([("pre", pre), ("clf", stack)])
    stack_pipe.fit(Xtr, ytr)
    fitted_pipelines["stacking"] = stack_pipe
    probs = proba_of_positive(stack_pipe.predict_proba(Xte), stack_pipe.named_steps["clf"].classes_)
    tuned = tune_threshold(yte, probs, metric=args.metric)
    candidate_scores["stacking"] = tuned["metrics"][args.metric]

    best_name = max(candidate_scores, key=candidate_scores.get)
    best_pipe = fitted_pipelines[best_name]

    print(f"🏆 Best model found: {best_name} (Score: {candidate_scores[best_name]:.4f})")

    best_clf = best_pipe if hasattr(best_pipe, "classes_") else best_pipe.named_steps.get("clf", best_pipe)
    classes_ = best_clf.classes_ if hasattr(best_clf, "classes_") else [0, 1]
    best_probs = proba_of_positive(best_pipe.predict_proba(Xte), classes_)
    best_preds = (best_probs >= 0.5).astype(int)

    m = evaluate_standard(best_probs, best_preds, yte)
    
    tuned_info = tune_threshold(yte, best_probs, metric=args.metric)
    optimal_thresh = tuned_info["threshold"]

    suffix = args.artifact_suffix.strip()
    dataset_name = data_path.stem.replace("heart_", "")
    if not suffix:
        suffix = f"_{dataset_name}_ensemble"

    base_name = f"artifact_v1{suffix}.pkl"
    metrics_name = f"metrics_v1{suffix}.json"

    ARTIFACT = THIS.with_name(base_name)
    METRICS = THIS.with_name(metrics_name)
    REGISTRY = ROOT / "ml" / "registry.json"

    metrics_payload = {
        **m,
        "rows": int(df.shape[0]),
        "cols": int(df.shape[1]),
        "dataset": str(data_path.relative_to(ROOT)) if str(data_path).startswith(str(ROOT)) else str(data_path),
        "ensemble_best_model": best_name
    }

    artifact = {
        "task": "heart_disease",
        "model": best_pipe,
        "features": feature_order,
        "num_cols": num_cols,
        "cat_cols": cat_cols,
        "metrics": metrics_payload,
        "trained_at": int(time.time()),
        "band_thresholds": {
            "low": max(0.1, optimal_thresh - 0.15),
            "high": min(0.9, optimal_thresh + 0.15)
        },
        "label": base_name.replace(".pkl", ""),
    }

    save_artifacts(ARTIFACT, METRICS, artifact, metrics_payload)

    generic_metrics_path = THIS.with_name("metrics.json")
    generic_metrics_path.write_text(json.dumps(metrics_payload, indent=2))

    print("✅ Ensemble training complete")
    print("📦 Saved artifact:", ARTIFACT)
    print("📊 Metrics:", json.dumps(metrics_payload, indent=2))

    if args.activate:
        abs_path = str(ARTIFACT.resolve())
        update_registry(REGISTRY, abs_path)
        print("🗂 Updated registry:", REGISTRY)
        print("⭐ Active artifact set to:", abs_path)
    else:
        print("ℹ️ Not activating in registry (use --activate to set active model).")


if __name__ == "__main__":
    main()