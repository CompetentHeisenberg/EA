import React from "react";
import { useHistoryData } from "../hooks/History/useHistoryData";
import { HistoryHeader } from "../components/History/HistoryHeader";
import { HistoryList } from "../components/History/HistoryList";
import styles from "../css/profile.module.css";

export default function HistoryPage() {
  const { history, loadingHistory, openId, results, loadingId, handleToggle } =
    useHistoryData();

  return (
    <div className={styles.pageContainer}>
      <HistoryHeader />

      <div className={styles.pageBody}>
        <HistoryList
          history={history}
          loadingHistory={loadingHistory}
          openId={openId}
          results={results}
          loadingId={loadingId}
          onToggle={handleToggle}
        />
      </div>
    </div>
  );
}
