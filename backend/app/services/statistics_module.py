import numpy as np
import pandas as pd
from scipy import stats
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, davies_bouldin_score
import warnings


def _normality_test(col: pd.Series) -> float:
    n = len(col)
    if n > 5000:
        _, p = stats.jarque_bera(col)
    elif n >= 3:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            _, p = stats.shapiro(col.sample(min(n, 5000), random_state=42) if n > 5000 else col)
    else:
        return 1.0
    return round(float(p), 4)


def compute_correlation_matrix(data: dict, method: str = 'pearson') -> dict:
    df = pd.DataFrame(data)
    df = df.dropna()

    if df.shape[0] < 3:
        raise ValueError("Insufficient data for correlation analysis")

    tickers = list(df.columns)
    n = len(tickers)

    if method == 'spearman':
        corr_df = df.corr(method='spearman')
    else:
        corr_df = df.corr(method='pearson')

    corr_matrix = corr_df.round(4).values.tolist()

    pval_matrix = []
    for i in range(n):
        pval_row = []
        for j in range(n):
            if i == j:
                pval_row.append(0.0)
            else:
                if method == 'spearman':
                    _, p = stats.spearmanr(df.iloc[:, i], df.iloc[:, j])
                else:
                    _, p = stats.pearsonr(df.iloc[:, i], df.iloc[:, j])
                pval_row.append(round(float(p), 4))
        pval_matrix.append(pval_row)

    desc = {}
    for ticker in tickers:
        col = df[ticker]
        desc[ticker] = {
            "mean": round(float(col.mean()), 4),
            "median": round(float(col.median()), 4),
            "std": round(float(col.std()), 4),
            "min": round(float(col.min()), 4),
            "max": round(float(col.max()), 4),
            "shapiro_pvalue": _normality_test(col),
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
        n_clusters = min(n_clusters, df.shape[0] - 1)
        n_components = min(3, df.shape[0], df.shape[1])
        pca = PCA(n_components=n_components)
        components = pca.fit_transform(df)

        pca_cols = [f"PC{i+1}" for i in range(n_components)]
        pca_df = pd.DataFrame(components, columns=pca_cols)

        kmeans = KMeans(
            n_clusters=n_clusters, 
            init='k-means++',
            random_state=42, 
            n_init=10
        )
        clusters = kmeans.fit_predict(components)

        if len(set(clusters)) > 1:
            sil_score = silhouette_score(components, clusters)
            db_score = davies_bouldin_score(components, clusters)
        else:
            sil_score = 0.0
            db_score = 0.0

        cluster_metrics = {
            "inertia": float(kmeans.inertia_),
            "silhouette_score": round(float(sil_score), 4),
            "davies_bouldin_score": round(float(db_score), 4),
        }

        loadings = pd.DataFrame(
            pca.components_.T,
            columns=pca_cols,
            index=df.columns,
        ).to_dict()

        return clusters.tolist(), pca_df, pca.explained_variance_ratio_.tolist(), loadings, cluster_metrics