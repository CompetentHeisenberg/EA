import React from "react";
import { formatStatValue } from "../../utils/History/formatters";
import styles from "../../css/history.module.css";

export const DescriptiveStats = ({
  result,
  lockedVariable,
  handleStatRowClick,
}) => {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNum}>B</span>
        <h2 className={styles.sectionTitle}>Descriptive Statistics</h2>
        <span className={styles.sectionHint}>
          Click a row to highlight in matrix
        </span>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
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
            {Object.entries(result.descriptive_stats).map(([col, s]) => (
              <tr
                key={col}
                className={`${styles.tableRowClickable} ${lockedVariable === col ? styles.rowHighlight : ""}`}
                onClick={() => handleStatRowClick(col)}
              >
                <td>
                  <div
                    className={
                      lockedVariable === col ? styles.varNameLocked : ""
                    }
                  >
                    {col}
                  </div>
                </td>
                <td>{formatStatValue(s.mean)}</td>
                <td>{formatStatValue(s.std)}</td>
                <td>{formatStatValue(s.median)}</td>
                <td>
                  {s.shapiro_pvalue !== undefined
                    ? formatStatValue(s.shapiro_pvalue)
                    : "N/A"}
                </td>
                <td>{formatStatValue(s.min)}</td>
                <td>{formatStatValue(s.max)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
