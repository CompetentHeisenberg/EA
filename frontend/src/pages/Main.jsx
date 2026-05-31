import React from "react";
import { useFinancialData } from "../hooks/Mpage/useFinancialData";
import { useNewsSelection } from "../hooks/Mpage/useNewsSelection";
import Ticker from "../components/Mpage/Ticker";
import Sidebar from "../components/Mpage/Sidebar";
import NewsFeed from "../components/Mpage/NewsFeed";
import NewsDetail from "../components/Mpage/NewsDetail";
import TrendingBar from "../components/Mpage/TrendingBar";
import { DashboardFooter } from "../components/Mpage/DashboardFooter";
import styles from "../css/main.module.css";

export default function MainPage() {
  const { financialData } = useFinancialData();
  const { selectedNews, handleNewsClick, handleBack } = useNewsSelection();

  return (
    <div className={styles.appContainer}>
      <Ticker data={financialData} />

      <div className={styles.contentArea}>
        <Sidebar />

        {selectedNews ? (
          <NewsDetail item={selectedNews} onBack={handleBack} />
        ) : (
          <NewsFeed onNewsClick={handleNewsClick} />
        )}

        <TrendingBar />
      </div>

      <DashboardFooter />
    </div>
  );
}
