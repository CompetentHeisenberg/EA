import React from "react";
import { useCorrelationInteraction } from "../../hooks/History/useCorrelationInteraction";
import { CorrelationMatrix } from "./CorrelationMatrix";
import { DescriptiveStats } from "./DescriptiveStats";
import styles from "../../css/history.module.css";

export const CorrelationDetail = ({ result }) => {
  const {
    hoveredCell,
    setHoveredCell,
    lockedVariable,
    setLockedVariable,
    heatmapRef,
    hoveredInfo,
    strongCount,
    isCompactMatrix,
    handleStatRowClick,
  } = useCorrelationInteraction(result);

  if (!result || !result.tickers) return null;

  return (
    <>
      <div className={styles.statsRow}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiVal}>{result.tickers.length}</span>
          <span className={styles.kpiLabel}>variables</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiVal}>{result.observations}</span>
          <span className={styles.kpiLabel}>observations</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiVal}>{strongCount}</span>
          <span className={styles.kpiLabel}>
            strong correlations (|r|&gt;0.7)
          </span>
        </div>
      </div>

      <CorrelationMatrix
        result={result}
        heatmapRef={heatmapRef}
        lockedVariable={lockedVariable}
        setLockedVariable={setLockedVariable}
        isCompactMatrix={isCompactMatrix}
        hoveredCell={hoveredCell}
        setHoveredCell={setHoveredCell}
        hoveredInfo={hoveredInfo}
      />

      <DescriptiveStats
        result={result}
        lockedVariable={lockedVariable}
        handleStatRowClick={handleStatRowClick}
      />
    </>
  );
};
