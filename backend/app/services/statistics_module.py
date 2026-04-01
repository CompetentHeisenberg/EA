import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from scipy import stats
 
def compute_correlation_matrix(data: dict) -> dict:
    df = pd.DataFrame(data)
 
    df = df.dropna()
 
    if df.shape[0] < 3:
        raise ValueError("Insufficient data for correlation analysis (minimum 3 observations)")
 
    tickers = list(df.columns)
    n = len(tickers)
 
    corr_matrix = []
    pval_matrix = []
 
    for i in range(n):
        corr_row = []
        pval_row = []
        for j in range(n):
            if i == j:
                corr_row.append(1.0)
                pval_row.append(0.0)
            else:
                r, p = stats.pearsonr(df.iloc[:, i], df.iloc[:, j])
                corr_row.append(round(float(r), 4))
                pval_row.append(round(float(p), 4))
        corr_matrix.append(corr_row)
        pval_matrix.append(pval_row)
 
    desc = {}
    for ticker in tickers:
        col = df[ticker]
        desc[ticker] = {
            "mean": round(float(col.mean()), 4),
            "std": round(float(col.std()), 4),
            "min": round(float(col.min()), 4),
            "max": round(float(col.max()), 4),
        }
 
    return {
        "tickers": tickers,
        "correlation_matrix": corr_matrix,
        "pvalue_matrix": pval_matrix,
        "observations": int(df.shape[0]),
        "descriptive_stats": desc,
    }

class StatisticsEngine:
    def run_full_analysis(self, df: pd.DataFrame, n_clusters: int):
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(df)
        
        n_components = min(3, df.shape[1])
        pca = PCA(n_components=n_components)
        components = pca.fit_transform(df)
        
        pca_cols = [f"PC{i+1}" for i in range(n_components)]
        pca_df = pd.DataFrame(components, columns=pca_cols)
        
        return clusters, pca_df, pca.explained_variance_ratio_