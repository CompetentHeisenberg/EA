import React from "react";
import styles from "../../css/profile.module.css";

export const HistoryHeader = () => {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderInner}>
        <div>
          <h1 className={styles.pageTitle}>Analysis History</h1>
          <p className={styles.pageDesc}>
            All your previous calculations in one place
          </p>
        </div>
      </div>
    </div>
  );
};
