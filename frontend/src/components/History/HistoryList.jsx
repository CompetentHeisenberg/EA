import React from "react";
import { HistoryCard } from "./HistoryCard";
import styles from "../../css/profile.module.css";

export const HistoryList = ({
  history,
  loadingHistory,
  openId,
  results,
  loadingId,
  onToggle,
}) => {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Saved Records</h2>
        <span className={styles.sectionHint}>{history.length} records</span>
      </div>

      {loadingHistory ? (
        <div className={styles.loadingRow}>
          <div className={styles.spinner} />
          <span>Loading history...</span>
        </div>
      ) : history.length === 0 ? (
        <div className={styles.emptyState}>No analyses yet.</div>
      ) : (
        <div className={styles.historyList}>
          {history.map((item, i) => (
            <HistoryCard
              key={item.id}
              item={item}
              index={i}
              isOpen={openId === item.id}
              isLoading={loadingId === item.id}
              result={results[item.id]}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};
