import React from "react";
import styles from "../../css/workspace.module.css";
import { workspaceIcons } from "../../assets/sentiment";

export const Header = ({ activeTab, fileId, fileName }) => {
  const { settings: SettingsIcon, logout: LogoutIcon } = workspaceIcons;

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.titleWrapper}>
          <h2 className={styles.viewTitle}>
            {activeTab === "upload" && "Dataset Upload"}
            {activeTab === "correlation" && "Correlation Matrix"}
            {activeTab === "pca" && "PCA & Clustering"}
          </h2>

          {activeTab !== "upload" && (
            <span className={styles.viewSubtitle}>
              {activeTab === "correlation" &&
                "Pearson & Spearman matrices · Outlier Treatment · Descriptive statistics"}
              {activeTab === "pca" &&
                "Principal Component Analysis · K-Means clustering · Dimensionality Reduction"}
            </span>
          )}
        </div>

        <div className={styles.headerDivider} />

        <div className={styles.dataset}>
          <span className={styles.datasetTitle}>Active Dataset</span>

          {fileId ? (
            <div className={styles.datasetBadge}>{fileName}</div>
          ) : (
            <div className={styles.datasetEmpty}>No dataset selected</div>
          )}
        </div>
      </div>

      <div className={styles.headerActions}>
        <button className={styles.iconButton}>
          <SettingsIcon />
        </button>

        <button className={styles.iconButton}>
          <LogoutIcon />
        </button>
      </div>
    </header>
  );
};
