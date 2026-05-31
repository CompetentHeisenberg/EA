import { useState, useRef, useMemo, useCallback } from "react";

export const useCorrelationInteraction = (result) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [lockedVariable, setLockedVariable] = useState(null);
  const heatmapRef = useRef(null);

  const hoveredInfo = useMemo(() => {
    if (!hoveredCell || !result || !result.tickers) return null;
    return {
      ti: result.tickers[hoveredCell.i],
      tj: result.tickers[hoveredCell.j],
      corr: result.correlation_matrix[hoveredCell.i][hoveredCell.j],
      pval: result.pvalue_matrix[hoveredCell.i][hoveredCell.j],
    };
  }, [hoveredCell, result]);

  const strongCount = useMemo(() => {
    if (!result || !result.tickers) return 0;
    let c = 0;
    for (let i = 0; i < result.tickers.length; i++) {
      for (let j = i + 1; j < result.tickers.length; j++) {
        if (Math.abs(result.correlation_matrix[i][j]) > 0.7) c++;
      }
    }
    return c;
  }, [result]);

  const isCompactMatrix = useMemo(() => {
    if (!result || !result.tickers) return false;
    return result.tickers.length > 12;
  }, [result]);

  const handleStatRowClick = useCallback(
    (col) => {
      if (lockedVariable === col) {
        setLockedVariable(null);
      } else {
        setLockedVariable(col);
        if (heatmapRef.current) {
          heatmapRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    },
    [lockedVariable],
  );

  return {
    hoveredCell,
    setHoveredCell,
    lockedVariable,
    setLockedVariable,
    heatmapRef,
    hoveredInfo,
    strongCount,
    isCompactMatrix,
    handleStatRowClick,
  };
};
