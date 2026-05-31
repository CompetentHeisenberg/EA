import React from "react";
import styles from "../../css/history.module.css";

export const PCAVariance = ({ variance }) => {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNum}>A</span>
        <h2 className={styles.sectionTitle}>Explained Variance</h2>
      </div>
      <div className={styles.varianceBars}>
        {variance.map((v, i) => (
          <div key={i} className={styles.varianceItem}>
            <div className={styles.varianceLabel}>PC{i + 1}</div>
            <div className={styles.varianceTrack}>
              <div
                className={styles.varianceFill}
                style={{ width: `${v * 100}%` }}
              />
            </div>
            <div className={styles.variancePct}>{(v * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};
