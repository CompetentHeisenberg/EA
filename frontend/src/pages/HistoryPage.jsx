import React, { useState, useEffect } from "react";
import { fetchHistory, fetchHistoryResult } from "../services/api";
import styles from "../css/profile.module.css";

const ANALYSIS_LABELS = {
  upload: "Upload",
  correlation: "Correlation",
  pca: "PCA / Clustering",
};

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

function CorrelationSummary({ result }) {
  if (!result || !result.tickers) return null;

  const pairs = [];
  for (let i = 0; i < result.tickers.length; i++) {
    for (let j = i + 1; j < result.tickers.length; j++) {
      pairs.push({
        ti: result.tickers[i],
        tj: result.tickers[j],
        r: result.correlation_matrix[i][j],
        p: result.pvalue_matrix[i][j],
      });
    }
  }
  const sorted = [...pairs].sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  const top = sorted.slice(0, 3);

  return (
    <div className={styles.summaryBlock}>
      <div className={styles.summaryRow}>
        <div className={styles.summaryKpi}>
          <span className={styles.kpiVal}>{result.tickers.length}</span>
          <span className={styles.kpiLabel}>variables</span>
        </div>
        <div className={styles.summaryKpi}>
          <span className={styles.kpiVal}>{result.observations}</span>
          <span className={styles.kpiLabel}>observations</span>
        </div>
        <div className={styles.summaryKpi}>
          <span className={styles.kpiVal}>
            {pairs.filter((p) => Math.abs(p.r) > 0.7).length}
          </span>
          <span className={styles.kpiLabel}>strong correlations</span>
        </div>
      </div>
      <div className={styles.summaryLabel}>Top correlations:</div>
      <div className={styles.miniHeatRow}>
        {top.map((p, i) => (
          <div
            key={i}
            className={styles.miniPair}
            style={{ background: corrToColor(p.r), color: textColor(p.r) }}
          >
            <span className={styles.miniPairNames}>
              {p.ti} / {p.tj}
            </span>
            <span className={styles.miniPairVal}>
              {p.r.toFixed(2)}
              {sigLabel(p.p)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PCASummary({ result }) {
  if (!result || !result.clusters) return null;

  const nClusters = Math.max(...result.clusters) + 1;
  const totalVar = (result.variance.reduce((a, b) => a + b, 0) * 100).toFixed(
    1,
  );
  const clusterCounts = Array.from(
    { length: nClusters },
    (_, i) => result.clusters.filter((c) => c === i).length,
  );

  return (
    <div className={styles.summaryBlock}>
      <div className={styles.summaryRow}>
        <div className={styles.summaryKpi}>
          <span className={styles.kpiVal}>{result.pca_data.length}</span>
          <span className={styles.kpiLabel}>observations</span>
        </div>
        <div className={styles.summaryKpi}>
          <span className={styles.kpiVal}>{nClusters}</span>
          <span className={styles.kpiLabel}>clusters</span>
        </div>
        <div className={styles.summaryKpi}>
          <span className={styles.kpiVal}>{totalVar}%</span>
          <span className={styles.kpiLabel}>variance PC1+PC2</span>
        </div>
      </div>
      <div className={styles.summaryLabel}>Component variance:</div>
      <div className={styles.miniVariance}>
        {result.variance.map((v, i) => (
          <div key={i} className={styles.miniVarItem}>
            <span className={styles.miniVarLabel}>PC{i + 1}</span>
            <div className={styles.miniVarTrack}>
              <div
                className={styles.miniVarFill}
                style={{ width: `${v * 100}%` }}
              />
            </div>
            <span className={styles.miniVarPct}>{(v * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
      <div className={styles.summaryLabel}>Cluster distribution:</div>
      <div className={styles.clusterPills}>
        {clusterCounts.map((count, i) => (
          <div
            key={i}
            className={styles.clusterPill}
            style={{ background: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}
          >
            C{i + 1}: {count} obs.
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [results, setResults] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    fetchHistory()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, []);

  const handleToggle = async (item) => {
    if (item.analysis_type === "upload") return;
    if (openId === item.id) {
      setOpenId(null);
      return;
    }
    setOpenId(item.id);
    if (results[item.id]) return;
    setLoadingId(item.id);
    try {
      const data = await fetchHistoryResult(item.id);
      setResults((prev) => ({ ...prev, [item.id]: data }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <div>
            <h1 className={styles.pageTitle}>Analysis History</h1>
            <p className={styles.pageDesc}>
              All your previous calculations in one place
            </p>
          </div>
        </div>
      </div>

      <div className={styles.pageBody}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Saved Records</h2>
            <span className={styles.sectionHint}>{history.length} records</span>
          </div>

          {loadingHistory ? (
            <div className={styles.loadingRow}>
              <div className={styles.spinner} />
              <span>Loading history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className={styles.emptyState}>
              No analyses yet. Go to{" "}
              <a href="/correlation" className={styles.emptyLink}>
                correlation analysis
              </a>{" "}
              or{" "}
              <a href="/pca" className={styles.emptyLink}>
                PCA
              </a>
              .
            </div>
          ) : (
            <div className={styles.historyList}>
              {history.map((item, i) => {
                const canView = item.analysis_type !== "upload";
                const isOpen = openId === item.id;
                const result = results[item.id];
                const isLoading = loadingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`${styles.historyCard} ${isOpen ? styles.historyCardOpen : ""}`}
                  >
                    <div
                      className={styles.historyCardHeader}
                      onClick={() => canView && handleToggle(item)}
                    >
                      <div className={styles.historyCardLeft}>
                        <span className={styles.historyNum}>{i + 1}</span>
                        <span
                          className={styles.typeBadge}
                          data-type={item.analysis_type}
                        >
                          {ANALYSIS_LABELS[item.analysis_type] ||
                            item.analysis_type}
                        </span>
                        <div className={styles.historyMeta}>
                          <span className={styles.historyFile}>
                            {item.file_name}
                          </span>
                          <span className={styles.historyDate}>
                            {item.created_at
                              ? new Date(item.created_at).toLocaleString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : "—"}
                          </span>
                        </div>
                        {item.columns_used?.length > 0 && (
                          <div className={styles.historyColsRow}>
                            {item.columns_used.slice(0, 5).map((c) => (
                              <span key={c} className={styles.colTag}>
                                {c}
                              </span>
                            ))}
                            {item.columns_used.length > 5 && (
                              <span className={styles.colTag}>
                                +{item.columns_used.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {canView && (
                        <div className={styles.historyCardRight}>
                          <button
                            className={`${styles.toggleBtn} ${isOpen ? styles.toggleBtnActive : ""}`}
                          >
                            {isOpen ? "Collapse ▲" : "View ▼"}
                          </button>
                        </div>
                      )}
                    </div>

                    {isOpen && (
                      <div className={styles.historyCardBody}>
                        {isLoading ? (
                          <div className={styles.loadingRow}>
                            <div className={styles.spinner} />
                            <span>Loading results...</span>
                          </div>
                        ) : result ? (
                          <>
                            {item.analysis_type === "correlation" && (
                              <CorrelationSummary result={result.result} />
                            )}
                            {item.analysis_type === "pca" && (
                              <PCASummary result={result.result} />
                            )}
                            <a
                              href={`/history/${item.id}`}
                              className={styles.detailLink}
                            >
                              View details →
                            </a>
                          </>
                        ) : (
                          <div className={styles.emptyState}>
                            Failed to load results.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
