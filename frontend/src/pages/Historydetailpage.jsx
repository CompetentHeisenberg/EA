import React, { useState, useEffect, useRef } from "react";
import { fetchHistoryResult } from "../services/api";
import styles from "../css/history.module.css";

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

function corrToColor(v) {
  const val = Math.max(-1, Math.min(1, v));
  if (val >= 0)
    return `rgb(${Math.round(220 + (255 - 220) * val)},${Math.round(220 - 220 * val)},${Math.round(220 - 220 * val)})`;
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

function CorrelationDetail({ result }) {
  const [hovered, setHovered] = useState(null);
  const info = hovered
    ? {
        ti: result.tickers[hovered.i],
        tj: result.tickers[hovered.j],
        corr: result.correlation_matrix[hovered.i][hovered.j],
        pval: result.pvalue_matrix[hovered.i][hovered.j],
      }
    : null;

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
              for (let i = 0; i < result.tickers.length; i++)
                for (let j = i + 1; j < result.tickers.length; j++)
                  if (Math.abs(result.correlation_matrix[i][j]) > 0.7) c++;
              return c;
            })()}
          </span>
          <span className={styles.kpiLabel}>
            strong correlations (|r|&gt;0.7)
          </span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionNum}>A</span>
          <h2 className={styles.sectionTitle}>Correlation Matrix</h2>
        </div>
        <div className={styles.heatmapWrapper}>
          <div
            className={styles.heatmap}
            style={{
              gridTemplateColumns: `max-content repeat(${result.tickers.length}, 1fr)`,
            }}
          >
            <div />
            {result.tickers.map((t) => (
              <div key={t} className={styles.headerCell}>
                {t}
              </div>
            ))}
            {result.tickers.map((rowT, i) => (
              <React.Fragment key={rowT}>
                <div className={styles.rowLabel}>{rowT}</div>
                {result.tickers.map((_, j) => {
                  const val = result.correlation_matrix[i][j];
                  const pval = result.pvalue_matrix[i][j];
                  const isActive = hovered?.i === i && hovered?.j === j;
                  return (
                    <div
                      key={j}
                      className={`${styles.cell} ${isActive ? styles.cellActive : ""}`}
                      style={{
                        backgroundColor: corrToColor(val),
                        color: textColor(val),
                      }}
                      onMouseEnter={() => setHovered({ i, j })}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <span className={styles.cellValue}>{val.toFixed(2)}</span>
                      <span className={styles.cellSig}>{sigLabel(pval)}</span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className={styles.infoBar}>
          {info && info.ti !== info.tj ? (
            <span>
              <strong>{info.ti}</strong> ↔ <strong>{info.tj}</strong>: r ={" "}
              <strong>{info.corr.toFixed(4)}</strong> · p ={" "}
              {info.pval.toFixed(4)} {sigLabel(info.pval)}
            </span>
          ) : (
            <span>
              Hover over a cell · *** p&lt;0.01 ** p&lt;0.05 * p&lt;0.1
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
        </div>
        <div className={styles.statsGrid}>
          {Object.entries(result.descriptive_stats).map(([col, s]) => (
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
  );
}

function PCADetail({ result }) {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [axisX, setAxisX] = useState("PC1");
  const [axisY, setAxisY] = useState("PC2");
  const pcaKeys = result?.pca_data?.length
    ? Object.keys(result.pca_data[0])
    : [];
  const nClusters = Math.max(...result.clusters) + 1;

  useEffect(() => {
    if (!result || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width,
      H = canvas.height,
      PAD = 54;
    const xs = result.pca_data.map((p) => p[axisX] ?? 0);
    const ys = result.pca_data.map((p) => p[axisY] ?? 0);
    const xMin = Math.min(...xs),
      xMax = Math.max(...xs);
    const yMin = Math.min(...ys),
      yMax = Math.max(...ys);
    const toX = (v) => PAD + ((v - xMin) / (xMax - xMin || 1)) * (W - PAD * 2);
    const toY = (v) =>
      H - PAD - ((v - yMin) / (yMax - yMin || 1)) * (H - PAD * 2);

    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = PAD + (i / 5) * (W - PAD * 2),
        y = PAD + (i / 5) * (H - PAD * 2);
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
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText(axisX, W / 2, H - 10);
    ctx.save();
    ctx.translate(14, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(axisY, 0, 0);
    ctx.restore();

    result.pca_data.forEach((point, idx) => {
      const cx = toX(point[axisX] ?? 0),
        cy = toY(point[axisY] ?? 0);
      const color =
        CLUSTER_COLORS[result.clusters[idx] % CLUSTER_COLORS.length];
      const isH = hovered === idx;
      ctx.beginPath();
      ctx.arc(cx, cy, isH ? 9 : 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = isH ? 1 : 0.75;
      ctx.fill();
      if (isH) {
        ctx.strokeStyle = "#121212";
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
  }, [result, axisX, axisY, hovered]);

  const handleMouseMove = (e) => {
    if (!result || !canvasRef.current) return;
    const canvas = canvasRef.current,
      rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const PAD = 54,
      W = canvas.width,
      H = canvas.height;
    const xs = result.pca_data.map((p) => p[axisX] ?? 0),
      ys = result.pca_data.map((p) => p[axisY] ?? 0);
    const xMin = Math.min(...xs),
      xMax = Math.max(...xs),
      yMin = Math.min(...ys),
      yMax = Math.max(...ys);
    const toX = (v) => PAD + ((v - xMin) / (xMax - xMin || 1)) * (W - PAD * 2);
    const toY = (v) =>
      H - PAD - ((v - yMin) / (yMax - yMin || 1)) * (H - PAD * 2);
    let closest = null,
      minD = 16;
    result.pca_data.forEach((p, i) => {
      const d = Math.sqrt(
        (mx - toX(p[axisX] ?? 0)) ** 2 + (my - toY(p[axisY] ?? 0)) ** 2,
      );
      if (d < minD) {
        minD = d;
        closest = i;
      }
    });
    setHovered(closest);
  };

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
            <span className={styles.axisLabel}>X:</span>
            <select
              className={styles.axisSelect}
              value={axisX}
              onChange={(e) => setAxisX(e.target.value)}
            >
              {pcaKeys.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
            <span className={styles.axisLabel}>Y:</span>
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
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHovered(null)}
          />
          {hovered !== null && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipTitle}>#{hovered + 1}</div>
              <div className={styles.tooltipRow}>
                <span>Cluster</span>
                <span
                  style={{
                    color:
                      CLUSTER_COLORS[
                        result.clusters[hovered] % CLUSTER_COLORS.length
                      ],
                    fontWeight: 700,
                  }}
                >
                  {result.clusters[hovered] + 1}
                </span>
              </div>
              {pcaKeys.map((k) => (
                <div key={k} className={styles.tooltipRow}>
                  <span>{k}</span>
                  <span>{(result.pca_data[hovered][k] ?? 0).toFixed(4)}</span>
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

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionNum}>C</span>
          <h2 className={styles.sectionTitle}>Results Table</h2>
          <span className={styles.sectionHint}>
            {result.pca_data.length} observations
          </span>
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
              {result.pca_data.slice(0, 100).map((row, i) => (
                <tr
                  key={i}
                  className={hovered === i ? styles.rowHighlight : ""}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
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
        {result.pca_data.length > 100 && (
          <p className={styles.tableNote}>
            Showing first 100 of {result.pca_data.length} rows
          </p>
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
          <a href="/profile" className={styles.backBtn}>
            ← Back to profile
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
