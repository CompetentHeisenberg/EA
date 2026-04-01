import React, { useState, useEffect } from "react";
import { fetchFinancialData } from "../services/api";
import Ticker from "../components/Mpage/Ticker";
import Sidebar from "../components/Mpage/Sidebar";
import NewsFeed from "../components/Mpage/NewsFeed";
import TrendingBar from "../components/Mpage/TrendingBar";
import styles from "../css/main.module.css";

const Main = () => {
  const [financialData, setFinancialData] = useState([]);
  const [_, setTickerLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const data = await fetchFinancialData();
        if (isMounted && Array.isArray(data)) {
          setFinancialData(data);
          setTickerLoaded(true);
        }
      } catch (error) {
        console.error("Failed to fetch financial data:", error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={styles.appContainer}>
      <Ticker data={financialData} />

      <div className={styles.contentArea}>
        <Sidebar />
        <NewsFeed />
        <TrendingBar />
      </div>

      <footer className={styles.footer}>
        <p>© 2026 Financial Dashboard. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Main;
