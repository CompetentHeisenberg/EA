import pandas as pd
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans

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