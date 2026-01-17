from pathlib import Path
import json

FILES = [
    "metrics_xgb_v6.json",
    "metrics_lgbm_v6.json",
    "metrics_logreg_v6.json",
]

def load(p: Path):
    if not p.exists():
        return None
    with p.open() as f:
        return json.load(f)

def main():
    rows = []
    here = Path(__file__).parent
    for fn in FILES:
        m = load(here / fn)
        if not m:
            continue
        test = m["test@0.5"]
        rows.append((
            fn,
            m.get("cv_best_roc_auc"),
            test["roc_auc"],
            test["accuracy"],
            test["f1"],
            test["brier"]
        ))

    # sort by Test AUC desc, then Brier asc
    rows.sort(key=lambda r: (-float(r[2]), float(r[5])))

    print("=== v6 leaderboard (sorted by Test AUC then Brier) ===")
    for r in rows:
        print(f"{r[0]:<24}  CV AUC={r[1]:.4f}  Test AUC={r[2]:.4f}  "
              f"Acc={r[3]:.4f}  F1={r[4]:.4f}  Brier={r[5]:.4f}")

if __name__ == "__main__":
    main()
