import React from "react";
import { MiniSparkline } from "./MiniSparkline";
import { sentimentLabel as SentimentLabel } from "../../assets/sentiment";
import styles from "../../css/markets.module.css";

export const CardsView = ({ data, onCardClick }) => {
  return (
    <div className={styles.cardsGrid}>
      {data.map((s) => {
        const positive = s.change >= 0;
        return (
          <div
            key={s.symbol}
            className={styles.stockCard}
            onClick={() => onCardClick(s)}
          >
            <div className={styles.cardTop}>
              <div>
                <div className={styles.cardSymbol}>{s.symbol}</div>
                <div className={styles.cardName}>{s.name}</div>
              </div>
              <span className={styles.sectorBadge}>{s.sector}</span>
            </div>
            <MiniSparkline change={s.change} width={180} height={48} />
            <div className={styles.cardBottom}>
              <span className={styles.cardPrice}>
                {s.sector === "Crypto"
                  ? "$" +
                    s.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })
                  : "$" + s.price.toFixed(2)}
              </span>
              <span className={positive ? styles.posChange : styles.negChange}>
                {positive ? (
                  <SentimentLabel.positive.icon />
                ) : (
                  <SentimentLabel.negative.icon />
                )}{" "}
                {Math.abs(s.change).toFixed(2)}%
              </span>
            </div>
            <div className={styles.cardMeta}>
              <span>Vol: {s.volume}</span>
              <span>Cap: {s.mktCap}</span>
              <span>β: {s.beta}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
