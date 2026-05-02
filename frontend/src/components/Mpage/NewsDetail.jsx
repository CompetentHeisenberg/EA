import React, { useState, useEffect } from "react";
import styles from "../../css/main.module.css";
import { extractArticleText } from "../../services/api";
import { sentimentLabel } from "../../assets/sentiment";

const icons = {
  positive: sentimentLabel["positive"],
  negative: sentimentLabel["negative"],
  neutral: sentimentLabel["neutral"],
};

const sentimentBg = {
  positive: "#e6f9f0",
  negative: "#fff0f2",
  neutral: "#f5f5f5",
};

const sentimentColor = {
  positive: "#00aa55",
  negative: "#D90429",
  neutral: "#666",
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

const getPlaceholderImage = (category, imageQuery, uniqueId) => {
  const queries = {
    Markets: "stock-market",
    Crypto: "bitcoin-crypto",
    "Fed Policy": "federal-reserve",
    Earnings: "corporate-finance",
    Commodities: "oil-gold",
    Stocks: "wall-street",
    Economy: "economy-finance",
  };

  const theme =
    queries[category] || imageQuery?.replace(/\s+/g, "-") || "finance";
  const combinedString = `${theme}-${uniqueId || Math.random()}`;
  const seed =
    combinedString.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 1000;

  return `https://picsum.photos/seed/${seed}/800/400`;
};

const NewsDetail = ({ item, onBack }) => {
  const [fullText, setFullText] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item?.link) return;

    let ignore = false;
    const fetchArticleText = async () => {
      setLoading(true);
      try {
        const data = await extractArticleText(item.link);

        if (!ignore) {
          setFullText(data.text);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load article:", err);
        if (!ignore) {
          setFullText("Could not load the full text automatically.");
          setLoading(false);
        }
      }
    };

    fetchArticleText();

    return () => {
      ignore = true;
    };
  }, [item]);

  if (!item) return null;

  const categoryColor = categoryColors[item.category] || "#D90429";
  const imgSrc = getPlaceholderImage(item.category, item.imageQuery, item.id);
  const IconComponent = icons[item.sentiment]?.icon;

  return (
    <main className={styles.mainFeed} style={{ maxWidth: "800px" }}>
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#D90429",
          fontWeight: "600",
          fontSize: "0.9rem",
          padding: "0 0 20px 0",
        }}
      >
        ← Back to Feed
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <span
          style={{
            background: categoryColor,
            color: "#fff",
            fontSize: "11px",
            fontWeight: "600",
            padding: "3px 10px",
            borderRadius: "4px",
          }}
        >
          {item.category}
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: sentimentBg[item.sentiment],
            color: sentimentColor[item.sentiment],
            fontSize: "11px",
            fontWeight: "600",
            padding: "3px 10px",
            borderRadius: "4px",
          }}
        >
          {IconComponent &&
            (typeof IconComponent === "string" ? (
              IconComponent
            ) : (
              <IconComponent size={14} />
            ))}
          <span>{icons[item.sentiment]?.text}</span>
        </span>
        <span
          style={{ fontSize: "0.75rem", color: "#999", marginLeft: "auto" }}
        >
          {item.source} · {item.time}
        </span>
      </div>

      <h1
        style={{
          fontSize: "1.6rem",
          fontWeight: "700",
          color: "#1a1a1a",
          lineHeight: "1.3",
          marginBottom: "20px",
        }}
      >
        {item.headline}
      </h1>

      <div
        style={{
          width: "100%",
          height: "280px",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "24px",
          background: "#f0f0f0",
          position: "relative",
        }}
      >
        <img
          src={imgSrc}
          alt={item.headline}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
            padding: "20px 16px 12px",
            color: "#fff",
            fontSize: "0.75rem",
          }}
        >
          {item.source}
        </div>
      </div>

      <p
        style={{
          fontSize: "1.05rem",
          color: "#444",
          lineHeight: "1.7",
          marginBottom: "30px",
          fontStyle: "italic",
          borderLeft: "3px solid #D90429",
          paddingLeft: "16px",
        }}
      >
        {item.summary}
      </p>

      {loading && (
        <div style={{ marginBottom: "30px" }}>
          {[100, 90, 95, 85].map((w, i) => (
            <div
              key={i}
              style={{
                height: "14px",
                width: `${w}%`,
                borderRadius: "4px",
                marginBottom: "12px",
                background:
                  "linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
              }}
            />
          ))}
        </div>
      )}

      {fullText && !loading && (
        <div
          style={{
            fontSize: "1rem",
            color: "#333",
            lineHeight: "1.8",
            marginBottom: "30px",
          }}
        >
          {fullText.split("\n").map(
            (paragraph, index) =>
              paragraph.trim() && (
                <p key={index} style={{ marginBottom: "16px" }}>
                  {paragraph}
                </p>
              ),
          )}
        </div>
      )}

      {item.link && (
        <div style={{ borderTop: "1px solid #eee", paddingTop: "20px" }}>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "#1a1a1a",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "0.95rem",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.background = "#333")}
            onMouseOut={(e) => (e.target.style.background = "#1a1a1a")}
          >
            Read original article ↗
          </a>
        </div>
      )}
    </main>
  );
};

export default NewsDetail;
