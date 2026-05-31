import React from "react";
import { sentimentLabel as SentimentLabel } from "../../assets/sentiment";
import styles from "../../css/markets.module.css";

export const IndicesBar = ({ indices }) => {
  return (
    <div className={styles.indicesBar}>
      {indices.map((idx) => {
        const isPositive = idx.change >= 0;
        return (
          <div key={idx.name} className={styles.indexCard}>
            <div className={styles.indexName}>{idx.name}</div>
            <div className={styles.indexVal}>
              {idx.name === "10Y Treasury"
                ? idx.value + "%"
                : idx.value.toLocaleString()}
            </div>
            <div className={isPositive ? styles.posChange : styles.negChange}>
              <span style={{ marginRight: "4px" }}>
                {isPositive ? (
                  <SentimentLabel.positive.icon size={12} />
                ) : (
                  <SentimentLabel.negative.icon size={12} />
                )}
              </span>
              {idx.change.toFixed(2)}
              {idx.name === "10Y Treasury" ? "" : "%"}
            </div>
          </div>
        );
      })}
    </div>
  );
};
