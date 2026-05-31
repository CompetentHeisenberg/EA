import React, { useState, useMemo } from "react";
import styles from "../../css/correlation.module.css";

export const AnalysisParameters = ({
  numericCols,
  selectedCols,
  setSelectedCols,
  toggleCol,
  corrMethod,
  setCorrMethod,
  handleOutliers,
  setHandleOutliers,
  handleAnalyze,
  loading,
  error,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCols = useMemo(() => {
    if (!searchTerm) {
      return numericCols;
    }
    return numericCols.filter((col) =>
      col.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [numericCols, searchTerm]);

  const handleSelectAll = () => {
    setSelectedCols(numericCols.slice(0, 30));
  };

  const handleClearAll = () => {
    setSelectedCols([]);
  };

  if (!numericCols || numericCols.length === 0) {
    return null;
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNum}>01</span>
        <h2 className={styles.sectionTitle}>Analysis Parameters</h2>
        <span className={styles.sectionHint}>
          Selected: {selectedCols.length} / Max 30
        </span>
      </div>

      <div className={styles.settingsRow}>
        <div className={styles.settingsBlockFlex}>
          <div className={styles.settingsSearchHeader}>
            <input
              type="text"
              placeholder="Search variables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <div className={styles.actionBtnGroup}>
              <button className={styles.pill} onClick={handleSelectAll}>
                Select All
              </button>
              <button className={styles.pill} onClick={handleClearAll}>
                Clear
              </button>
            </div>
          </div>

          <div className={styles.pillGridScrollable}>
            {filteredCols.map((col) => (
              <button
                key={col}
                className={`${styles.pill} ${
                  selectedCols.includes(col) ? styles.pillActive : ""
                }`}
                onClick={() => toggleCol(col)}
              >
                {col}
              </button>
            ))}
            {filteredCols.length === 0 && (
              <span className={styles.emptySearch}>No variables found.</span>
            )}
          </div>
        </div>

        <div className={styles.settingsBlock}>
          <label className={styles.settingsLabel}>Method</label>
          <select
            className={styles.customSelect}
            value={corrMethod}
            onChange={(e) => setCorrMethod(e.target.value)}
          >
            <option value="pearson">Pearson</option>
            <option value="spearman">Spearman</option>
          </select>
        </div>

        <div className={styles.settingsBlock}>
          <label className={styles.settingsLabel}>Outlier Treatment</label>
          <select
            className={styles.customSelect}
            value={handleOutliers ? "yes" : "no"}
            onChange={(e) => setHandleOutliers(e.target.value === "yes")}
          >
            <option value="no">None</option>
            <option value="yes">Winsorize (1% - 99%)</option>
          </select>
        </div>
      </div>

      <button
        className={styles.analyzeBtn}
        onClick={handleAnalyze}
        disabled={loading || selectedCols.length < 2}
      >
        {loading ? (
          <>
            <div className={styles.btnSpinner} />
            Analyzing...
          </>
        ) : (
          "Construct Correlation Matrix"
        )}
      </button>

      {error && <div className={styles.errorBanner}>{error}</div>}
    </div>
  );
};
