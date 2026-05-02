import React, { useState, useEffect, useCallback } from "react";
import styles from "../../css/main.module.css";

const CACHE_KEY = "newsfeed_cache";
const CACHE_TTL = 5 * 60 * 1000;

const fetchNewsFromAPI = async () => {
  const response = await fetch("http://localhost:8000/api/news/feed");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return await response.json();
};

const sentimentColor = {
  positive: "#00cc66",
  negative: "#D90429",
  neutral: "#888",
};
const categoryColors = {
  Markets: "#1a73e8",
  Crypto: "#f7931a",
  "Fed Policy": "#6c3483",
  Earnings: "#00897b",
  Commodities: "#795548",
  Stocks: "#1565c0",
  Economy: "#2e7d32",
};

const NewsCard = ({ item, onClick }) => (
  <div
    className={styles.newsCard}
    onClick={() => onClick(item)}
    style={{ cursor: "pointer" }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "8px",
      }}
    >
      <span
        style={{
          display: "inline-block",
          background: categoryColors[item.category] || "#D90429",
          color: "#fff",
          fontSize: "11px",
          fontWeight: "600",
          padding: "2px 8px",
          borderRadius: "4px",
          letterSpacing: "0.3px",
        }}
      >
        {item.category}
      </span>
      <span
        style={{
          display: "inline-block",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: sentimentColor[item.sentiment] || "#888",
          flexShrink: 0,
        }}
        title={item.sentiment}
      />
    </div>
    <h2
      style={{
        fontSize: "1rem",
        fontWeight: "600",
        color: "#1a1a1a",
        marginBottom: "6px",
        lineHeight: "1.4",
        transition: "color 0.2s",
      }}
      className={styles.newsHeadline}
    >
      {item.headline}
    </h2>
    <p
      style={{
        fontSize: "0.875rem",
        color: "#555",
        lineHeight: "1.5",
        marginBottom: "8px",
      }}
    >
      {item.summary}
    </p>
    <div
      style={{
        fontSize: "0.75rem",
        color: "#999",
        display: "flex",
        gap: "12px",
      }}
    >
      <span>{item.source}</span>
      <span>·</span>
      <span>{item.time}</span>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className={styles.newsCard}>
    {[60, 90, 75, 50].map((w, i) => (
      <div
        key={i}
        style={{
          background:
            "linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
          borderRadius: "4px",
          height: i === 0 ? "16px" : i === 1 ? "20px" : "14px",
          width: `${w}%`,
          marginBottom: "8px",
        }}
      />
    ))}
    <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
  </div>
);

const NewsFeed = ({ onNewsClick }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadNews = useCallback(async (force = false) => {
    if (!force) {
      try {
        const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "{}");
        if (cached.data && Date.now() - cached.ts < CACHE_TTL) {
          setNews(cached.data);
          setLastUpdated(new Date(cached.ts));
          setLoading(false);
          return;
        }
      } catch {
        print("error");
      }
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchNewsFromAPI();
      setNews(data);
      setLastUpdated(new Date());
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data, ts: Date.now() }),
      );
    } catch (err) {
      console.error("NewsFeed error:", err);
      setError("Failed to load news. Check API connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
    const interval = setInterval(() => loadNews(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadNews]);

  return (
    <main className={styles.mainFeed}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1a1a1a" }}>
          Market Feed
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {lastUpdated && (
            <span style={{ fontSize: "0.75rem", color: "#999" }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => loadNews(true)}
            disabled={loading}
            style={{
              background: loading ? "#ccc" : "#D90429",
              color: "#fff",
              border: "none",
              padding: "6px 14px",
              borderRadius: "4px",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: loading ? "default" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#fff0f2",
            border: "1px solid #ffb3bc",
            borderRadius: "8px",
            padding: "12px 16px",
            color: "#D90429",
            fontSize: "0.875rem",
            marginBottom: "20px",
          }}
        >
          ⚠ {error}
        </div>
      )}

      {loading
        ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        : news.map((item) => (
            <NewsCard key={item.id} item={item} onClick={onNewsClick} />
          ))}
    </main>
  );
};

export default NewsFeed;
