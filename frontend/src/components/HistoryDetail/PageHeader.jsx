import React from "react";
import { ANALYSIS_LABELS } from "../../constants/analysis";
import styles from "../../css/history.module.css";

export const PageHeader = ({ data }) => {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderInner}>
        <div>
          <h1 className={styles.pageTitle}>
            {data
              ? ANALYSIS_LABELS[data.session.analysis_type] || "Analysis"
              : "Detailed View"}
          </h1>
          <p className={styles.pageDesc}>
            {data
              ? `${data.session.file_name} · ${new Date(data.session.created_at).toLocaleString("en-GB")}`
              : "Loading..."}
          </p>
        </div>
        <a href="/history" className={styles.backBtn}>
          ← Back to history
        </a>
      </div>
    </div>
  );
};
