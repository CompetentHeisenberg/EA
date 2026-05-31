import { useState, useCallback, useEffect } from "react";
import { fetchPcaAnalysis } from "../../services/pcaService";

export const usePcaAnalysis = (fileId, numericCols, columns, userSettings) => {
  const defaultAxes = (userSettings?.preferred_pca_axes || "PC1,PC2").split(
    ",",
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [labelCol, setLabelCol] = useState("");
  const [selectedCols, setSelectedCols] = useState([]);
  const [nClusters, setNClusters] = useState(
    userSettings?.default_clusters || 3,
  );

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [axisX, setAxisX] = useState(defaultAxes[0] || "PC1");
  const [axisY, setAxisY] = useState(defaultAxes[1] || "PC2");

  useEffect(() => {
    if (numericCols && numericCols.length > 0) {
      setSelectedCols(numericCols.slice(0, 8));
      const textCols = columns.filter((col) => !numericCols.includes(col));
      if (textCols.length > 0) setLabelCol(textCols[0]);
    }
  }, [columns, numericCols]);

  const toggleCol = useCallback((col) => {
    setSelectedCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    );
  }, []);

  const analyze = useCallback(async () => {
    if (selectedCols.length < 2) {
      setError("Select at least 2 columns");
      return;
    }

    const token = localStorage.getItem("token");
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchPcaAnalysis({
        fileId,
        columns: selectedCols,
        labelCol,
        nClusters,
        token,
      });
      setResult(data);
      setAxisX(defaultAxes[0] || "PC1");
      setAxisY(defaultAxes[1] || "PC2");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCols, fileId, labelCol, nClusters, defaultAxes]);

  return {
    searchTerm,
    setSearchTerm,
    labelCol,
    setLabelCol,
    selectedCols,
    setSelectedCols,
    nClusters,
    setNClusters,
    result,
    loading,
    error,
    axisX,
    setAxisX,
    axisY,
    setAxisY,
    toggleCol,
    analyze,
  };
};
