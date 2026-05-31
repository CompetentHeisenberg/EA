import React from "react";
import { exportCSV, exportExcel } from "../../utils/Markets/exportHelpers";
import { workspaceIcons as WorkspaceIcons } from "../../assets/sentiment";
import styles from "../../css/markets.module.css";

export const MarketHeader = ({ data }) => {
  return (
    <div className={styles.pageHeader}>
      <div>
        <h1 className={styles.pageTitle}>Markets</h1>
        <p className={styles.pageSubtitle}>
          Live financial data ·{" "}
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
      <div className={styles.exportGroup}>
        <button
          className={styles.exportBtn}
          onClick={() => exportCSV(data)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <WorkspaceIcons.upload /> CSV
        </button>
        <button
          className={styles.exportBtn}
          onClick={() => exportExcel(data)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <WorkspaceIcons.upload /> Excel
        </button>
      </div>
    </div>
  );
};
