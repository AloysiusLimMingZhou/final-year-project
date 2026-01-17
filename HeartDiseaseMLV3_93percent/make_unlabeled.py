import pandas as pd
features = ["age","sex","cp","trestbps","chol","fbs","restecg",
            "thalach","exang","oldpeak","slope","ca","thal"]
df = pd.read_csv(r".\data\heart4_merged.csv")
df[features].to_csv(r".\data\unlabeled_to_score.csv", index=False)
print(f"Wrote .\\data\\unlabeled_to_score.csv with {len(df)} rows.")
