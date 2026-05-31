import React, { useMemo } from "react";
import { CLUSTER_COLORS } from "../../constants/analysis";
import styles from "../../css/profile.module.css";

export const PCASummary = ({ result }) => {
  const nClusters = useMemo(
    () => Math.max(...result.clusters) + 1,
    [result.clusters],
  );

  const totalVar = useMemo(() => {
    return (result.variance.reduce((a, b) => a + b, 0) * 100).toFixed(1);
  }, [result.variance]);

  const clusterCounts = useMemo(() => {
    return Array.from(
      { length: nClusters },
      (_, i) => result.clusters.filter((c) => c === i).length,
    );
  }, [nClusters, result.clusters]);

  return (
    <div className={styles.summaryBlock}>
      <div className={styles.summaryRow}>
        <div className={styles.summaryKpi}>
          <span className={styles.kpiVal}>{result.pca_data.length}</span>
          <span className={styles.kpiLabel}>observations</span>
        </div>
        <div className={styles.summaryKpi}>
          <span className={styles.kpiVal}>{nClusters}</span>
          <span className={styles.kpiLabel}>clusters</span>
        </div>
        <div className={styles.summaryKpi}>
          <span className={styles.kpiVal}>{totalVar}%</span>
          <span className={styles.kpiLabel}>variance PC1+PC2</span>
        </div>
      </div>
      <div className={styles.summaryLabel}>Component variance:</div>
      <div className={styles.miniVariance}>
        {result.variance.map((v, i) => (
          <div key={i} className={styles.miniVarItem}>
            <span className={styles.miniVarLabel}>PC{i + 1}</span>
            <div className={styles.miniVarTrack}>
              <div
                className={styles.miniVarFill}
                style={{ width: `${v * 100}%` }}
              />
            </div>
            <span className={styles.miniVarPct}>{(v * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
      <div className={styles.summaryLabel}>Cluster distribution:</div>
      <div className={styles.clusterPills}>
        {clusterCounts.map((count, i) => (
          <div
            key={i}
            className={styles.clusterPill}
            style={{ background: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}
          >
            C{i + 1}: {count} obs.
          </div>
        ))}
      </div>
    </div>
  );
};
