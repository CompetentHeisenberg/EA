import React, { useState, useEffect } from "react";
import styles from "../../css/main.module.css";
import { fetchTrendingData } from "../../services/api";

const buildSparklinePath = (values, width = 60, height = 28) => {
  if (!values || values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return pts.join(" ");
};

const Sparkline = ({ values, positive, width = 60, height = 28 }) => {
  const color = positive ? "#00cc66" : "#D90429";
  const points = buildSparklinePath(values, width, height);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ flexShrink: 0 }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

const TRENDING_TAGS = [
  "#Bitcoin",
  "#Nvidia",
  "#FedRate",
  "#AI_Stocks",
  "#GoldRally",
  "#OilMarket",
];

const AssetRow = ({ asset, positive }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "5px 0",
      borderBottom: "0.5px solid #f0f0f0",
    }}
  >
    <div style={{ minWidth: "38px" }}>
      <div style={{ fontWeight: "700", fontSize: "12px", color: "#1a1a1a" }}>
        {asset.symbol}
      </div>
      <div
        style={{
          fontSize: "10px",
          color: "#999",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "50px",
        }}
      >
        {asset.name}
      </div>
    </div>
    <Sparkline
      values={asset.spark}
      positive={positive}
      width={55}
      height={26}
    />
    <div style={{ textAlign: "right", minWidth: "46px", flexShrink: 0 }}>
      <div
        style={{
          fontWeight: "700",
          fontSize: "11px",
          color: positive ? "#00cc66" : "#D90429",
        }}
      >
        {asset.change}
      </div>
      <div style={{ fontSize: "10px", color: "#888" }}>{asset.price}</div>
    </div>
  </div>
);

const TrendingBar = () => {
  const [activeTab, setActiveTab] = useState("gainers");
  const [time, setTime] = useState(new Date());
  const [marketData, setMarketData] = useState({
    gainers: [],
    losers: [],
    crypto: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const data = await fetchTrendingData();
        setMarketData(data);
      } catch (err) {
        console.error("Failed to load trending data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
    const dataInterval = setInterval(fetchTrending, 300000);
    return () => clearInterval(dataInterval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const tabStyle = (tab) => ({
    flex: 1,
    padding: "5px 0",
    fontSize: "11px",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    borderRadius: "4px",
    transition: "all 0.2s",
    background: activeTab === tab ? "#D90429" : "transparent",
    color: activeTab === tab ? "#fff" : "#555",
  });

  return (
    <aside className={styles.rightSidebar}>
      <div
        style={{
          fontSize: "11px",
          color: "#999",
          textAlign: "right",
          marginBottom: "10px",
        }}
      >
        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
        Live
        <span
          style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#00cc66",
            marginLeft: "5px",
            animation: "pulse 1.5s infinite",
          }}
        />
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      </div>

      <div className={styles.trendingBlock}>
        <div
          style={{
            display: "flex",
            gap: "4px",
            marginBottom: "10px",
            background: "#f0f0f0",
            borderRadius: "6px",
            padding: "3px",
          }}
        >
          <button
            style={tabStyle("gainers")}
            onClick={() => setActiveTab("gainers")}
          >
            Gainers
          </button>
          <button
            style={tabStyle("losers")}
            onClick={() => setActiveTab("losers")}
          >
            Losers
          </button>
        </div>

        {loading ? (
          <div
            style={{
              fontSize: "12px",
              color: "#888",
              textAlign: "center",
              padding: "20px 0",
            }}
          >
            Loading market data...
          </div>
        ) : (
          (activeTab === "gainers"
            ? marketData.gainers
            : marketData.losers
          ).map((a) => (
            <AssetRow
              key={a.symbol}
              asset={a}
              positive={activeTab === "gainers"}
            />
          ))
        )}
      </div>

      <div className={styles.trendingBlock}>
        <h3>Crypto</h3>
        {loading ? (
          <div style={{ fontSize: "12px", color: "#888" }}>Loading...</div>
        ) : (
          marketData.crypto.map((a) => (
            <AssetRow
              key={a.symbol}
              asset={a}
              positive={parseFloat(a.change) >= 0}
            />
          ))
        )}
      </div>

      <div className={styles.trendingBlock}>
        <h3>Trending</h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginTop: "4px",
          }}
        >
          {TRENDING_TAGS.map((tag) => (
            <span
              key={tag}
              style={{
                display: "inline-block",
                background: "#fff0f2",
                color: "#D90429",
                fontSize: "11px",
                fontWeight: "600",
                padding: "3px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#D90429";
                e.target.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#fff0f2";
                e.target.style.color = "#D90429";
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          background: "#f9f9f9",
          borderRadius: "8px",
          padding: "10px 12px",
          fontSize: "11px",
          color: "#555",
        }}
      >
        <div
          style={{ fontWeight: "700", marginBottom: "4px", color: "#1a1a1a" }}
        >
          Market Status
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "3px",
          }}
        >
          <span>NYSE</span>
          <span style={{ color: "#00cc66", fontWeight: "600" }}>● Open</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "3px",
          }}
        >
          <span>NASDAQ</span>
          <span style={{ color: "#00cc66", fontWeight: "600" }}>● Open</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Crypto 24/7</span>
          <span style={{ color: "#00cc66", fontWeight: "600" }}>● Active</span>
        </div>
      </div>
    </aside>
  );
};

export default TrendingBar;
