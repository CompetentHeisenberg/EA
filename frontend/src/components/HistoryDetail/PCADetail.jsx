import React from "react";
import { usePCAInteraction } from "../../hooks/History/usePCAInteraction";
import { PCAVariance } from "./PCAVariance";
import { PCAScatterPlot } from "./PCAScatterPlot";
import { PCATable } from "./PCATable";
import styles from "../../css/history.module.css";

export const PCADetail = ({ result }) => {
  const pcaState = usePCAInteraction(result);

  if (!result || !result.pca_data || !result.clusters) return null;

  return (
    <>
      <div className={styles.statsRow}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiVal}>{result.pca_data.length}</span>
          <span className={styles.kpiLabel}>observations</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiVal}>{pcaState.nClusters}</span>
          <span className={styles.kpiLabel}>clusters</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiVal}>
            {(result.variance.reduce((a, b) => a + b, 0) * 100).toFixed(1)}%
          </span>
          <span className={styles.kpiLabel}>total variance</span>
        </div>
      </div>

      <PCAVariance variance={result.variance} />

      <PCAScatterPlot result={result} pcaState={pcaState} />

      {result.cluster_metrics && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>★</span>
            <h2 className={styles.sectionTitle}>Cluster Quality Metrics</h2>
          </div>
          <div className={styles.metricsContainer}>
            <div className={styles.metricBlock}>
              <div className={styles.metricLabel}>Silhouette Score</div>
              <div className={styles.metricValue}>
                {result.cluster_metrics.silhouette_score}
              </div>
              <div className={styles.metricHint}>
                Closer to 1 is better (denser clusters)
              </div>
            </div>
            <div className={styles.metricBlock}>
              <div className={styles.metricLabel}>Davies-Bouldin Index</div>
              <div className={styles.metricValue}>
                {result.cluster_metrics.davies_bouldin_score}
              </div>
              <div className={styles.metricHint}>
                Lower is better (better separation)
              </div>
            </div>
          </div>
        </div>
      )}

      <PCATable result={result} pcaState={pcaState} />
    </>
  );
};
