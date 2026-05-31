import React from "react";
import { CorrelationSummary } from "./CorrelationSummary";
import { PCASummary } from "./PCASummary";
import { ANALYSIS_LABELS } from "../../constants/analysis";
import { formatDate } from "../../utils/Profile/formatters";
import styles from "../../css/profile.module.css";

export const HistoryCard = ({
  item,
  index,
  isOpen,
  isLoading,
  result,
  onToggle,
}) => {
  const canView = item.analysis_type !== "upload";

  return (
    <div
      className={`${styles.historyCard} ${isOpen ? styles.historyCardOpen : ""}`}
    >
      <div
        className={styles.historyCardHeader}
        onClick={() => canView && onToggle(item)}
      >
        <div className={styles.historyCardLeft}>
          <span className={styles.historyNum}>{index + 1}</span>
          <span className={styles.typeBadge} data-type={item.analysis_type}>
            {ANALYSIS_LABELS[item.analysis_type] || item.analysis_type}
          </span>
          <div className={styles.historyMeta}>
            <span className={styles.historyFile}>{item.file_name}</span>
            <span className={styles.historyDate}>
              {formatDate(item.created_at)}
            </span>
          </div>
          {item.columns_used?.length > 0 && (
            <div className={styles.historyColsRow}>
              {item.columns_used.slice(0, 5).map((c) => (
                <span key={c} className={styles.colTag}>
                  {c}
                </span>
              ))}
              {item.columns_used.length > 5 && (
                <span className={styles.colTag}>
                  +{item.columns_used.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
        {canView && (
          <div className={styles.historyCardRight}>
            <button
              className={`${styles.toggleBtn} ${isOpen ? styles.toggleBtnActive : ""}`}
            >
              {isOpen ? "Collapse ▲" : "View ▼"}
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className={styles.historyCardBody}>
          {isLoading ? (
            <div className={styles.loadingRow}>
              <div className={styles.spinner} />
              <span>Loading results...</span>
            </div>
          ) : result ? (
            <>
              {item.analysis_type === "correlation" && (
                <CorrelationSummary result={result.result} />
              )}
              {item.analysis_type === "pca" && (
                <PCASummary result={result.result} />
              )}
              <a href={`/history/${item.id}`} className={styles.detailLink}>
                View detailed interactive report →
              </a>
            </>
          ) : (
            <div className={styles.emptyState}>Failed to load results.</div>
          )}
        </div>
      )}
    </div>
  );
};
