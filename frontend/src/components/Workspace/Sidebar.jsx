import React from "react";
import styles from "../../css/workspace.module.css";
import { workspaceIcons } from "../../assets/sentiment";

export const Sidebar = ({ activeTab, setActiveTab, isDatasetLoaded }) => {
  const {
    upload: UploadIcon,
    correlation: CorrelationIcon,
    pca: PCAIcon,
  } = workspaceIcons;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoAccent}>Economic</span>
        <span className={styles.logoText}>Workspace</span>
      </div>

      <div className={styles.navGroup}>
        <span className={styles.navLabel}>Workspace</span>

        <button
          className={`${styles.navButton} ${
            activeTab === "upload" ? styles.navButtonActive : ""
          }`}
          onClick={() => setActiveTab("upload")}
        >
          <UploadIcon />
          <span>Dataset Upload</span>
        </button>
      </div>

      <div className={styles.navGroup}>
        <span className={styles.navLabel}>Analytics</span>

        <button
          className={`${styles.navButton} ${
            activeTab === "correlation" ? styles.navButtonActive : ""
          }`}
          disabled={!isDatasetLoaded}
          onClick={() => setActiveTab("correlation")}
        >
          <CorrelationIcon />
          <span>Correlation Matrix</span>
        </button>

        <button
          className={`${styles.navButton} ${
            activeTab === "pca" ? styles.navButtonActive : ""
          }`}
          disabled={!isDatasetLoaded}
          onClick={() => setActiveTab("pca")}
        >
          <PCAIcon />
          <span>PCA & Clustering</span>
        </button>
      </div>
    </aside>
  );
};
