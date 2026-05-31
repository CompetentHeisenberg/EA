import React from "react";
import { CLUSTER_COLORS } from "../../constants/analysis";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../../constants/pcaConstants";
import styles from "../../css/history.module.css";

export const PCAScatterPlot = ({ result, pcaState }) => {
  const {
    canvasRef,
    wrapperRef,
    axisX,
    axisY,
    zoom,
    setZoom,
    isDragging,
    pcaKeys,
    nClusters,
    activePointId,
    lockedPoint,
    setLockedPoint,
    handleAxisXChange,
    handleAxisYChange,
    handleMouseDown,
    handleMouseUp,
    handleCanvasMouseMove,
    handleMouseLeave,
  } = pcaState;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNum}>B</span>
        <h2 className={styles.sectionTitle}>Scatter Plot</h2>
        <div className={styles.axisSelectors}>
          <select
            className={styles.axisSelect}
            value={axisX}
            onChange={handleAxisXChange}
          >
            {pcaKeys.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <select
            className={styles.axisSelect}
            value={axisY}
            onChange={handleAxisYChange}
          >
            {pcaKeys.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          {(zoom.scale !== 1 || zoom.offsetX !== 0 || zoom.offsetY !== 0) && (
            <button
              className={styles.pill}
              onClick={() => setZoom({ scale: 1, offsetX: 0, offsetY: 0 })}
            >
              Reset View
            </button>
          )}
        </div>
      </div>
      <div className={styles.chartArea} ref={wrapperRef}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={styles.canvas}
          style={{
            touchAction: "none",
            cursor: isDragging
              ? "grabbing"
              : activePointId !== null && lockedPoint === null
                ? "pointer"
                : "crosshair",
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleCanvasMouseMove}
        />
        {activePointId !== null && !isDragging && (
          <div
            className={`${styles.tooltip} ${lockedPoint !== null ? styles.tooltipLocked : ""}`}
            style={{
              minWidth: "260px",
              pointerEvents: lockedPoint !== null ? "auto" : "none",
              maxHeight: "350px",
              overflowY: "auto",
              paddingTop: lockedPoint !== null ? "24px" : "12px",
            }}
          >
            {lockedPoint !== null && (
              <button
                className={styles.tooltipCloseBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setLockedPoint(null);
                }}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: "18px",
                  cursor: "pointer",
                  lineHeight: "1",
                }}
              >
                ✕
              </button>
            )}
            <div
              className={styles.tooltipTitle}
              style={{ color: "#fff", marginBottom: "8px" }}
            >
              {result.label_column && result.original_data ? (
                <>
                  <span
                    style={{
                      fontWeight: 400,
                      color: "#aaa",
                      fontSize: "12px",
                      marginRight: "6px",
                    }}
                  >
                    {result.label_column}:
                  </span>
                  {result.original_data[activePointId][result.label_column] ||
                    "N/A"}
                </>
              ) : (
                `Observation #${activePointId + 1}`
              )}
            </div>
            <div className={styles.tooltipRow}>
              <span style={{ color: "#ccc" }}>Cluster</span>
              <span
                style={{
                  color:
                    CLUSTER_COLORS[
                      result.clusters[activePointId] % CLUSTER_COLORS.length
                    ],
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                {result.clusters[activePointId] + 1}
              </span>
            </div>

            <div
              style={{
                margin: "8px 0",
                padding: "8px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#bbb",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                YOUR DATA
              </div>
              {(
                result.session?.columns ||
                (result.original_data
                  ? Object.keys(result.original_data[activePointId]).filter(
                      (k) => k !== result.label_column,
                    )
                  : [])
              ).map((col) => (
                <div
                  key={`orig-${col}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ color: "#ddd" }}>{col}</span>
                  <span style={{ fontWeight: 800, color: "#fff" }}>
                    {result.original_data && result.original_data[activePointId]
                      ? result.original_data[activePointId][col]
                      : "N/A"}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                margin: "8px 0",
                borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            />

            {pcaKeys.map((k) => (
              <div
                key={k}
                className={styles.tooltipRow}
                style={{ marginBottom: "2px" }}
              >
                <span style={{ color: "#ccc" }}>{k}</span>
                <span style={{ color: "#fff", fontWeight: 500 }}>
                  {(result.pca_data[activePointId][k] ?? 0).toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.clusterLegend}>
        {Array.from({ length: nClusters }, (_, i) => (
          <div key={i} className={styles.legendItem}>
            <div
              className={styles.legendDot}
              style={{
                background: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
              }}
            />
            <span>
              Cluster {i + 1} ({result.clusters.filter((c) => c === i).length}{" "}
              obs.)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
