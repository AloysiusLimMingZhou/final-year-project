import pandas as pd
from pathlib import Path

# Datasets to merge
files = [
    "data/cleveland.csv",
    "data/hungarian.csv",
    "data/switzerland.csv",
    "data/va.csv"
]

dfs = []
for f in files:
    try:
        df = pd.read_csv(f)
        dfs.append(df)
        print(f"Loaded {f}: {df.shape}")
    except FileNotFoundError:
        print("⚠️ Skipping (not found):", f)

if dfs:
    merged = pd.concat(dfs, ignore_index=True)
    out_path = Path("data/heart4_merged.csv")
    merged.to_csv(out_path, index=False)
    print(f"✅ Saved merged dataset: {out_path} with shape {merged.shape}")
else:
    print("❌ No datasets found to merge.")
