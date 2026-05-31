import React from "react";
import styles from "../../css/pca.module.css";
import { CLUSTER_COLORS } from "../../constants/pcaConstants";

export const ProjectionTooltip = ({
  activePointId,
  lockedPoint,
  setLockedPoint,
  labelCol,
  result,
  selectedCols,
  pcaKeys,
}) => {
  if (activePointId === null) return null;

  const clusterIndex = result.clusters[activePointId];
  const clusterColor = CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length];
  const originalData = result.original_data
    ? result.original_data[activePointId]
    : null;

  return (
    <div
      className={styles.tooltip}
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
        {labelCol ? (
          <>
            <span
              style={{
                fontWeight: 400,
                color: "#aaa",
                fontSize: "12px",
                marginRight: "6px",
              }}
            >
              {labelCol}:
            </span>
            {originalData ? originalData[labelCol] : "N/A"}
          </>
        ) : (
          `Observation #${activePointId + 1}`
        )}
      </div>

      <div className={styles.tooltipRow}>
        <span style={{ color: "#ccc" }}>Cluster</span>
        <span
          style={{
            color: clusterColor,
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          {clusterIndex + 1}
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
        {selectedCols.map((col) => (
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
              {originalData ? originalData[col] : "N/A"}
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
  );
};
