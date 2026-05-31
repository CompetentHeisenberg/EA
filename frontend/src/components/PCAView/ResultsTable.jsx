import React from "react";
import styles from "../../css/pca.module.css";
import { getTopFeature } from "../../utils/PCAView/pcaUtils";
import { CLUSTER_COLORS, ROWS_PER_PAGE } from "../../constants/pcaConstants";

export const ResultsTable = ({
  result,
  pcaKeys,
  labelCol,
  page,
  setPage,
  totalPages,
  hoveredPoint,
  setHoveredPoint,
  lockedPoint,
  handleRowClick,
}) => {
  const activePointId = lockedPoint !== null ? lockedPoint : hoveredPoint;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNum}>04</span>
        <h2 className={styles.sectionTitle}>Results Table</h2>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              {labelCol && <th>{labelCol}</th>}
              <th>Cluster</th>
              {pcaKeys.map((k) => {
                const topFeat = getTopFeature(result, k);
                return (
                  <th key={k}>
                    {k}
                    {topFeat && (
                      <span
                        style={{
                          display: "block",
                          fontSize: "11px",
                          color: "#888",
                          fontWeight: "normal",
                        }}
                      >
                        ({topFeat})
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {result.pca_data
              .slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE)
              .map((row, relativeIndex) => {
                const absoluteIndex = page * ROWS_PER_PAGE + relativeIndex;
                return (
                  <tr
                    key={absoluteIndex}
                    className={
                      activePointId === absoluteIndex ? styles.rowHighlight : ""
                    }
                    onMouseEnter={() => {
                      if (lockedPoint === null) {
                        setHoveredPoint(absoluteIndex);
                      }
                    }}
                    onMouseLeave={() => {
                      if (lockedPoint === null) {
                        setHoveredPoint(null);
                      }
                    }}
                    onClick={() => handleRowClick(absoluteIndex)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{absoluteIndex + 1}</td>
                    {labelCol && result.original_data && (
                      <td>{result.original_data[absoluteIndex][labelCol]}</td>
                    )}
                    <td>
                      <span
                        className={styles.clusterBadge}
                        style={{
                          background:
                            CLUSTER_COLORS[
                              result.clusters[absoluteIndex] %
                                CLUSTER_COLORS.length
                            ],
                        }}
                      >
                        {result.clusters[absoluteIndex] + 1}
                      </span>
                    </td>
                    {pcaKeys.map((k) => (
                      <td key={k}>{(row[k] ?? 0).toFixed(4)}</td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px",
            background: "#f8f9fa",
            borderTop: "1px solid #e9ecef",
          }}
        >
          <button
            className={styles.pill}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ opacity: page === 0 ? 0.5 : 1 }}
          >
            Previous
          </button>
          <span
            style={{
              fontSize: "14px",
              color: "#495057",
              fontWeight: 500,
            }}
          >
            Page {page + 1} of {totalPages}
          </span>
          <button
            className={styles.pill}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{ opacity: page >= totalPages - 1 ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
