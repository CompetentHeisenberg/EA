import React from "react";
import styles from "../../css/pca.module.css";

export const ClusterMetrics = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNum}>★</span>
        <h2 className={styles.sectionTitle}>Cluster Quality Metrics</h2>
        <span className={styles.sectionHint}>Model accuracy indicators</span>
      </div>

      <div className={styles.settingsRow}>
        <div
          className={styles.settingsBlock}
          style={{ flex: 1, display: "flex", gap: "30px" }}
        >
          <div>
            <div
              style={{
                color: "#868e96",
                fontSize: "12px",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Silhouette Score
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#222",
              }}
            >
              {metrics.silhouette_score}
            </div>
            <div style={{ color: "#868e96", fontSize: "12px" }}>
              Closer to 1 is better (denser clusters)
            </div>
          </div>

          <div>
            <div
              style={{
                color: "#868e96",
                fontSize: "12px",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Davies-Bouldin Index
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#222",
              }}
            >
              {metrics.davies_bouldin_score}
            </div>
            <div style={{ color: "#868e96", fontSize: "12px" }}>
              Lower is better (better separation)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
