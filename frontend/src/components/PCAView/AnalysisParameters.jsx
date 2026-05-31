import React, { useMemo } from "react";
import styles from "../../css/pca.module.css";

export const AnalysisParameters = ({
  numericCols,
  columns,
  searchTerm,
  setSearchTerm,
  selectedCols,
  setSelectedCols,
  toggleCol,
  nClusters,
  setNClusters,
  labelCol,
  setLabelCol,
  analyze,
  loading,
  error,
}) => {
  const filteredCols = useMemo(() => {
    if (!searchTerm) return numericCols;
    return numericCols.filter((c) =>
      c.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [numericCols, searchTerm]);

  if (numericCols.length === 0) return null;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNum}>01</span>
        <h2 className={styles.sectionTitle}>Analysis Parameters</h2>
        <span className={styles.selectionCount}>
          Selected: {selectedCols.length} / {numericCols.length}
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
              <button
                className={styles.pill}
                onClick={() => setSelectedCols(numericCols)}
              >
                Select All
              </button>
              <button
                className={styles.pill}
                onClick={() => setSelectedCols([])}
              >
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
          <label className={styles.settingsLabel}>Number of Clusters (k)</label>
          <div className={styles.clusterBtns}>
            {[2, 3, 4, 5, 6].map((k) => (
              <button
                key={k}
                className={`${styles.clusterBtn} ${
                  nClusters === k ? styles.clusterBtnActive : ""
                }`}
                onClick={() => setNClusters(k)}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.settingsBlock}>
          <label className={styles.settingsLabel}>Label Column</label>
          <select
            className={styles.axisSelect}
            value={labelCol || ""}
            onChange={(e) => setLabelCol(e.target.value)}
          >
            <option value="">None</option>
            {columns.map((col) => (
              <option key={col}>{col}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        className={styles.analyzeBtn}
        onClick={analyze}
        disabled={loading || selectedCols.length < 2}
      >
        {loading && <span className={styles.btnSpinner} />}
        {loading ? "Analyzing..." : "Run PCA + Clustering"}
      </button>
      {error && <div className={styles.errorBanner}>{error}</div>}
    </div>
  );
};
