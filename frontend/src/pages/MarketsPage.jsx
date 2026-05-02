import React, { useState, useEffect, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import styles from "../css/markets.module.css";
import { fetchMarkets } from "../services/api";

const SECTORS = [
  "All",
  "Tech",
  "Finance",
  "Energy",
  "Healthcare",
  "Consumer",
  "Crypto",
  "Other",
];

const generateSparkData = (baseChange, points = 30) => {
  const data = [];
  let val = 100;
  for (let i = 0; i < points; i++) {
    const drift = baseChange / points;
    val += drift + (Math.random() - 0.5) * 1.2;
    data.push(parseFloat(val.toFixed(2)));
  }
  return data;
};

const buildPath = (values, w, h) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
};

const MiniSparkline = ({ change, width = 80, height = 32 }) => {
  const data = useMemo(() => generateSparkData(change), [change]);
  const points = buildPath(data, width, height);
  const positive = change >= 0;
  const color = positive ? "#00e676" : "#ff1744";
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={styles.sparkline}
    >
      <defs>
        <linearGradient id={`grad-${change}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const DetailChart = ({ stock }) => {
  const canvasRef = useRef(null);

  const data = useMemo(
    () => generateSparkData(stock.change, 60),
    [stock.change],
  );
  const positive = stock.change >= 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const color = positive ? "#00e676" : "#ff1744";

    const toX = (i) => (i / (data.length - 1)) * (w - 40) + 20;
    const toY = (v) => h - 30 - ((v - min) / range) * (h - 60);

    ctx.beginPath();
    ctx.moveTo(toX(0), toY(data[0]));
    data.forEach((v, i) => ctx.lineTo(toX(i), toY(v)));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + "44");
    grad.addColorStop(1, color + "00");
    ctx.lineTo(toX(data.length - 1), h - 30);
    ctx.lineTo(toX(0), h - 30);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.5;
    [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
      const y = h - 30 - t * (h - 60);
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
      const val = (min + t * range).toFixed(1);
      ctx.fillStyle = "#666";
      ctx.font = "10px monospace";
      ctx.fillText(val, 2, y + 3);
    });

    const labels = ["1M", "1W ago", "3D ago", "1D ago", "Now"];
    labels.forEach((label, idx) => {
      const x = toX(
        Math.floor((idx / (labels.length - 1)) * (data.length - 1)),
      );
      ctx.fillStyle = "#555";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, x, h - 10);
    });
  }, [stock, data, positive]);

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={200}
      className={styles.detailChart}
    />
  );
};

const exportCSV = (data) => {
  const headers = [
    "Symbol",
    "Name",
    "Sector",
    "Price",
    "Change%",
    "Volume",
    "MarketCap",
    "PE_Ratio",
    "Beta",
    "52W_High",
    "52W_Low",
    "DividendYield%",
  ];
  const rows = data.map((s) => [
    s.symbol,
    s.name,
    s.sector,
    s.price,
    s.change,
    s.volume,
    s.mktCap,
    s.pe ?? "N/A",
    s.beta,
    s.week52High,
    s.week52Low,
    s.dividendYield,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `markets_data_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const exportExcel = (data) => {
  const formattedData = data.map((s) => ({
    Symbol: s.symbol,
    Name: s.name,
    Sector: s.sector,
    Price: s.price,
    "Change %": s.change,
    Volume: s.volume,
    "Market Cap": s.mktCap,
    "P/E Ratio": s.pe ?? "N/A",
    Beta: s.beta,
    "52W High": s.week52High,
    "52W Low": s.week52Low,
    "Dividend Yield %": s.dividendYield,
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Markets Data");

  XLSX.writeFile(
    workbook,
    `markets_data_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
};

const StockModal = ({ stock, onClose }) => {
  if (!stock) return null;
  const positive = stock.change >= 0;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>
          ✕
        </button>
        <div className={styles.modalHeader}>
          <div>
            <span className={styles.modalSymbol}>{stock.symbol}</span>
            <span className={styles.modalName}>{stock.name}</span>
            <span className={styles.sectorBadge}>{stock.sector}</span>
          </div>
          <div className={styles.modalPrice}>
            <span className={styles.modalPriceVal}>
              {stock.sector === "Crypto"
                ? "$" +
                  stock.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })
                : "$" + stock.price.toFixed(2)}
            </span>
            <span className={positive ? styles.posChange : styles.negChange}>
              {positive ? "▲" : "▼"} {Math.abs(stock.change).toFixed(2)}%
            </span>
          </div>
        </div>
        <DetailChart stock={stock} />
        <div className={styles.modalMetrics}>
          {[
            ["Market Cap", stock.mktCap],
            ["Volume", stock.volume],
            ["P/E Ratio", stock.pe ?? "N/A"],
            ["Beta", stock.beta],
            ["52W High", "$" + stock.week52High.toLocaleString()],
            ["52W Low", "$" + stock.week52Low.toLocaleString()],
            ["Div. Yield", stock.dividendYield + "%"],
          ].map(([label, val]) => (
            <div key={label} className={styles.metricCard}>
              <div className={styles.metricLabel}>{label}</div>
              <div className={styles.metricVal}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MarketsPage = () => {
  const [stocks, setStocks] = useState([]);
  const [indices, setIndices] = useState([]);
  const [sector, setSector] = useState("All");
  const [sortKey, setSortKey] = useState("symbol");
  const [sortDir, setSortDir] = useState("asc");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("table");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const data = await fetchMarkets();
        if (isMounted) {
          setStocks(data.stocks);
          setIndices(data.indices);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setLoading(false);
        }
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const filtered = stocks
    .filter((s) => {
      const matchSector = sector === "All" || s.sector === sector;
      const matchSearch =
        s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase());
      return matchSector && matchSearch;
    })
    .sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === "string" ? va.localeCompare(vb) : va - vb;
      return sortDir === "asc" ? cmp : -cmp;
    });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className={styles.sortIcon}>⇅</span>;
    return (
      <span className={styles.sortActive}>{sortDir === "asc" ? "↑" : "↓"}</span>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: "1rem",
        }}
      >
        <div className={styles.loaderSpinner}></div>
        <div style={{ color: "#000", fontSize: "1.2rem", fontWeight: "bold" }}>
          Loading real-time market data...
        </div>
      </div>
    );
  }

  return (
    <main className={styles.marketsPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Markets</h1>
          <p className={styles.pageSubtitle}>
            Live financial data ·{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className={styles.exportGroup}>
          <button
            className={styles.exportBtn}
            onClick={() => exportCSV(filtered)}
          >
            ↓ CSV
          </button>
          <button
            className={styles.exportBtn}
            onClick={() => exportExcel(filtered)}
          >
            ↓ Excel
          </button>
        </div>
      </div>

      <div className={styles.indicesBar}>
        {indices.map((idx) => {
          const isPositive = idx.change >= 0;
          return (
            <div key={idx.name} className={styles.indexCard}>
              <div className={styles.indexName}>{idx.name}</div>
              <div className={styles.indexVal}>
                {idx.name === "10Y Treasury"
                  ? idx.value + "%"
                  : idx.value.toLocaleString()}
              </div>
              <div className={isPositive ? styles.posChange : styles.negChange}>
                {isPositive ? "+" : ""}
                {idx.change.toFixed(2)}
                {idx.name === "10Y Treasury" ? "" : "%"}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.controls}>
        <div className={styles.sectorTabs}>
          {SECTORS.map((s) => (
            <button
              key={s}
              className={
                s === sector ? styles.sectorTabActive : styles.sectorTab
              }
              onClick={() => setSector(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className={styles.rightControls}>
          <input
            className={styles.searchInput}
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className={styles.viewToggle}>
            <button
              className={
                view === "table" ? styles.viewBtnActive : styles.viewBtn
              }
              onClick={() => setView("table")}
            >
              Table
            </button>
            <button
              className={
                view === "cards" ? styles.viewBtnActive : styles.viewBtn
              }
              onClick={() => setView("cards")}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {view === "table" ? (
        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                {[
                  ["symbol", "Symbol"],
                  ["name", "Name"],
                  ["sector", "Sector"],
                  ["price", "Price"],
                  ["change", "Change %"],
                  ["volume", "Volume"],
                  ["mktCap", "Mkt Cap"],
                  ["pe", "P/E"],
                  ["beta", "Beta"],
                  ["week52High", "52W High"],
                  ["week52Low", "52W Low"],
                  ["dividendYield", "Div. Yield"],
                ].map(([key, label]) => (
                  <th
                    key={key}
                    className={styles.th}
                    onClick={() => handleSort(key)}
                  >
                    {label} <SortIcon col={key} />
                  </th>
                ))}
                <th className={styles.th}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.symbol}
                  className={styles.tr}
                  onClick={() => setSelected(s)}
                >
                  <td className={styles.symbolCell}>{s.symbol}</td>
                  <td className={styles.td}>{s.name}</td>
                  <td className={styles.td}>
                    <span className={styles.sectorBadge}>{s.sector}</span>
                  </td>
                  <td
                    className={styles.td}
                    style={{ fontWeight: 600, fontFamily: "monospace" }}
                  >
                    {s.sector === "Crypto"
                      ? "$" +
                        s.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })
                      : "$" + s.price.toFixed(2)}
                  </td>
                  <td
                    className={
                      s.change >= 0 ? styles.posChange : styles.negChange
                    }
                  >
                    {s.change >= 0 ? "▲" : "▼"} {Math.abs(s.change).toFixed(2)}%
                  </td>
                  <td className={styles.td}>{s.volume}</td>
                  <td className={styles.td}>{s.mktCap}</td>
                  <td className={styles.td}>{s.pe ?? "N/A"}</td>
                  <td className={styles.td}>{s.beta}</td>
                  <td className={styles.td}>{s.week52High.toLocaleString()}</td>
                  <td className={styles.td}>{s.week52Low.toLocaleString()}</td>
                  <td
                    className={
                      s.dividendYield > 0 ? styles.posChange : styles.td
                    }
                  >
                    {s.dividendYield}%
                  </td>
                  <td className={styles.td}>
                    <MiniSparkline change={s.change} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {filtered.map((s) => {
            const positive = s.change >= 0;
            return (
              <div
                key={s.symbol}
                className={styles.stockCard}
                onClick={() => setSelected(s)}
              >
                <div className={styles.cardTop}>
                  <div>
                    <div className={styles.cardSymbol}>{s.symbol}</div>
                    <div className={styles.cardName}>{s.name}</div>
                  </div>
                  <span className={styles.sectorBadge}>{s.sector}</span>
                </div>
                <MiniSparkline change={s.change} width={180} height={48} />
                <div className={styles.cardBottom}>
                  <span className={styles.cardPrice}>
                    {s.sector === "Crypto"
                      ? "$" +
                        s.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })
                      : "$" + s.price.toFixed(2)}
                  </span>
                  <span
                    className={positive ? styles.posChange : styles.negChange}
                  >
                    {positive ? "▲" : "▼"} {Math.abs(s.change).toFixed(2)}%
                  </span>
                </div>
                <div className={styles.cardMeta}>
                  <span>Vol: {s.volume}</span>
                  <span>Cap: {s.mktCap}</span>
                  <span>β: {s.beta}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <StockModal stock={selected} onClose={() => setSelected(null)} />
    </main>
  );
};

export default MarketsPage;
