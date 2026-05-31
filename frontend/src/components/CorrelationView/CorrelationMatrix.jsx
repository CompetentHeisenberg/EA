import React, { useState, useMemo } from "react";
import styles from "../../css/correlation.module.css";
import {
  getCorrelationColor,
  getTextColorForBackground,
} from "../../utils/CorrelationView/colors";
import { getSignificanceLabel } from "../../utils/CorrelationView/formatters";

export const CorrelationMatrix = ({
  corrData,
  heatmapRef,
  lockedVariable,
  setLockedVariable,
}) => {
  const [hoveredCell, setHoveredCell] = useState(null);

  const isCompactMatrix = useMemo(() => {
    return corrData && corrData.tickers.length > 12;
  }, [corrData]);

  const hoveredInfo = useMemo(() => {
    if (!hoveredCell || !corrData) return null;
    return {
      ti: corrData.tickers[hoveredCell.i],
      tj: corrData.tickers[hoveredCell.j],
      corr: corrData.correlation_matrix[hoveredCell.i][hoveredCell.j],
      pval: corrData.pvalue_matrix[hoveredCell.i][hoveredCell.j],
    };
  }, [hoveredCell, corrData]);

  const handleClearLockedVariable = () => {
    setLockedVariable(null);
  };

  if (!corrData) {
    return null;
  }

  const gridTemplateColumnsStyle = {
    gridTemplateColumns: `max-content repeat(${corrData.tickers.length}, minmax(${
      isCompactMatrix ? "35px" : "90px"
    }, 1fr))`,
  };

  return (
    <div className={styles.section} ref={heatmapRef}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNum}>02</span>
        <h2 className={styles.sectionTitle}>Correlation Matrix</h2>
        <span className={styles.sectionHint}>
          n = {corrData.observations} observations
        </span>
        {lockedVariable && (
          <button
            className={styles.actionBtn}
            onClick={handleClearLockedVariable}
            style={{ marginLeft: "auto" }}
          >
            Clear Selection
          </button>
        )}
      </div>

      <div className={styles.scrollableMatrixContainer}>
        <div className={styles.heatmapGrid} style={gridTemplateColumnsStyle}>
          <div className={styles.stickyCorner} />

          {corrData.tickers.map((ticker) => (
            <div
              key={ticker}
              className={`${styles.stickyHeaderTop} ${
                isCompactMatrix ? styles.verticalText : ""
              } ${lockedVariable === ticker ? styles.headerLocked : ""}`}
              title={ticker}
            >
              {ticker}
            </div>
          ))}

          {corrData.tickers.map((rowTicker, i) => (
            <React.Fragment key={rowTicker}>
              <div
                className={`${styles.stickyHeaderLeft} ${
                  lockedVariable === rowTicker ? styles.headerLocked : ""
                }`}
                title={rowTicker}
              >
                {rowTicker}
              </div>

              {corrData.tickers.map((_, j) => {
                const val = corrData.correlation_matrix[i][j];
                const pval = corrData.pvalue_matrix[i][j];

                const isLocked =
                  lockedVariable &&
                  (corrData.tickers[i] === lockedVariable ||
                    corrData.tickers[j] === lockedVariable);

                const isHovered =
                  !lockedVariable &&
                  hoveredCell &&
                  (hoveredCell.i === i || hoveredCell.j === j) &&
                  !(hoveredCell.i === i && hoveredCell.j === j);

                const isActive =
                  !lockedVariable &&
                  hoveredCell &&
                  hoveredCell.i === i &&
                  hoveredCell.j === j;

                const isDimmed = lockedVariable && !isLocked;

                return (
                  <div
                    key={j}
                    className={`${styles.matrixCell} ${
                      isHovered ? styles.matrixCellHovered : ""
                    } ${isActive ? styles.matrixCellActive : ""} ${
                      isLocked ? styles.matrixCellLocked : ""
                    } ${isDimmed ? styles.matrixCellDimmed : ""}`}
                    style={{
                      backgroundColor: getCorrelationColor(val),
                      color: getTextColorForBackground(val),
                    }}
                    onMouseEnter={() => setHoveredCell({ i, j })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {!isCompactMatrix && (
                      <span className={styles.cellValueText}>
                        {val.toFixed(2)}
                      </span>
                    )}
                    {!isCompactMatrix && getSignificanceLabel(pval) && (
                      <span className={styles.cellSigText}>
                        {getSignificanceLabel(pval)}
                      </span>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className={styles.infoBarMargin}>
        {hoveredInfo && hoveredInfo.ti !== hoveredInfo.tj ? (
          <span>
            <strong>{hoveredInfo.ti}</strong> ↔{" "}
            <strong>{hoveredInfo.tj}</strong>: &nbsp;r ={" "}
            <strong>{hoveredInfo.corr.toFixed(4)}</strong>
            &nbsp;· p = {hoveredInfo.pval.toFixed(4)}{" "}
            {getSignificanceLabel(hoveredInfo.pval)}
          </span>
        ) : (
          <span>
            Hover over cell for details &nbsp;·&nbsp; *** p&lt;0.01 &nbsp;**
            p&lt;0.05 &nbsp;* p&lt;0.1
          </span>
        )}
      </div>

      <div className={styles.legend}>
        <span>-1</span>
        <div className={styles.legendBar} />
        <span>0</span>
        <div className={styles.legendBar2} />
        <span>+1</span>
        <span className={styles.legendDesc}>
          Negative → None → Positive correlation
        </span>
      </div>
    </div>
  );
};
