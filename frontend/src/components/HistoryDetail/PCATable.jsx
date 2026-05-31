import React from "react";
import { CLUSTER_COLORS } from "../../constants/analysis";
import styles from "../../css/history.module.css";

export const PCATable = ({ result, pcaState }) => {
  const {
    page,
    setPage,
    pcaKeys,
    totalPages,
    activePointId,
    lockedPoint,
    setHoveredPoint,
    rowsPerPage,
    getTopFeature,
    handleRowClick,
  } = pcaState;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNum}>C</span>
        <h2 className={styles.sectionTitle}>Results Table</h2>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              {result.label_column && <th>{result.label_column}</th>}
              <th>Cluster</th>
              {pcaKeys.map((k) => {
                const topFeat = getTopFeature(k);
                return (
                  <th key={k}>
                    {k}
                    {topFeat && (
                      <span className={styles.thSubtext}>({topFeat})</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {result.pca_data
              .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
              .map((row, relativeIndex) => {
                const absoluteIndex = page * rowsPerPage + relativeIndex;
                return (
                  <tr
                    key={absoluteIndex}
                    className={`${styles.tableRowClickable} ${activePointId === absoluteIndex ? styles.rowHighlight : ""}`}
                    onMouseEnter={() => {
                      if (lockedPoint === null) setHoveredPoint(absoluteIndex);
                    }}
                    onMouseLeave={() => {
                      if (lockedPoint === null) setHoveredPoint(null);
                    }}
                    onClick={() => handleRowClick(absoluteIndex)}
                  >
                    <td>{absoluteIndex + 1}</td>
                    {result.label_column && result.original_data && (
                      <td>
                        {result.original_data[absoluteIndex][
                          result.label_column
                        ] || "N/A"}
                      </td>
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
        <div className={styles.paginationContainer}>
          <button
            className={styles.paginationBtn}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span className={styles.paginationText}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            className={styles.paginationBtn}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
