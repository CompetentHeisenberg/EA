import React from "react";
import styles from "../../css/profile.module.css";

export const SettingsSection = ({
  settings,
  loadingSettings,
  savingSettings,
  settingsSaved,
  updateSettingField,
  saveSettings,
}) => {
  if (loadingSettings) {
    return (
      <div className={`${styles.section} ${styles.settingsCard}`}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionNum}>02</span>
          <h2 className={styles.sectionTitle}>Settings</h2>
        </div>
        <div className={styles.loadingRow}>
          <div className={styles.spinner} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.section} ${styles.settingsCard}`}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNum}>02</span>
        <h2 className={styles.sectionTitle}>Settings</h2>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        <div className={styles.settingRow}>
          <label className={styles.settingLabel}>
            Default number of clusters
          </label>
          <div className={styles.clusterBtns}>
            {[2, 3, 4, 5, 6].map((k) => (
              <button
                key={k}
                className={`${styles.clusterBtn} ${settings.default_clusters === k ? styles.clusterBtnActive : ""}`}
                onClick={() => updateSettingField("default_clusters", k)}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.settingRow}>
          <label className={styles.settingLabel}>Default PCA axes</label>
          <div className={styles.axisOptions}>
            {["PC1,PC2", "PC1,PC3", "PC2,PC3"].map((axes) => (
              <button
                key={axes}
                className={`${styles.pill} ${settings.preferred_pca_axes === axes ? styles.pillActive : ""}`}
                onClick={() => updateSettingField("preferred_pca_axes", axes)}
              >
                {axes.replace(",", " / ")}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.settingRow}>
          <label className={styles.settingLabel}>Correlation method</label>
          <div className={styles.axisOptions}>
            {["pearson", "spearman"].map((method) => (
              <button
                key={method}
                className={`${styles.pill} ${settings.correlation_method === method ? styles.pillActive : ""}`}
                onClick={() => updateSettingField("correlation_method", method)}
              >
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.settingRow}>
          <label className={styles.settingLabel}>Outlier treatment</label>
          <div className={styles.axisOptions}>
            {["none", "winsorize"].map((treatment) => (
              <button
                key={treatment}
                className={`${styles.pill} ${settings.outlier_treatment === treatment ? styles.pillActive : ""}`}
                onClick={() =>
                  updateSettingField("outlier_treatment", treatment)
                }
              >
                {treatment.charAt(0).toUpperCase() + treatment.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        className={styles.saveBtn}
        onClick={saveSettings}
        disabled={savingSettings}
      >
        {savingSettings ? (
          <>
            <div className={styles.btnSpinner} />
            Saving...
          </>
        ) : settingsSaved ? (
          "✓ Saved"
        ) : (
          "Save settings"
        )}
      </button>
    </div>
  );
};
