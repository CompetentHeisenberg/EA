import React, { useMemo } from "react";
import { corrToColor, textColor } from "../../utils/Profile/colors";
import { sigLabel } from "../../utils/Profile/formatters";
import styles from "../../css/profile.module.css";

export const CorrelationSummary = ({ result }) => {
  const pairs = useMemo(() => {
    const tempPairs = [];
    for (let i = 0; i < result.tickers.length; i++) {
      for (let j = i + 1; j < result.tickers.length; j++) {
        tempPairs.push({
          ti: result.tickers[i],
          tj: result.tickers[j],
          r: result.correlation_matrix[i][j],
          p: result.pvalue_matrix[i][j],
        });
      }
    }
    return tempPairs;
  }, [result]);

  const top = useMemo(() => {
    return [...pairs].sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 3);
  }, [pairs]);

  const strongCount = useMemo(() => {
    return pairs.filter((p) => Math.abs(p.r) > 0.7).length;
  }, [pairs]);

  return (
    <div className={styles.summaryBlock}>
      <div className={styles.summaryRow}>
        <div className={styles.summaryKpi}>
          <span className={styles.kpiVal}>{result.tickers.length}</span>
          <span className={styles.kpiLabel}>variables</span>
        </div>
        <div className={styles.summaryKpi}>
          <span className={styles.kpiVal}>{result.observations}</span>
          <span className={styles.kpiLabel}>observations</span>
        </div>
        <div className={styles.summaryKpi}>
          <span className={styles.kpiVal}>{strongCount}</span>
          <span className={styles.kpiLabel}>strong correlations</span>
        </div>
      </div>
      <div className={styles.summaryLabel}>Top correlations:</div>
      <div className={styles.miniHeatRow}>
        {top.map((p, i) => (
          <div
            key={i}
            className={styles.miniPair}
            style={{ background: corrToColor(p.r), color: textColor(p.r) }}
          >
            <span className={styles.miniPairNames}>
              {p.ti} / {p.tj}
            </span>
            <span className={styles.miniPairVal}>
              {p.r.toFixed(2)}
              {sigLabel(p.p)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
