import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { quadtree } from "d3-quadtree";
import { fetchHistoryResult } from "../services/api";
import styles from "../css/history.module.css";
import corrStyles from "../css/correlation.module.css";

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

const ANALYSIS_LABELS = {
  correlation: "Correlation Analysis",
  pca: "PCA and Clustering",
};

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PAD = 60;

function corrToColor(v) {
  if (v === null || v === undefined) return "#e5e5e5";
  const val = Math.max(-1, Math.min(1, v));
  if (val >= 0) {
    return `rgb(${Math.round(220 + (255 - 220) * val)},${Math.round(220 - 220 * val)},${Math.round(220 - 220 * val)})`;
  }
  const a = Math.abs(val);
  return `rgb(${Math.round(220 - 220 * a)},${Math.round(220 - 220 * a)},${Math.round(220 + (255 - 220) * a)})`;
}

function textColor(v) {
  return Math.abs(v) > 0.6 ? "#fff" : "#222";
}

function sigLabel(p) {
  if (p < 0.01) return "***";
  if (p < 0.05) return "**";
  if (p < 0.1) return "*";
  return "";
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
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(
    val,
  );
}

function CorrelationDetail({ result }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [lockedVariable, setLockedVariable] = useState(null);
  const heatmapRef = useRef(null);

  const hoveredInfo = hoveredCell
    ? {
        ti: result.tickers[hoveredCell.i],
        tj: result.tickers[hoveredCell.j],
        corr: result.correlation_matrix[hoveredCell.i][hoveredCell.j],
        pval: result.pvalue_matrix[hoveredCell.i][hoveredCell.j],
      }
    : null;

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

  const isCompactMatrix = result.tickers.length > 12;

  return (
    <>
      <div className={styles.statsRow}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiVal}>{result.tickers.length}</span>
          <span className={styles.kpiLabel}>variables</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiVal}>{result.observations}</span>
          <span className={styles.kpiLabel}>observations</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiVal}>
            {(() => {
              let c = 0;
              for (let i = 0; i < result.tickers.length; i++) {
                for (let j = i + 1; j < result.tickers.length; j++) {
                  if (Math.abs(result.correlation_matrix[i][j]) > 0.7) c++;
                }
              }
              return c;
            })()}
          </span>
          <span className={styles.kpiLabel}>
            strong correlations (|r|&gt;0.7)
          </span>
        </div>
      </div>

      <div className={styles.section} ref={heatmapRef}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionNum}>A</span>
          <h2 className={styles.sectionTitle}>Correlation Matrix</h2>
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

        <div className={corrStyles.scrollableMatrixContainer}>
          <div
            className={corrStyles.heatmapGrid}
            style={{
              gridTemplateColumns: `max-content repeat(${result.tickers.length}, minmax(${isCompactMatrix ? "35px" : "90px"}, 1fr))`,
            }}
          >
            <div className={corrStyles.stickyCorner} />

            {result.tickers.map((t) => (
              <div
                key={t}
                className={`${corrStyles.stickyHeaderTop} ${isCompactMatrix ? corrStyles.verticalText : ""} ${lockedVariable === t ? corrStyles.headerLocked : ""}`}
                title={t}
              >
                {t}
              </div>
            ))}

            {result.tickers.map((rowTicker, i) => (
              <React.Fragment key={rowTicker}>
                <div
                  className={`${corrStyles.stickyHeaderLeft} ${lockedVariable === rowTicker ? corrStyles.headerLocked : ""}`}
                  title={rowTicker}
                >
                  {rowTicker}
                </div>

                {result.tickers.map((_, j) => {
                  const val = result.correlation_matrix[i][j];
                  const pval = result.pvalue_matrix[i][j];

                  const isLocked =
                    lockedVariable &&
                    (result.tickers[i] === lockedVariable ||
                      result.tickers[j] === lockedVariable);
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
                      className={`${corrStyles.matrixCell} ${isHovered ? corrStyles.matrixCellHovered : ""} ${isActive ? corrStyles.matrixCellActive : ""} ${isLocked ? corrStyles.matrixCellLocked : ""} ${isDimmed ? corrStyles.matrixCellDimmed : ""}`}
                      style={{
                        backgroundColor: corrToColor(val),
                        color: textColor(val),
                      }}
                      onMouseEnter={() => setHoveredCell({ i, j })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {!isCompactMatrix && (
                        <span className={corrStyles.cellValueText}>
                          {val.toFixed(2)}
                        </span>
                      )}
                      {!isCompactMatrix && sigLabel(pval) && (
                        <span className={corrStyles.cellSigText}>
                          {sigLabel(pval)}
                        </span>
                      )}
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
              {sigLabel(hoveredInfo.pval)}
            </span>
          ) : (
            <span>
              Hover over cell for details &nbsp;·&nbsp; *** p&lt;0.01 &nbsp;**
              p&lt;0.05 &nbsp;* p&lt;0.1
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
          <span className={styles.sectionNum}>B</span>
          <h2 className={styles.sectionTitle}>Descriptive Statistics</h2>
          <span className={styles.sectionHint}>
            Click a row to highlight in matrix
          </span>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
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
              {Object.entries(result.descriptive_stats).map(([col, s]) => (
                <tr
                  key={col}
                  className={`${styles.tableRowClickable} ${lockedVariable === col ? styles.rowHighlight : ""}`}
                  onClick={() => handleStatRowClick(col)}
                >
                  <td>
                    <div
                      className={
                        lockedVariable === col ? styles.varNameLocked : ""
                      }
                    >
                      {col}
                    </div>
                  </td>
                  <td>{formatStatValue(s.mean)}</td>
                  <td>{formatStatValue(s.std)}</td>
                  <td>{formatStatValue(s.median)}</td>
                  <td>
                    {s.shapiro_pvalue !== undefined
                      ? formatStatValue(s.shapiro_pvalue)
                      : "N/A"}
                  </td>
                  <td>{formatStatValue(s.min)}</td>
                  <td>{formatStatValue(s.max)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function PCADetail({ result }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const hoverThrottle = useRef(false);
  const hasDragged = useRef(false);

  const [axisX, setAxisX] = useState("PC1");
  const [axisY, setAxisY] = useState("PC2");
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [lockedPoint, setLockedPoint] = useState(null);
  const [zoom, setZoom] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const [page, setPage] = useState(0);
  const rowsPerPage = 50;

  const pcaKeys = result?.pca_data?.length
    ? Object.keys(result.pca_data[0])
    : [];
  const nClusters = Math.max(...result.clusters) + 1;

  const handleAxisXChange = (e) => {
    setAxisX(e.target.value);
    setZoom({ scale: 1, offsetX: 0, offsetY: 0 });
    setHoveredPoint(null);
    setLockedPoint(null);
  };

  const handleAxisYChange = (e) => {
    setAxisY(e.target.value);
    setZoom({ scale: 1, offsetX: 0, offsetY: 0 });
    setHoveredPoint(null);
    setLockedPoint(null);
  };

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
    const xMin = Math.min(...xs),
      xMax = Math.max(...xs);
    const yMin = Math.min(...ys),
      yMax = Math.max(...ys);

    const xMargin = (xMax - xMin) * 0.05 || 1;
    const yMargin = (yMax - yMin) * 0.05 || 1;
    const finalXMin = xMin - xMargin,
      finalYMin = yMin - yMargin;
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
    const cursorX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const cursorY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    setIsDragging(true);
    hasDragged.current = false;
    dragStart.current = {
      x: cursorX - zoom.offsetX,
      y: cursorY - zoom.offsetY,
    };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (!hasDragged.current && hoveredPoint !== null)
      setLockedPoint(hoveredPoint);
  };

  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cursorX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const cursorY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);

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
    requestAnimationFrame(() => (hoverThrottle.current = false));

    const mx = (cursorX - zoom.offsetX) / zoom.scale;
    const my = (cursorY - zoom.offsetY) / zoom.scale;
    const closest = tree.find(mx, my, 20 / zoom.scale);
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
      return {
        scale: newScale,
        offsetX: mouseX - mouseXData * newScale,
        offsetY: mouseY - mouseYData * newScale,
      };
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e) => handleWheel(e);
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, [handleWheel]);

  const handleRowClick = (absoluteIndex) => {
    setLockedPoint(absoluteIndex);
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const totalPages = result
    ? Math.ceil(result.pca_data.length / rowsPerPage)
    : 0;

  return (
    <>
      <div className={styles.statsRow}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiVal}>{result.pca_data.length}</span>
          <span className={styles.kpiLabel}>observations</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiVal}>{nClusters}</span>
          <span className={styles.kpiLabel}>clusters</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiVal}>
            {(result.variance.reduce((a, b) => a + b, 0) * 100).toFixed(1)}%
          </span>
          <span className={styles.kpiLabel}>total variance</span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionNum}>A</span>
          <h2 className={styles.sectionTitle}>Explained Variance</h2>
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
              <div className={styles.variancePct}>{(v * 100).toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionNum}>B</span>
          <h2 className={styles.sectionTitle}>Scatter Plot</h2>
          <div className={styles.axisSelectors}>
            <select
              className={styles.axisSelect}
              value={axisX}
              onChange={handleAxisXChange}
            >
              {pcaKeys.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
            <select
              className={styles.axisSelect}
              value={axisY}
              onChange={handleAxisYChange}
            >
              {pcaKeys.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
            {(zoom.scale !== 1 || zoom.offsetX !== 0 || zoom.offsetY !== 0) && (
              <button
                className={styles.pill}
                onClick={() => setZoom({ scale: 1, offsetX: 0, offsetY: 0 })}
              >
                Reset View
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
              className={`${styles.tooltip} ${lockedPoint !== null ? styles.tooltipLocked : ""}`}
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
                  className={styles.tooltipCloseBtn}
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
                {result.session?.label_column && result.original_data ? (
                  <>
                    <span
                      style={{
                        fontWeight: 400,
                        color: "#aaa",
                        fontSize: "12px",
                        marginRight: "6px",
                      }}
                    >
                      {result.session.label_column}:
                    </span>
                    {result.original_data[activePointId][
                      result.session.label_column
                    ] || "N/A"}
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
                        result.clusters[activePointId] % CLUSTER_COLORS.length
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
                {(
                  result.session?.columns ||
                  (result.original_data
                    ? Object.keys(result.original_data[activePointId]).filter(
                        (k) => k !== result.session?.label_column,
                      )
                    : [])
                ).map((col) => (
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
              <span>
                Cluster {i + 1} ({result.clusters.filter((c) => c === i).length}{" "}
                obs.)
              </span>
            </div>
          ))}
        </div>
      </div>

      {result.cluster_metrics && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>★</span>
            <h2 className={styles.sectionTitle}>Cluster Quality Metrics</h2>
          </div>
          <div className={styles.metricsContainer}>
            <div className={styles.metricBlock}>
              <div className={styles.metricLabel}>Silhouette Score</div>
              <div className={styles.metricValue}>
                {result.cluster_metrics.silhouette_score}
              </div>
              <div className={styles.metricHint}>
                Closer to 1 is better (denser clusters)
              </div>
            </div>
            <div className={styles.metricBlock}>
              <div className={styles.metricLabel}>Davies-Bouldin Index</div>
              <div className={styles.metricValue}>
                {result.cluster_metrics.davies_bouldin_score}
              </div>
              <div className={styles.metricHint}>
                Lower is better (better separation)
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionNum}>C</span>
          <h2 className={styles.sectionTitle}>Results Table</h2>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                {result.session?.label_column && (
                  <th>{result.session.label_column}</th>
                )}
                <th>Cluster</th>
                {pcaKeys.map((k) => {
                  const topFeat = getTopFeature(k);
                  return (
                    <th key={k}>
                      {k}
                      {topFeat && (
                        <span className={styles.thSubtext}>({topFeat})</span>
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
                  const absoluteIndex = page * rowsPerPage + relativeIndex;
                  return (
                    <tr
                      key={absoluteIndex}
                      className={`${styles.tableRowClickable} ${activePointId === absoluteIndex ? styles.rowHighlight : ""}`}
                      onMouseEnter={() => {
                        if (lockedPoint === null)
                          setHoveredPoint(absoluteIndex);
                      }}
                      onMouseLeave={() => {
                        if (lockedPoint === null) setHoveredPoint(null);
                      }}
                      onClick={() => handleRowClick(absoluteIndex)}
                    >
                      <td>{absoluteIndex + 1}</td>
                      {result.session?.label_column && result.original_data && (
                        <td>
                          {result.original_data[absoluteIndex][
                            result.session.label_column
                          ] || "N/A"}
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
          <div className={styles.paginationContainer}>
            <button
              className={styles.paginationBtn}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </button>
            <span className={styles.paginationText}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              className={styles.paginationBtn}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function HistoryDetailPage() {
  const sessionId = window.location.pathname.split("/").pop();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistoryResult(sessionId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <div>
            <h1 className={styles.pageTitle}>
              {data
                ? ANALYSIS_LABELS[data.session.analysis_type] || "Analysis"
                : "Detailed View"}
            </h1>
            <p className={styles.pageDesc}>
              {data
                ? `${data.session.file_name} · ${new Date(data.session.created_at).toLocaleString("en-GB")}`
                : "Loading..."}
            </p>
          </div>
          <a href="/history" className={styles.backBtn}>
            ← Back to history
          </a>
        </div>
      </div>

      <div className={styles.pageBody}>
        {loading && (
          <div className={styles.loadingCenter}>
            <div className={styles.spinnerLg} />
            <span>Loading results...</span>
          </div>
        )}
        {error && <div className={styles.errorBanner}>{error}</div>}
        {data && (
          <>
            {data.session.analysis_type === "correlation" && (
              <CorrelationDetail result={data.result} />
            )}
            {data.session.analysis_type === "pca" && (
              <PCADetail result={data.result} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
