import React, { useState, useCallback, useRef, useEffect } from "react";
import styles from "../css/pca.module.css";

function recordsToMatrix(records, selectedCols) {
  return records.map((row) =>
    selectedCols.reduce((acc, col) => {
      acc[col] = parseFloat(row[col]);
      return acc;
    }, {}),
  );
}

const CLUSTER_COLORS = [
  "#d90429",
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
];

export default function PCAPage() {
  const canvasRef = useRef(null);

  const [uploadedData, setUploadedData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [fileName, setFileName] = useState("");
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  const [selectedCols, setSelectedCols] = useState([]);
  const [nClusters, setNClusters] = useState(3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [axisX, setAxisX] = useState("PC1");
  const [axisY, setAxisY] = useState("PC2");

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
    setResult(null);
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
        throw new Error(err.detail || "Upload failed");
      }

      const res = await response.json();
      setUploadedData(res.data);
      setColumns(res.columns);

      const numeric = res.columns.filter(
        (col) => !isNaN(parseFloat(res.data[0]?.[col])),
      );
      setSelectedCols(numeric.slice(0, 8));
      setUploadStatus("success");
      setUploadMessage(
        `${res.data.length} rows · ${res.columns.length} columns`,
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
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    );
  };

  const handleAnalyze = useCallback(async () => {
    if (selectedCols.length < 2) {
      setError("Please select at least 2 columns");
      return;
    }

    const token = localStorage.getItem("token");
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const matrix = recordsToMatrix(uploadedData, selectedCols);
      const response = await fetch("/api/analysis/pca", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: matrix, n_clusters: nClusters }),
      });

      if (response.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Analysis failed");
      }

      const data = await response.json();
      setResult(data);
      setAxisX("PC1");
      setAxisY("PC2");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCols, uploadedData, nClusters]);

  useEffect(() => {
    if (!result || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const PAD = 48;

    const xKey = axisX;
    const yKey = axisY;

    const xs = result.pca_data.map((p) => p[xKey] ?? 0);
    const ys = result.pca_data.map((p) => p[yKey] ?? 0);

    const xMin = Math.min(...xs),
      xMax = Math.max(...xs);
    const yMin = Math.min(...ys),
      yMax = Math.max(...ys);
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    const toCanvasX = (v) => PAD + ((v - xMin) / xRange) * (W - PAD * 2);
    const toCanvasY = (v) => H - PAD - ((v - yMin) / yRange) * (H - PAD * 2);

    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = PAD + (i / 5) * (W - PAD * 2);
      const y = PAD + (i / 5) * (H - PAD * 2);
      ctx.beginPath();
      ctx.moveTo(x, PAD);
      ctx.lineTo(x, H - PAD);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PAD, y);
      ctx.lineTo(W - PAD, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#dee2e6";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD, H - PAD);
    ctx.lineTo(W - PAD, H - PAD);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PAD, PAD);
    ctx.lineTo(PAD, H - PAD);
    ctx.stroke();

    ctx.fillStyle = "#868e96";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(xKey, W / 2, H - 10);
    ctx.save();
    ctx.translate(14, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yKey, 0, 0);
    ctx.restore();

    result.pca_data.forEach((point, idx) => {
      const cx = toCanvasX(point[xKey] ?? 0);
      const cy = toCanvasY(point[yKey] ?? 0);
      const cluster = result.clusters[idx];
      const color = CLUSTER_COLORS[cluster % CLUSTER_COLORS.length];
      const isHovered = hoveredPoint === idx;

      ctx.beginPath();
      ctx.arc(cx, cy, isHovered ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = isHovered ? 1 : 0.75;
      ctx.fill();
      if (isHovered) {
        ctx.strokeStyle = "#121212";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
  }, [result, axisX, axisY, hoveredPoint]);

  const handleCanvasMouseMove = (e) => {
    if (!result || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const PAD = 48;
    const W = canvas.width,
      H = canvas.height;

    const xKey = axisX,
      yKey = axisY;
    const xs = result.pca_data.map((p) => p[xKey] ?? 0);
    const ys = result.pca_data.map((p) => p[yKey] ?? 0);
    const xMin = Math.min(...xs),
      xMax = Math.max(...xs);
    const yMin = Math.min(...ys),
      yMax = Math.max(...ys);
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    const toCanvasX = (v) => PAD + ((v - xMin) / xRange) * (W - PAD * 2);
    const toCanvasY = (v) => H - PAD - ((v - yMin) / yRange) * (H - PAD * 2);

    let closest = null,
      minDist = 20;
    result.pca_data.forEach((point, idx) => {
      const cx = toCanvasX(point[xKey] ?? 0);
      const cy = toCanvasY(point[yKey] ?? 0);
      const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closest = idx;
      }
    });
    setHoveredPoint(closest);
  };

  const pcaKeys = result ? Object.keys(result.pca_data[0]) : [];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <div>
            <h1 className={styles.pageTitle}>PCA & Cluster Analysis</h1>
            <p className={styles.pageDesc}>
              Principal Component Analysis · K-Means Clustering · Dimensionality
              Reduction
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
            onClick={() => document.getElementById("pcaFileInput").click()}
          >
            <input
              id="pcaFileInput"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            {uploadStatus === "loading" ? (
              <div className={styles.uploadState}>
                <div className={styles.spinner} />
                <span>Processing file...</span>
              </div>
            ) : uploadStatus === "success" ? (
              <div className={styles.uploadState}>
                <div className={styles.successIcon}>✓</div>
                <div className={styles.uploadInfo}>
                  <span className={styles.uploadFileName}>{fileName}</span>
                  <span className={styles.uploadMeta}>{uploadMessage}</span>
                </div>
                <span className={styles.replaceHint}>Click to replace</span>
              </div>
            ) : (
              <div className={styles.uploadState}>
                <div className={styles.uploadArrow}>↑</div>
                <div className={styles.uploadInfo}>
                  <span className={styles.uploadCta}>
                    Drag file or click to select
                  </span>
                  <span className={styles.uploadMeta}>CSV, XLSX, XLS</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {numericCols.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>02</span>
              <h2 className={styles.sectionTitle}>Analysis Parameters</h2>
              <span className={styles.sectionHint}>
                Selected: {selectedCols.length}
              </span>
            </div>

            <div className={styles.settingsRow}>
              <div className={styles.settingsBlock}>
                <label className={styles.settingsLabel}>
                  Variables for Analysis
                </label>
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
              </div>

              <div className={styles.settingsBlock} style={{ minWidth: 180 }}>
                <label className={styles.settingsLabel}>
                  Number of Clusters (k)
                </label>
                <div className={styles.clusterBtns}>
                  {[2, 3, 4, 5, 6].map((k) => (
                    <button
                      key={k}
                      className={`${styles.clusterBtn} ${nClusters === k ? styles.clusterBtnActive : ""}`}
                      onClick={() => setNClusters(k)}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              className={styles.analyzeBtn}
              onClick={handleAnalyze}
              disabled={loading || selectedCols.length < 2}
            >
              {loading ? "Analyzing..." : "Run PCA + Clustering"}
            </button>
            {error && <div className={styles.errorBanner}>{error}</div>}
          </div>
        )}

        {result && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNum}>03</span>
                <h2 className={styles.sectionTitle}>Explained Variance</h2>
                <span className={styles.sectionHint}>
                  Total:{" "}
                  {(result.variance.reduce((a, b) => a + b, 0) * 100).toFixed(
                    1,
                  )}
                  %
                </span>
              </div>
              <div className={styles.varianceBars}>
                {result.variance.map((v, i) => (
                  <div key={i} className={styles.varianceItem}>
                    <div className={styles.varianceLabel}>PC{i + 1}</div>
                    <div className={styles.varianceTrack}>
                      <div
                        className={styles.varianceFill}
                        style={{ width: `${v * 100}%` }}
                      />
                    </div>
                    <div className={styles.variancePct}>
                      {(v * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNum}>04</span>
                <h2 className={styles.sectionTitle}>Projection Plot</h2>
                <div className={styles.axisSelectors}>
                  <select
                    className={styles.axisSelect}
                    value={axisX}
                    onChange={(e) => setAxisX(e.target.value)}
                  >
                    {pcaKeys.map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                  <select
                    className={styles.axisSelect}
                    value={axisY}
                    onChange={(e) => setAxisY(e.target.value)}
                  >
                    {pcaKeys.map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.chartArea}>
                <canvas
                  ref={canvasRef}
                  width={760}
                  height={440}
                  className={styles.canvas}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {hoveredPoint !== null && (
                  <div className={styles.tooltip}>
                    <div className={styles.tooltipTitle}>
                      Observation #{hoveredPoint + 1}
                    </div>
                    <div className={styles.tooltipRow}>
                      <span>Cluster</span>
                      <span
                        style={{
                          color:
                            CLUSTER_COLORS[
                              result.clusters[hoveredPoint] %
                                CLUSTER_COLORS.length
                            ],
                          fontWeight: 700,
                        }}
                      >
                        {result.clusters[hoveredPoint] + 1}
                      </span>
                    </div>
                    {pcaKeys.map((k) => (
                      <div key={k} className={styles.tooltipRow}>
                        <span>{k}</span>
                        <span>
                          {(result.pca_data[hoveredPoint][k] ?? 0).toFixed(4)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNum}>05</span>
                <h2 className={styles.sectionTitle}>Results Table</h2>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Cluster</th>
                      {pcaKeys.map((k) => (
                        <th key={k}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.pca_data.slice(0, 50).map((row, i) => (
                      <tr
                        key={i}
                        className={
                          hoveredPoint === i ? styles.rowHighlight : ""
                        }
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        <td>{i + 1}</td>
                        <td>
                          <span
                            className={styles.clusterBadge}
                            style={{
                              background:
                                CLUSTER_COLORS[
                                  result.clusters[i] % CLUSTER_COLORS.length
                                ],
                            }}
                          >
                            {result.clusters[i] + 1}
                          </span>
                        </td>
                        {pcaKeys.map((k) => (
                          <td key={k}>{(row[k] ?? 0).toFixed(4)}</td>
                        ))}
                      </tr>
                    ))}
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
