import React from "react";
import styles from "../../css/correlation.module.css";
import { formatStatValue } from "../../utils/CorrelationView/formatters";

export const DescriptiveStats = ({
  descriptiveStats,
  lockedVariable,
  onRowClick,
}) => {
  if (!descriptiveStats) {
    return null;
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNum}>03</span>
        <h2 className={styles.sectionTitle}>Descriptive Statistics</h2>
        <span className={styles.sectionHint}>
          Click a row to highlight in matrix
        </span>
      </div>

      <div className={styles.dataTableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Variable</th>
              <th>Mean</th>
              <th>Std. Dev</th>
              <th>Median</th>
              <th title="Shapiro-Wilk (p < 0.05 = not normal)">
                Normality (p)
              </th>
              <th>Min</th>
              <th>Max</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(descriptiveStats).map(([col, stats]) => (
              <tr
                key={col}
                className={`${styles.dataTableRow} ${
                  lockedVariable === col ? styles.dataTableRowLocked : ""
                }`}
                onClick={() => onRowClick(col)}
              >
                <td className={styles.varNameCell}>
                  <div className={styles.varNameInner}>{col}</div>
                </td>
                <td>{formatStatValue(stats.mean)}</td>
                <td>{formatStatValue(stats.std)}</td>
                <td>{formatStatValue(stats.median)}</td>
                <td>{stats.shapiro_pvalue}</td>
                <td>{formatStatValue(stats.min)}</td>
                <td>{formatStatValue(stats.max)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
