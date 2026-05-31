import { useState, useCallback, useEffect } from "react";
import { fetchCorrelationAnalysis } from "../../services/correlationService";

export const useCorrelationAnalysis = ({
  fileId,
  numericCols,
  fileName,
  userSettings,
}) => {
  const [selectedCols, setSelectedCols] = useState([]);
  const [corrMethod, setCorrMethod] = useState(
    userSettings?.correlation_method || "pearson",
  );
  const [handleOutliers, setHandleOutliers] = useState(
    userSettings?.outlier_treatment === "winsorize",
  );

  const [corrData, setCorrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (numericCols && numericCols.length > 0) {
      setSelectedCols(numericCols.slice(0, 5));
    }
  }, [numericCols]);

  const toggleCol = useCallback((col) => {
    setSelectedCols((prev) =>
      prev.includes(col)
        ? prev.filter((c) => c !== col)
        : prev.length < 30
          ? [...prev, col]
          : prev,
    );
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (selectedCols.length < 2) {
      setError("Choose at least 2 columns");
      return;
    }

    if (!fileId) {
      setError("File ID missing. Please upload the file again.");
      return;
    }

    const token = localStorage.getItem("token");

    setLoading(true);
    setError(null);
    setCorrData(null);

    try {
      const result = await fetchCorrelationAnalysis({
        fileId,
        columns: selectedCols,
        fileName,
        method: corrMethod,
        handleOutliers,
        token,
      });

      setCorrData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCols, fileId, fileName, corrMethod, handleOutliers]);

  const resetAnalysisState = useCallback(() => {
    setCorrData(null);
  }, []);

  return {
    selectedCols,
    setSelectedCols,
    toggleCol,
    corrMethod,
    setCorrMethod,
    handleOutliers,
    setHandleOutliers,
    corrData,
    loading,
    error,
    handleAnalyze,
    resetAnalysisState,
  };
};
