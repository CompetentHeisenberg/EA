import React, { useState, useCallback } from "react";
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

function textColor(value) {
  return Math.abs(value) > 0.6 ? "#fff" : "#222";
}

function significanceLabel(pval) {
  if (pval < 0.01) return "***";
  if (pval < 0.05) return "**";
  if (pval < 0.1) return "*";
  return "";
}

function recordsToColumns(records, selectedCols) {
  const result = {};
  for (const col of selectedCols) {
    result[col] = records
      .map((r) => parseFloat(r[col]))
      .filter((v) => !isNaN(v));
  }
  return result;
}

export default function CorrelationPage() {
  const [uploadedData, setUploadedData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [fileName, setFileName] = useState("");
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  const [selectedCols, setSelectedCols] = useState([]);
  const [corrData, setCorrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  const numericCols = columns.filter((col) => {
    if (!uploadedData.length) return false;
    return !isNaN(parseFloat(uploadedData[0][col]));
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem("token");

    setFileName(file.name);
    setUploadStatus("loading");
    setUploadMessage("File processing...");
    setCorrData(null);
    setSelectedCols([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        throw new Error("Authorization error: Please log in again.");
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Loading Error");
      }

      const result = await response.json();
      setUploadedData(result.data);
      setColumns(result.columns);
      setSelectedCols(
        result.columns
          .filter((col) => !isNaN(parseFloat(result.data[0]?.[col])))
          .slice(0, 5),
      );
      setUploadStatus("success");
      setUploadMessage(
        `${result.data.length} rows · ${result.columns.length} columns`,
      );
    } catch (err) {
      setUploadStatus("error");
      setUploadMessage(err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload({ target: { files: [file] } });
  };

  const toggleCol = (col) => {
    setSelectedCols((prev) =>
      prev.includes(col)
        ? prev.filter((c) => c !== col)
        : prev.length < 10
          ? [...prev, col]
          : prev,
    );
  };

  const handleAnalyze = useCallback(async () => {
    if (selectedCols.length < 2) {
      setError("Choose at least 2 columns");
      return;
    }
    const token = localStorage.getItem("token");

    setLoading(true);
    setError(null);
    setCorrData(null);
    try {
      const colData = recordsToColumns(uploadedData, selectedCols);
      const response = await fetch("/api/analysis/correlation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: colData,
          file_name: fileName || "Unknown file",
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
  }, [selectedCols, uploadedData, fileName]);

  const hoveredInfo =
    hoveredCell && corrData
      ? {
          ti: corrData.tickers[hoveredCell.i],
          tj: corrData.tickers[hoveredCell.j],
          corr: corrData.correlation_matrix[hoveredCell.i][hoveredCell.j],
          pval: corrData.pvalue_matrix[hoveredCell.i][hoveredCell.j],
        }
      : null;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <div>
            <h1 className={styles.pageTitle}>Correlation analysis</h1>
            <p className={styles.pageDesc}>
              Pearson correlation matrix · Significance levels · Descriptive
              statistics
            </p>
          </div>
        </div>
      </div>

      <div className={styles.pageBody}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>01</span>
            <h2 className={styles.sectionTitle}>Data Loading</h2>
          </div>

          <div
            className={`${styles.dropZone} ${uploadStatus === "success" ? styles.dropZoneSuccess : ""} ${uploadStatus === "error" ? styles.dropZoneError : ""}`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById("corrFileInput").click()}
          >
            <input
              id="corrFileInput"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />

            {uploadStatus === "loading" ? (
              <div className={styles.uploadState}>
                <div className={styles.spinner} />
                <span>Processing File...</span>
              </div>
            ) : uploadStatus === "success" ? (
              <div className={styles.uploadState}>
                <div className={styles.successIcon}>✓</div>
                <div className={styles.uploadInfo}>
                  <span className={styles.uploadFileName}>{fileName}</span>
                  <span className={styles.uploadMeta}>{uploadMessage}</span>
                </div>
                <span className={styles.replaceHint}>Click to change</span>
              </div>
            ) : (
              <div className={styles.uploadState}>
                <div className={styles.uploadArrow}>↑</div>
                <div className={styles.uploadInfo}>
                  <span className={styles.uploadCta}>
                    Drag and drop file or click to select
                  </span>
                  <span className={styles.uploadMeta}>
                    Support CSV, XLSX, XLS
                  </span>
                </div>
              </div>
            )}
          </div>

          {uploadStatus === "error" && (
            <div className={styles.errorBanner}>{uploadMessage}</div>
          )}
        </div>

        {numericCols.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>02</span>
              <h2 className={styles.sectionTitle}>
                Choose columns for analysis
              </h2>
              <span className={styles.sectionHint}>
                Chosen: {selectedCols.length} / maximum. 10
              </span>
            </div>

            <div className={styles.pillGrid}>
              {numericCols.map((col) => (
                <button
                  key={col}
                  className={`${styles.pill} ${selectedCols.includes(col) ? styles.pillActive : ""}`}
                  onClick={() => toggleCol(col)}
                >
                  {col}
                </button>
              ))}
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
                "Construct a correlation matrix"
              )}
            </button>

            {error && <div className={styles.errorBanner}>{error}</div>}
          </div>
        )}

        {corrData && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNum}>03</span>
                <h2 className={styles.sectionTitle}>Correlation matrix</h2>
                <span className={styles.sectionHint}>
                  n = {corrData.observations} observations
                </span>
              </div>

              <div className={styles.heatmapWrapper}>
                <div
                  className={styles.heatmap}
                  style={{
                    gridTemplateColumns: `max-content repeat(${corrData.tickers.length}, 1fr)`,
                  }}
                >
                  <div className={styles.cornerCell} />
                  {corrData.tickers.map((t) => (
                    <div key={t} className={styles.headerCell}>
                      {t}
                    </div>
                  ))}
                  {corrData.tickers.map((rowTicker, i) => (
                    <React.Fragment key={rowTicker}>
                      <div className={styles.rowLabel}>{rowTicker}</div>
                      {corrData.tickers.map((_, j) => {
                        const val = corrData.correlation_matrix[i][j];
                        const pval = corrData.pvalue_matrix[i][j];
                        const isHovered =
                          hoveredCell &&
                          (hoveredCell.i === i || hoveredCell.j === j) &&
                          !(hoveredCell.i === i && hoveredCell.j === j);
                        const isActive =
                          hoveredCell &&
                          hoveredCell.i === i &&
                          hoveredCell.j === j;
                        return (
                          <div
                            key={j}
                            className={`${styles.cell} ${isHovered ? styles.cellDim : ""} ${isActive ? styles.cellActive : ""}`}
                            style={{
                              backgroundColor: corrToColor(val),
                              color: textColor(val),
                            }}
                            onMouseEnter={() => setHoveredCell({ i, j })}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            <span className={styles.cellValue}>
                              {val.toFixed(2)}
                            </span>
                            <span className={styles.cellSig}>
                              {significanceLabel(pval)}
                            </span>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className={styles.infoBar}>
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
                <span className={styles.sectionNum}>04</span>
                <h2 className={styles.sectionTitle}>Descriptive statistics</h2>
              </div>
              <div className={styles.statsGrid}>
                {Object.entries(corrData.descriptive_stats).map(([col, s]) => (
                  <div key={col} className={styles.statCard}>
                    <div className={styles.statCardTitle}>{col}</div>
                    <div className={styles.statRow}>
                      <span>Mean</span>
                      <span>{s.mean}</span>
                    </div>
                    <div className={styles.statRow}>
                      <span>Std. dev.</span>
                      <span>{s.std}</span>
                    </div>
                    <div className={styles.statRow}>
                      <span>Min</span>
                      <span>{s.min}</span>
                    </div>
                    <div className={styles.statRow}>
                      <span>Max</span>
                      <span>{s.max}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
