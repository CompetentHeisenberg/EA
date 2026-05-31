import React, { useRef, useState } from "react";
import styles from "../../css/correlation.module.css";
import { useCorrelationAnalysis } from "../../hooks/CorrelationView/useCorrelationAnalysis";
import { AnalysisParameters } from "./AnalysisParameters";
import { CorrelationMatrix } from "./CorrelationMatrix";
import { DescriptiveStats } from "./DescriptiveStats";

const CorrelationView = ({ fileId, numericCols, fileName, userSettings }) => {
  const heatmapRef = useRef(null);
  const [lockedVariable, setLockedVariable] = useState(null);

  const {
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
  } = useCorrelationAnalysis({
    fileId,
    numericCols,
    fileName,
    userSettings,
  });

  const handleExecuteAnalysis = async () => {
    setLockedVariable(null);
    await handleAnalyze();
  };

  const handleStatRowClick = (col) => {
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
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageBody}>
        <AnalysisParameters
          numericCols={numericCols}
          selectedCols={selectedCols}
          setSelectedCols={setSelectedCols}
          toggleCol={toggleCol}
          corrMethod={corrMethod}
          setCorrMethod={setCorrMethod}
          handleOutliers={handleOutliers}
          setHandleOutliers={setHandleOutliers}
          handleAnalyze={handleExecuteAnalysis}
          loading={loading}
          error={error}
        />

        {corrData && (
          <>
            <CorrelationMatrix
              corrData={corrData}
              heatmapRef={heatmapRef}
              lockedVariable={lockedVariable}
              setLockedVariable={setLockedVariable}
            />

            <DescriptiveStats
              descriptiveStats={corrData.descriptive_stats}
              lockedVariable={lockedVariable}
              onRowClick={handleStatRowClick}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default CorrelationView;
