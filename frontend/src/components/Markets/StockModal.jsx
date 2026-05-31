import React from "react";
import { DetailChart } from "./DetailChart";
import { sentimentLabel as SentimentLabel } from "../../assets/sentiment";
import styles from "../../css/markets.module.css";

export const StockModal = ({ stock, onClose }) => {
  if (!stock) return null;

  const positive = stock.change >= 0;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>
          ✕
        </button>
        <div className={styles.modalHeader}>
          <div>
            <span className={styles.modalSymbol}>{stock.symbol}</span>
            <span className={styles.modalName}>{stock.name}</span>
            <span className={styles.sectorBadge}>{stock.sector}</span>
          </div>
          <div className={styles.modalPrice}>
            <span className={styles.modalPriceVal}>
              {stock.sector === "Crypto"
                ? "$" +
                  stock.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })
                : "$" + stock.price.toFixed(2)}
            </span>
            <span className={positive ? styles.posChange : styles.negChange}>
              {positive ? (
                <SentimentLabel.positive.icon />
              ) : (
                <SentimentLabel.negative.icon />
              )}{" "}
              {Math.abs(stock.change).toFixed(2)}%
            </span>
          </div>
        </div>

        <DetailChart stock={stock} />

        <div className={styles.modalMetrics}>
          {[
            ["Market Cap", stock.mktCap],
            ["Volume", stock.volume],
            ["P/E Ratio", stock.pe ?? "N/A"],
            ["Beta", stock.beta],
            ["52W High", "$" + stock.week52High.toLocaleString()],
            ["52W Low", "$" + stock.week52Low.toLocaleString()],
            ["Div. Yield", stock.dividendYield + "%"],
          ].map(([label, val]) => (
            <div key={label} className={styles.metricCard}>
              <div className={styles.metricLabel}>{label}</div>
              <div className={styles.metricVal}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
