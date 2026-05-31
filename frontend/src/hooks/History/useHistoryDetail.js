import { useState, useEffect } from "react";
import { fetchHistoryResult } from "../../services/api";

export const useHistoryDetail = (sessionId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistoryResult(sessionId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return { data, loading, error };
};
