import React from "react";
import { useHistoryDetail } from "../hooks/History/useHistoryDetail";
import { PageHeader } from "../components/historyDetail/PageHeader";
import { CorrelationDetail } from "../components/historyDetail/CorrelationDetail";
import { PCADetail } from "../components/historyDetail/PCADetail";
import styles from "../css/history.module.css";

export default function HistoryDetailPage() {
  const sessionId = window.location.pathname.split("/").pop();
  const { data, loading, error } = useHistoryDetail(sessionId);

  return (
    <div className={styles.pageContainer}>
      <PageHeader data={data} />

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
