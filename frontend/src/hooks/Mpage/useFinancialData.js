import { useState, useEffect } from "react";
import { fetchFinancialData } from "../../services/api";
import { DATA_POLLING_INTERVAL } from "../../constants/dashboard";

export const useFinancialData = () => {
  const [financialData, setFinancialData] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const data = await fetchFinancialData();
        if (isMounted && Array.isArray(data)) {
          setFinancialData(data);
        }
      } catch (error) {
        console.error("Failed to fetch financial data:", error);
      }
    };

    loadData();
    const interval = setInterval(loadData, DATA_POLLING_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { financialData };
};
