import React from "react";
import { HistoryCard } from "./HistoryCard";
import styles from "../../css/profile.module.css";

export const HistorySection = ({
  history,
  loadingHistory,
  openId,
  results,
  loadingId,
  handleToggle,
}) => {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNum}>04</span>
        <h2 className={styles.sectionTitle}>Analysis History</h2>
        <span className={styles.sectionHint}>{history.length} records</span>
      </div>

      {loadingHistory ? (
        <div className={styles.loadingRow}>
          <div className={styles.spinner} />
          <span>Loading...</span>
        </div>
      ) : history.length === 0 ? (
        <div className={styles.emptyState}>
          No analyses yet. Go to{" "}
          <a href="/correlation" className={styles.emptyLink}>
            correlation analysis
          </a>{" "}
          or{" "}
          <a href="/pca" className={styles.emptyLink}>
            PCA
          </a>
          .
        </div>
      ) : (
        <div className={styles.historyList}>
          {history.map((item, index) => (
            <HistoryCard
              key={item.id}
              item={item}
              index={index}
              isOpen={openId === item.id}
              isLoading={loadingId === item.id}
              result={results[item.id]}
              onToggle={() => handleToggle(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
