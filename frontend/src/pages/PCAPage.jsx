import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { quadtree } from "d3-quadtree";
import styles from "../css/pca.module.css";

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

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PAD = 60;

export default function PCAPage() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const hoverThrottle = useRef(false);

  const [fileId, setFileId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [numericCols, setNumericCols] = useState([]);
  const [fileName, setFileName] = useState("");
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  const [labelCol, setLabelCol] = useState("");
  const [selectedCols, setSelectedCols] = useState([]);
  const [nClusters, setNClusters] = useState(3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [axisX, setAxisX] = useState("PC1");
  const [axisY, setAxisY] = useState("PC2");

  const [zoom, setZoom] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const [page, setPage] = useState(0);
  const rowsPerPage = 50;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    setFileName(file.name);
    setUploadStatus("loading");
    setResult(null);
    setSelectedCols([]);
    setLabelCol("");
    setPage(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.status === 401) throw new Error("Authorization expired.");
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Upload error");
      }

      const res = await response.json();

      setFileId(res.file_id);
      setColumns(res.columns);

      const numCols = res.numeric_columns || [];
      setNumericCols(numCols);

      const textCols = res.columns.filter((col) => !numCols.includes(col));
      if (textCols.length > 0) setLabelCol(textCols[0]);

      setSelectedCols(numCols.slice(0, 8));
      setUploadStatus("success");
      setUploadMessage(
        `Loaded rows: ${res.total_rows} · Columns: ${res.columns.length}`,
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
      setError("Select at least 2 columns");
      return;
    }

    const token = localStorage.getItem("token");
    setLoading(true);
    setError(null);
    setResult(null);
    setPage(0);
    setZoom({ scale: 1, offsetX: 0, offsetY: 0 });

    try {
      const response = await fetch("/api/analysis/pca", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file_id: fileId,
          columns: selectedCols,
          label_column: labelCol || null,
          n_clusters: nClusters,
        }),
      });

      if (response.status === 401) throw new Error("Authorization expired.");
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Analysis error");
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
  }, [selectedCols, fileId, labelCol, nClusters]);

  useEffect(() => {
    setZoom({ scale: 1, offsetX: 0, offsetY: 0 });
    setHoveredPoint(null);
  }, [axisX, axisY]);

  const getTopFeature = useCallback(
    (pcKey) => {
      if (!result || !result.loadings) return null;
      const loadings = result.loadings[pcKey];
      if (!loadings) return null;
      let maxAbs = -Infinity;
      let topFeature = null;
      for (const [feat, val] of Object.entries(loadings)) {
        if (Math.abs(val) > maxAbs) {
          maxAbs = Math.abs(val);
          topFeature = feat;
        }
      }
      return topFeature;
    },
    [result],
  );

  const chartData = useMemo(() => {
    if (!result || !result.pca_data) return null;

    const xs = result.pca_data.map((p) => p[axisX] ?? 0);
    const ys = result.pca_data.map((p) => p[axisY] ?? 0);

    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);

    const xMargin = (xMax - xMin) * 0.05 || 1;
    const yMargin = (yMax - yMin) * 0.05 || 1;

    const finalXMin = xMin - xMargin;
    const finalYMin = yMin - yMargin;
    const xRange = xMax + xMargin - finalXMin || 1;
    const yRange = yMax + yMargin - finalYMin || 1;

    const toCanvasX = (v) =>
      PAD + ((v - finalXMin) / xRange) * (CANVAS_WIDTH - PAD * 2);
    const toCanvasY = (v) =>
      CANVAS_HEIGHT -
      PAD -
      ((v - finalYMin) / yRange) * (CANVAS_HEIGHT - PAD * 2);

    return result.pca_data.map((point, idx) => ({
      originalIndex: idx,
      cx: toCanvasX(point[axisX] ?? 0),
      cy: toCanvasY(point[axisY] ?? 0),
      cluster: result.clusters[idx],
      color: CLUSTER_COLORS[result.clusters[idx] % CLUSTER_COLORS.length],
    }));
  }, [result, axisX, axisY]);

  const tree = useMemo(() => {
    if (!chartData) return null;
    return quadtree()
      .x((d) => d.cx)
      .y((d) => d.cy)
      .addAll(chartData);
  }, [chartData]);

  useEffect(() => {
    if (!chartData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const { scale, offsetX, offsetY } = zoom;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1 / scale;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const x = PAD + (i / 5) * (CANVAS_WIDTH - PAD * 2);
      const y = PAD + (i / 5) * (CANVAS_HEIGHT - PAD * 2);
      ctx.moveTo(x, PAD);
      ctx.lineTo(x, CANVAS_HEIGHT - PAD);
      ctx.moveTo(PAD, y);
      ctx.lineTo(CANVAS_WIDTH - PAD, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "#dee2e6";
    ctx.lineWidth = 1.5 / scale;
    ctx.beginPath();
    ctx.moveTo(PAD, CANVAS_HEIGHT - PAD);
    ctx.lineTo(CANVAS_WIDTH - PAD, CANVAS_HEIGHT - PAD);
    ctx.moveTo(PAD, PAD);
    ctx.lineTo(PAD, CANVAS_HEIGHT - PAD);
    ctx.stroke();

    ctx.restore();

    const topFeatureX = getTopFeature(axisX);
    const topFeatureY = getTopFeature(axisY);

    const xLabel = topFeatureX ? `${axisX} (${topFeatureX})` : axisX;
    const yLabel = topFeatureY ? `${axisY} (${topFeatureY})` : axisY;

    ctx.fillStyle = "#868e96";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(xLabel, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
    ctx.save();
    ctx.translate(20, CANVAS_HEIGHT / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    ctx.globalAlpha = 0.75;
    chartData.forEach(({ cx, cy, color, originalIndex }) => {
      if (hoveredPoint === originalIndex) return;
      ctx.beginPath();
      ctx.arc(cx, cy, 5 / scale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    if (hoveredPoint !== null) {
      const activePoint = chartData[hoveredPoint];
      if (activePoint) {
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(activePoint.cx, activePoint.cy, 8 / scale, 0, Math.PI * 2);
        ctx.fillStyle = activePoint.color;
        ctx.fill();
        ctx.strokeStyle = "#121212";
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [chartData, hoveredPoint, axisX, axisY, zoom, getTopFeature]);

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const cursorX = (e.clientX - rect.left) * scaleX;
    const cursorY = (e.clientY - rect.top) * scaleY;

    setIsDragging(true);
    dragStart.current = {
      x: cursorX - zoom.offsetX,
      y: cursorY - zoom.offsetY,
    };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const cursorX = (e.clientX - rect.left) * scaleX;
    const cursorY = (e.clientY - rect.top) * scaleY;

    if (isDragging) {
      setZoom((prev) => ({
        ...prev,
        offsetX: cursorX - dragStart.current.x,
        offsetY: cursorY - dragStart.current.y,
      }));
      return;
    }

    if (!tree || hoverThrottle.current) return;

    hoverThrottle.current = true;
    requestAnimationFrame(() => {
      hoverThrottle.current = false;
    });

    const { scale, offsetX, offsetY } = zoom;
    const mx = (cursorX - offsetX) / scale;
    const my = (cursorY - offsetY) / scale;

    const closest = tree.find(mx, my, 20 / scale);
    setHoveredPoint(closest ? closest.originalIndex : null);
  };

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;

    setZoom((prev) => {
      const newScale = Math.min(Math.max(prev.scale * zoomFactor, 0.1), 10000);
      const mouseXData = (mouseX - prev.offsetX) / prev.scale;
      const mouseYData = (mouseY - prev.offsetY) / prev.scale;
      const newOffsetX = mouseX - mouseXData * newScale;
      const newOffsetY = mouseY - mouseYData * newScale;
      return { scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY };
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e) => handleWheel(e);
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handler);
    };
  }, [handleWheel, result]);

  const pcaKeys = result ? Object.keys(result.pca_data[0]) : [];
  const totalPages = result
    ? Math.ceil(result.pca_data.length / rowsPerPage)
    : 0;

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
            className={`${styles.dropZone} ${
              uploadStatus === "success" ? styles.dropZoneSuccess : ""
            } ${uploadStatus === "error" ? styles.dropZoneError : ""}`}
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
              <div className={styles.settingsBlock} style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <label className={styles.settingsLabel} style={{ margin: 0 }}>
                    Variables for Analysis
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
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
                <div className={styles.pillGrid}>
                  {numericCols.map((col) => (
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

              <div className={styles.settingsBlock} style={{ minWidth: 180 }}>
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
              onClick={handleAnalyze}
              disabled={loading || selectedCols.length < 2}
            >
              {loading && <span className={styles.btnSpinner} />}
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
                  {(zoom.scale !== 1 ||
                    zoom.offsetX !== 0 ||
                    zoom.offsetY !== 0) && (
                    <button
                      className={styles.pill}
                      onClick={() =>
                        setZoom({ scale: 1, offsetX: 0, offsetY: 0 })
                      }
                    >
                      Reset view
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.chartArea} ref={wrapperRef}>
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className={styles.canvas}
                  style={{
                    touchAction: "none",
                    cursor: isDragging
                      ? "grabbing"
                      : hoveredPoint !== null
                        ? "pointer"
                        : "grab",
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => {
                    handleMouseUp();
                    setHoveredPoint(null);
                  }}
                  onMouseMove={handleCanvasMouseMove}
                />

                {hoveredPoint !== null && !isDragging && (
                  <div
                    className={styles.tooltip}
                    style={{ minWidth: "260px", pointerEvents: "none" }}
                  >
                    <div
                      className={styles.tooltipTitle}
                      style={{ color: "#fff", marginBottom: "8px" }}
                    >
                      {labelCol ? (
                        <>
                          <span
                            style={{
                              fontWeight: 400,
                              color: "#aaa",
                              fontSize: "12px",
                              marginRight: "6px",
                            }}
                          >
                            {labelCol}:
                          </span>
                          {result.original_data &&
                          result.original_data[hoveredPoint]
                            ? result.original_data[hoveredPoint][labelCol]
                            : "N/A"}
                        </>
                      ) : (
                        `Observation #${hoveredPoint + 1}`
                      )}
                    </div>

                    <div className={styles.tooltipRow}>
                      <span style={{ color: "#ccc" }}>Cluster</span>
                      <span
                        style={{
                          color:
                            CLUSTER_COLORS[
                              result.clusters[hoveredPoint] %
                                CLUSTER_COLORS.length
                            ],
                          fontWeight: 700,
                          fontSize: "14px",
                        }}
                      >
                        {result.clusters[hoveredPoint] + 1}
                      </span>
                    </div>

                    <div
                      style={{
                        margin: "8px 0",
                        padding: "8px",
                        background: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "6px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#bbb",
                          textTransform: "uppercase",
                          marginBottom: "6px",
                        }}
                      >
                        YOUR DATA
                      </div>
                      {selectedCols.map((col) => (
                        <div
                          key={`orig-${col}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "4px",
                          }}
                        >
                          <span style={{ color: "#ddd" }}>{col}</span>
                          <span style={{ fontWeight: 800, color: "#fff" }}>
                            {result.original_data &&
                            result.original_data[hoveredPoint]
                              ? result.original_data[hoveredPoint][col]
                              : "N/A"}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        margin: "8px 0",
                        borderTop: "1px solid rgba(255, 255, 255, 0.15)",
                      }}
                    />

                    {pcaKeys.map((k) => (
                      <div
                        key={k}
                        className={styles.tooltipRow}
                        style={{ marginBottom: "2px" }}
                      >
                        <span style={{ color: "#ccc" }}>{k}</span>
                        <span style={{ color: "#fff", fontWeight: 500 }}>
                          {(result.pca_data[hoveredPoint][k] ?? 0).toFixed(4)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.clusterLegend}>
                {Array.from({ length: nClusters }, (_, i) => (
                  <div key={i} className={styles.legendItem}>
                    <div
                      className={styles.legendDot}
                      style={{
                        background: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
                      }}
                    />
                    Cluster {i + 1}
                  </div>
                ))}
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
                      {labelCol && <th>{labelCol}</th>}
                      <th>Cluster</th>
                      {pcaKeys.map((k) => (
                        <th key={k}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.pca_data
                      .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
                      .map((row, relativeIndex) => {
                        const absoluteIndex =
                          page * rowsPerPage + relativeIndex;
                        return (
                          <tr
                            key={absoluteIndex}
                            className={
                              hoveredPoint === absoluteIndex
                                ? styles.rowHighlight
                                : ""
                            }
                            onMouseEnter={() => setHoveredPoint(absoluteIndex)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          >
                            <td>{absoluteIndex + 1}</td>
                            {labelCol && result.original_data && (
                              <td>
                                {result.original_data[absoluteIndex][labelCol]}
                              </td>
                            )}
                            <td>
                              <span
                                className={styles.clusterBadge}
                                style={{
                                  background:
                                    CLUSTER_COLORS[
                                      result.clusters[absoluteIndex] %
                                        CLUSTER_COLORS.length
                                    ],
                                }}
                              >
                                {result.clusters[absoluteIndex] + 1}
                              </span>
                            </td>
                            {pcaKeys.map((k) => (
                              <td key={k}>{(row[k] ?? 0).toFixed(4)}</td>
                            ))}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px",
                    background: "#f8f9fa",
                    borderTop: "1px solid #e9ecef",
                  }}
                >
                  <button
                    className={styles.pill}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    style={{ opacity: page === 0 ? 0.5 : 1 }}
                  >
                    Previous
                  </button>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#495057",
                      fontWeight: 500,
                    }}
                  >
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    className={styles.pill}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                    style={{ opacity: page >= totalPages - 1 ? 0.5 : 1 }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
