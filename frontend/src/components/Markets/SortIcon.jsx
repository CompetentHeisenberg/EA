import React from "react";
import { sentimentLabel as SentimentLabel } from "../../assets/sentiment";
import styles from "../../css/markets.module.css";

export const SortIcon = ({ col, sortKey, sortDir }) => {
  if (sortKey !== col) {
    return (
      <span className={styles.sortIcon}>
        <SentimentLabel.neutral.icon />
      </span>
    );
  }

  return (
    <span className={styles.sortActive}>
      {sortDir === "asc" ? (
        <SentimentLabel.positive.icon />
      ) : (
        <SentimentLabel.negative.icon />
      )}
    </span>
  );
};
