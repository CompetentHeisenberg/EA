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

export default function PCAView({
  fileId,
  columns,
  numericCols,
  userSettings,
}) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const hoverThrottle = useRef(false);
  const hasDragged = useRef(false);

  const defaultAxes = (userSettings?.preferred_pca_axes || "PC1,PC2").split(
    ",",
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [labelCol, setLabelCol] = useState("");
  const [selectedCols, setSelectedCols] = useState([]);
  const [nClusters, setNClusters] = useState(
    userSettings?.default_clusters || 3,
  );
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [lockedPoint, setLockedPoint] = useState(null);
  const [axisX, setAxisX] = useState(defaultAxes[0] || "PC1");
  const [axisY, setAxisY] = useState(defaultAxes[1] || "PC2");

  const [zoom, setZoom] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const [page, setPage] = useState(0);
  const rowsPerPage = 50;

  useEffect(() => {
    if (numericCols && numericCols.length > 0) {
      setSelectedCols(numericCols.slice(0, 8));
      const textCols = columns.filter((col) => !numericCols.includes(col));
      if (textCols.length > 0) setLabelCol(textCols[0]);
    }
  }, [columns, numericCols]);

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
    setLockedPoint(null);
    setHoveredPoint(null);

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
      setAxisX(defaultAxes[0] || "PC1");
      setAxisY(defaultAxes[1] || "PC2");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCols, fileId, labelCol, nClusters, defaultAxes]);

  useEffect(() => {
    setZoom({ scale: 1, offsetX: 0, offsetY: 0 });
    setHoveredPoint(null);
    setLockedPoint(null);
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

  const activePointId = lockedPoint !== null ? lockedPoint : hoveredPoint;

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
      if (activePointId === originalIndex) return;
      ctx.beginPath();
      ctx.arc(cx, cy, 5 / scale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    if (activePointId !== null) {
      const activePoint = chartData[activePointId];
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
  }, [chartData, activePointId, axisX, axisY, zoom, getTopFeature]);

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const cursorX = (e.clientX - rect.left) * scaleX;
    const cursorY = (e.clientY - rect.top) * scaleY;

    setIsDragging(true);
    hasDragged.current = false;
    dragStart.current = {
      x: cursorX - zoom.offsetX,
      y: cursorY - zoom.offsetY,
    };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (!hasDragged.current && hoveredPoint !== null) {
      setLockedPoint(hoveredPoint);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const cursorX = (e.clientX - rect.left) * scaleX;
    const cursorY = (e.clientY - rect.top) * scaleY;

    if (isDragging) {
      hasDragged.current = true;
      setZoom((prev) => ({
        ...prev,
        offsetX: cursorX - dragStart.current.x,
        offsetY: cursorY - dragStart.current.y,
      }));
      return;
    }

    if (lockedPoint !== null) return;

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

  const handleRowClick = (absoluteIndex) => {
    setLockedPoint(absoluteIndex);
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const filteredCols = useMemo(() => {
    if (!searchTerm) return numericCols;
    return numericCols.filter((c) =>
      c.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [numericCols, searchTerm]);

  const pcaKeys = result ? Object.keys(result.pca_data[0]) : [];
  const totalPages = result
    ? Math.ceil(result.pca_data.length / rowsPerPage)
    : 0;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageBody}>
        {numericCols.length > 0 && (
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
                    <span className={styles.emptySearch}>
                      No variables found.
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.settingsBlock}>
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
                <span className={styles.sectionNum}>02</span>
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
                <span className={styles.sectionNum}>03</span>
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

              <div
                className={styles.chartArea}
                ref={wrapperRef}
                style={{ position: "relative" }}
              >
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className={styles.canvas}
                  style={{
                    touchAction: "none",
                    cursor: isDragging
                      ? "grabbing"
                      : activePointId !== null && lockedPoint === null
                        ? "pointer"
                        : "crosshair",
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => {
                    setIsDragging(false);
                    if (lockedPoint === null) setHoveredPoint(null);
                  }}
                  onMouseMove={handleCanvasMouseMove}
                />

                {activePointId !== null && !isDragging && (
                  <div
                    className={styles.tooltip}
                    style={{
                      minWidth: "260px",
                      pointerEvents: lockedPoint !== null ? "auto" : "none",
                      maxHeight: "350px",
                      overflowY: "auto",
                      paddingTop: lockedPoint !== null ? "24px" : "12px",
                    }}
                  >
                    {lockedPoint !== null && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLockedPoint(null);
                        }}
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          background: "none",
                          border: "none",
                          color: "#fff",
                          fontSize: "18px",
                          cursor: "pointer",
                          lineHeight: "1",
                        }}
                      >
                        ✕
                      </button>
                    )}

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
                          result.original_data[activePointId]
                            ? result.original_data[activePointId][labelCol]
                            : "N/A"}
                        </>
                      ) : (
                        `Observation #${activePointId + 1}`
                      )}
                    </div>

                    <div className={styles.tooltipRow}>
                      <span style={{ color: "#ccc" }}>Cluster</span>
                      <span
                        style={{
                          color:
                            CLUSTER_COLORS[
                              result.clusters[activePointId] %
                                CLUSTER_COLORS.length
                            ],
                          fontWeight: 700,
                          fontSize: "14px",
                        }}
                      >
                        {result.clusters[activePointId] + 1}
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
                            result.original_data[activePointId]
                              ? result.original_data[activePointId][col]
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
                          {(result.pca_data[activePointId][k] ?? 0).toFixed(4)}
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
                    Cluster {i + 1} (
                    {result.clusters.filter((c) => c === i).length} obs.)
                  </div>
                ))}
              </div>
            </div>

            {result.cluster_metrics && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionNum}>★</span>
                  <h2 className={styles.sectionTitle}>
                    Cluster Quality Metrics
                  </h2>
                  <span className={styles.sectionHint}>
                    Model accuracy indicators
                  </span>
                </div>

                <div className={styles.settingsRow}>
                  <div
                    className={styles.settingsBlock}
                    style={{ flex: 1, display: "flex", gap: "30px" }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#868e96",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          marginBottom: "4px",
                        }}
                      >
                        Silhouette Score
                      </div>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "#222",
                        }}
                      >
                        {result.cluster_metrics.silhouette_score}
                      </div>
                      <div style={{ color: "#868e96", fontSize: "12px" }}>
                        Closer to 1 is better (denser clusters)
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          color: "#868e96",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          marginBottom: "4px",
                        }}
                      >
                        Davies-Bouldin Index
                      </div>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "#222",
                        }}
                      >
                        {result.cluster_metrics.davies_bouldin_score}
                      </div>
                      <div style={{ color: "#868e96", fontSize: "12px" }}>
                        Lower is better (better separation)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNum}>04</span>
                <h2 className={styles.sectionTitle}>Results Table</h2>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      {labelCol && <th>{labelCol}</th>}
                      <th>Cluster</th>
                      {pcaKeys.map((k) => {
                        const topFeat = getTopFeature(k);
                        return (
                          <th key={k}>
                            {k}
                            {topFeat && (
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "11px",
                                  color: "#888",
                                  fontWeight: "normal",
                                }}
                              >
                                ({topFeat})
                              </span>
                            )}
                          </th>
                        );
                      })}
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
                              activePointId === absoluteIndex
                                ? styles.rowHighlight
                                : ""
                            }
                            onMouseEnter={() => {
                              if (lockedPoint === null) {
                                setHoveredPoint(absoluteIndex);
                              }
                            }}
                            onMouseLeave={() => {
                              if (lockedPoint === null) {
                                setHoveredPoint(null);
                              }
                            }}
                            onClick={() => handleRowClick(absoluteIndex)}
                            style={{ cursor: "pointer" }}
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
