import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../css/main.module.css";

const Main = () => {
  const [financialData, setFinancialData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      let fiatItems = [];
      let cryptoItems = [];

      try {
        const fiatRes = await axios.get(
          "https://open.er-api.com/v6/latest/USD",
        );
        const rates = fiatRes.data.rates;

        const usdToUah = rates.UAH;
        const eurToUah = rates.UAH / rates.EUR;

        fiatItems = [
          { label: "USD/UAH", value: `${usdToUah.toFixed(2)} ₴` },
          { label: "EUR/UAH", value: `${eurToUah.toFixed(2)} ₴` },
        ];
      } catch (err) {
        alert(err);
        fiatItems = [
          { label: "USD/UAH", value: "41.50 ₴" },
          { label: "EUR/UAH", value: "45.20 ₴" },
        ];
      }

      try {
        const cryptoRes = await axios.get(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
        );
        const prices = cryptoRes.data;

        cryptoItems = [
          {
            label: "BTC/USD",
            value: `$${prices.bitcoin.usd.toLocaleString()}`,
          },
          {
            label: "ETH/USD",
            value: `$${prices.ethereum.usd.toLocaleString()}`,
          },
        ];
      } catch (err) {
        alert(err);
        cryptoItems = [
          { label: "BTC/USD", value: "$98,500" },
          { label: "ETH/USD", value: "$2,750" },
        ];
      }

      const finalData = [
        ...fiatItems,
        ...cryptoItems,
        { label: "S&P 500", value: "4,780 ▲" },
        { label: "NASDAQ", value: "16,200 ▲" },
      ];

      setFinancialData(finalData);
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.appContainer}>
      <header className={styles.tickerHeader}>
        <div className={styles.tickerWrap}>
          {financialData.length > 0 && (
            <div className={styles.tickerMove}>
              {[...financialData, ...financialData].map((item, index) => (
                <span key={index} className={styles.tickerItem}>
                  {item.label}:{" "}
                  <span className={styles.value}>{item.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className={styles.contentArea}>
        <aside className={styles.sidebar}>
          <nav>
            <a href="#home" className={styles.navItem}>
              Home
            </a>
            <a href="#markets" className={styles.navItem}>
              Markets
            </a>
            <a href="#portfolio" className={styles.navItem}>
              Portfolio
            </a>
            <a href="#news" className={styles.navItem}>
              News
            </a>
            <a href="#settings" className={styles.navItem}>
              Settings
            </a>
          </nav>
        </aside>

        <main className={styles.mainFeed}>
          <h1>Market Feed</h1>
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className={styles.newsCard}>
              <h2 style={{ color: "#D90429", marginBottom: "10px" }}>
                Market Update #{i + 1}
              </h2>
              <p>
                Global markets are showing significant volatility today.
                Analysts suggest keeping an eye on the tech sector and emerging
                market currencies as key indicators for the upcoming quarter.
              </p>
            </div>
          ))}
        </main>

        <aside className={styles.rightSidebar}>
          <div className={styles.trendingBlock}>
            <h3>Trending Now</h3>
            <p>#Bitcoin</p>
            <p>#Nvidia</p>
            <p>#AI_Revolution</p>
            <p>#Economy</p>
          </div>
          <div className={styles.trendingBlock}>
            <h3>Top Gainers</h3>
            <p style={{ color: "#00cc66" }}>NVDA +3.2%</p>
            <p style={{ color: "#00cc66" }}>TSLA +1.5%</p>
            <p style={{ color: "#00cc66" }}>AAPL +0.8%</p>
          </div>
        </aside>
      </div>

      <footer className={styles.footer}>
        <p>© 2026 Financial Dashboard. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Main;
