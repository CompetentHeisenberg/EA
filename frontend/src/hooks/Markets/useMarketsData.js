import { useState, useEffect } from "react";
import { fetchMarkets } from "../../services/api";

export const useMarketsData = () => {
  const [stocks, setStocks] = useState([]);
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const data = await fetchMarkets();
        if (isMounted) {
          setStocks(data.stocks);
          setIndices(data.indices);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setLoading(false);
        }
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { stocks, indices, loading };
};
