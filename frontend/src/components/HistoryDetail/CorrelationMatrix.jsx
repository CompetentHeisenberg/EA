import React from "react";
import { corrToColor, textColor } from "../../utils/Profile/colors";
import { sigLabel } from "../../utils/History/formatters";
import styles from "../../css/history.module.css";
import corrStyles from "../../css/correlation.module.css";

export const CorrelationMatrix = ({
  result,
  heatmapRef,
  lockedVariable,
  setLockedVariable,
  isCompactMatrix,
  hoveredCell,
  setHoveredCell,
  hoveredInfo,
}) => {
  return (
    <div className={styles.section} ref={heatmapRef}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNum}>A</span>
        <h2 className={styles.sectionTitle}>Correlation Matrix</h2>
        {lockedVariable && (
          <button
            className={styles.actionBtn}
            onClick={() => setLockedVariable(null)}
            style={{ marginLeft: "auto" }}
          >
            Clear Selection
          </button>
        )}
      </div>

      <div className={corrStyles.scrollableMatrixContainer}>
        <div
          className={corrStyles.heatmapGrid}
          style={{
            gridTemplateColumns: `max-content repeat(${result.tickers.length}, minmax(${isCompactMatrix ? "35px" : "90px"}, 1fr))`,
          }}
        >
          <div className={corrStyles.stickyCorner} />

          {result.tickers.map((t) => (
            <div
              key={t}
              className={`${corrStyles.stickyHeaderTop} ${isCompactMatrix ? corrStyles.verticalText : ""} ${lockedVariable === t ? corrStyles.headerLocked : ""}`}
              title={t}
            >
              {t}
            </div>
          ))}

          {result.tickers.map((rowTicker, i) => (
            <React.Fragment key={rowTicker}>
              <div
                className={`${corrStyles.stickyHeaderLeft} ${lockedVariable === rowTicker ? corrStyles.headerLocked : ""}`}
                title={rowTicker}
              >
                {rowTicker}
              </div>

              {result.tickers.map((_, j) => {
                const val = result.correlation_matrix[i][j];
                const pval = result.pvalue_matrix[i][j];

                const isLocked =
                  lockedVariable &&
                  (result.tickers[i] === lockedVariable ||
                    result.tickers[j] === lockedVariable);
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
                    className={`${corrStyles.matrixCell} ${isHovered ? corrStyles.matrixCellHovered : ""} ${isActive ? corrStyles.matrixCellActive : ""} ${isLocked ? corrStyles.matrixCellLocked : ""} ${isDimmed ? corrStyles.matrixCellDimmed : ""}`}
                    style={{
                      backgroundColor: corrToColor(val),
                      color: textColor(val),
                    }}
                    onMouseEnter={() => setHoveredCell({ i, j })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {!isCompactMatrix && (
                      <span className={corrStyles.cellValueText}>
                        {val.toFixed(2)}
                      </span>
                    )}
                    {!isCompactMatrix && sigLabel(pval) && (
                      <span className={corrStyles.cellSigText}>
                        {sigLabel(pval)}
                      </span>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className={styles.infoBar}>
        {hoveredInfo && hoveredInfo.ti !== hoveredInfo.tj ? (
          <span>
            <strong>{hoveredInfo.ti}</strong> ↔{" "}
            <strong>{hoveredInfo.tj}</strong>: &nbsp;r ={" "}
            <strong>{hoveredInfo.corr.toFixed(4)}</strong>
            &nbsp;· p = {hoveredInfo.pval.toFixed(4)}{" "}
            {sigLabel(hoveredInfo.pval)}
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
