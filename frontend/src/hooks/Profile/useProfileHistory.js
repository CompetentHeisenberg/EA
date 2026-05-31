import { useState, useEffect, useCallback } from "react";
import { fetchHistory, fetchHistoryResult } from "../../services/api";

export const useProfileHistory = () => {
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

  const handleToggle = useCallback(
    async (item) => {
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
    },
    [openId, results],
  );

  return {
    history,
    loadingHistory,
    openId,
    results,
    loadingId,
    handleToggle,
  };
};
