import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import styles from "../css/correlation.module.css";

function corrToColor(value) {
  if (value === null || value === undefined) return "#e5e5e5";
  const v = Math.max(-1, Math.min(1, value));
  if (v >= 0) {
    const r = Math.round(220 + (255 - 220) * v);
    const g = Math.round(220 - 220 * v);
    const b = Math.round(220 - 220 * v);
    return `rgb(${r},${g},${b})`;
  } else {
    const abs = Math.abs(v);
    const r = Math.round(220 - 220 * abs);
    const g = Math.round(220 - 220 * abs);
    const b = Math.round(220 + (255 - 220) * abs);
    return `rgb(${r},${g},${b})`;
  }
}

function formatStatValue(val) {
  if (val === null || val === undefined || isNaN(val)) return "N/A";

  const absVal = Math.abs(val);

  if (absVal >= 1e6) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 2,
    }).format(val);
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(val);
}

function textColor(value) {
  return Math.abs(value) > 0.6 ? "#fff" : "#222";
}

function significanceLabel(pval) {
  if (pval < 0.01) return "***";
  if (pval < 0.05) return "**";
  if (pval < 0.1) return "*";
  return "";
}

export default function CorrelationView({ fileId, numericCols, fileName }) {
  const heatmapRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCols, setSelectedCols] = useState([]);
  const [corrMethod, setCorrMethod] = useState("pearson");
  const [handleOutliers, setHandleOutliers] = useState(false);
  const [corrData, setCorrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [hoveredCell, setHoveredCell] = useState(null);
  const [lockedVariable, setLockedVariable] = useState(null);

  useEffect(() => {
    if (numericCols && numericCols.length > 0) {
      setSelectedCols(numericCols.slice(0, 5));
    }
  }, [numericCols]);

  const toggleCol = (col) => {
    setSelectedCols((prev) =>
      prev.includes(col)
        ? prev.filter((c) => c !== col)
        : prev.length < 30
          ? [...prev, col]
          : prev,
    );
  };

  const handleAnalyze = useCallback(async () => {
    if (selectedCols.length < 2) {
      setError("Choose at least 2 columns");
      return;
    }
    if (!fileId) {
      setError("File ID missing. Please upload the file again.");
      return;
    }

    const token = localStorage.getItem("token");

    setLoading(true);
    setError(null);
    setCorrData(null);
    setLockedVariable(null);
    setHoveredCell(null);

    try {
      const response = await fetch("/api/analysis/correlation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file_id: fileId,
          columns: selectedCols,
          file_name: fileName || "Unknown file",
          method: corrMethod,
          handle_outliers: handleOutliers,
        }),
      });

      if (response.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Analysis Error");
      }

      const result = await response.json();
      setCorrData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCols, fileId, fileName, corrMethod, handleOutliers]);

  const handleStatRowClick = (col) => {
    if (lockedVariable === col) {
      setLockedVariable(null);
    } else {
      setLockedVariable(col);
      if (heatmapRef.current) {
        heatmapRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  const filteredCols = useMemo(() => {
    if (!searchTerm) return numericCols;
    return numericCols.filter((c) =>
      c.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [numericCols, searchTerm]);

  const hoveredInfo =
    hoveredCell && corrData
      ? {
          ti: corrData.tickers[hoveredCell.i],
          tj: corrData.tickers[hoveredCell.j],
          corr: corrData.correlation_matrix[hoveredCell.i][hoveredCell.j],
          pval: corrData.pvalue_matrix[hoveredCell.i][hoveredCell.j],
        }
      : null;

  const isCompactMatrix = corrData && corrData.tickers.length > 12;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageBody}>
        {numericCols.length > 0 && (
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
                    <button
                      className={styles.pill}
                      onClick={() => setSelectedCols(numericCols.slice(0, 30))}
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
                    <span className={styles.emptySearch}>
                      No variables found.
                    </span>
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
                <label className={styles.settingsLabel}>
                  Outlier Treatment
                </label>
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
        )}

        {corrData && (
          <>
            <div className={styles.section} ref={heatmapRef}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNum}>02</span>
                <h2 className={styles.sectionTitle}>Correlation Matrix</h2>
                <span className={styles.sectionHint}>
                  n = {corrData.observations} observations
                </span>
                {lockedVariable && (
                  <button
                    className={styles.actionBtn}
                    onClick={() => setLockedVariable(null)}
                    style={{ marginLeft: "auto" }}
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              <div className={styles.scrollableMatrixContainer}>
                <div
                  className={styles.heatmapGrid}
                  style={{
                    gridTemplateColumns: `max-content repeat(${corrData.tickers.length}, minmax(${isCompactMatrix ? "35px" : "90px"}, 1fr))`,
                  }}
                >
                  <div className={styles.stickyCorner} />

                  {corrData.tickers.map((t) => (
                    <div
                      key={t}
                      className={`${styles.stickyHeaderTop} ${isCompactMatrix ? styles.verticalText : ""} ${lockedVariable === t ? styles.headerLocked : ""}`}
                      title={t}
                    >
                      {t}
                    </div>
                  ))}

                  {corrData.tickers.map((rowTicker, i) => (
                    <React.Fragment key={rowTicker}>
                      <div
                        className={`${styles.stickyHeaderLeft} ${lockedVariable === rowTicker ? styles.headerLocked : ""}`}
                        title={rowTicker}
                      >
                        {rowTicker}
                      </div>

                      {corrData.tickers.map((_, j) => {
                        const val = corrData.correlation_matrix[i][j];
                        const pval = corrData.pvalue_matrix[i][j];

                        const isLocked =
                          lockedVariable &&
                          (corrData.tickers[i] === lockedVariable ||
                            corrData.tickers[j] === lockedVariable);
                        const isHovered =
                          !lockedVariable &&
                          hoveredCell &&
                          (hoveredCell.i === i || hoveredCell.j === j) &&
                          !(hoveredCell.i === i && hoveredCell.j === j);
                        const isActive =
                          !lockedVariable &&
                          hoveredCell &&
                          hoveredCell.i === i &&
                          hoveredCell.j === j;
                        const isDimmed = lockedVariable && !isLocked;

                        return (
                          <div
                            key={j}
                            className={`${styles.matrixCell} ${isHovered ? styles.matrixCellHovered : ""} ${isActive ? styles.matrixCellActive : ""} ${isLocked ? styles.matrixCellLocked : ""} ${isDimmed ? styles.matrixCellDimmed : ""}`}
                            style={{
                              backgroundColor: corrToColor(val),
                              color: textColor(val),
                            }}
                            onMouseEnter={() => setHoveredCell({ i, j })}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            {!isCompactMatrix && (
                              <span className={styles.cellValueText}>
                                {val.toFixed(2)}
                              </span>
                            )}
                            {!isCompactMatrix && significanceLabel(pval) && (
                              <span className={styles.cellSigText}>
                                {significanceLabel(pval)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className={styles.infoBarMargin}>
                {hoveredInfo && hoveredInfo.ti !== hoveredInfo.tj ? (
                  <span>
                    <strong>{hoveredInfo.ti}</strong> ↔{" "}
                    <strong>{hoveredInfo.tj}</strong>: &nbsp;r ={" "}
                    <strong>{hoveredInfo.corr.toFixed(4)}</strong>
                    &nbsp;· p = {hoveredInfo.pval.toFixed(4)}{" "}
                    {significanceLabel(hoveredInfo.pval)}
                  </span>
                ) : (
                  <span>
                    Hover over cell for details &nbsp;·&nbsp; *** p&lt;0.01
                    &nbsp;** p&lt;0.05 &nbsp;* p&lt;0.1
                  </span>
                )}
              </div>

              <div className={styles.legend}>
                <span>-1</span>
                <div className={styles.legendBar} />
                <span>0</span>
                <div className={styles.legendBar2} />
                <span>+1</span>
                <span className={styles.legendDesc}>
                  Negative → None → Positive correlation
                </span>
              </div>
            </div>

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
                    {Object.entries(corrData.descriptive_stats).map(
                      ([col, s]) => (
                        <tr
                          key={col}
                          className={`${styles.dataTableRow} ${lockedVariable === col ? styles.dataTableRowLocked : ""}`}
                          onClick={() => handleStatRowClick(col)}
                        >
                          <td className={styles.varNameCell}>
                            <div className={styles.varNameInner}>{col}</div>
                          </td>
                          <td>{formatStatValue(s.mean)}</td>
                          <td>{formatStatValue(s.std)}</td>
                          <td>{formatStatValue(s.median)}</td>
                          <td>{s.shapiro_pvalue}</td>
                          <td>{formatStatValue(s.min)}</td>
                          <td>{formatStatValue(s.max)}</td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
