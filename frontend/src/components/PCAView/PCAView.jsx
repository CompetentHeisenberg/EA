import React, { useState, useRef, useEffect } from "react";
import styles from "../../css/pca.module.css";
import { usePcaAnalysis } from "../../hooks/PCAView/usePcaAnalysis";
import { AnalysisParameters } from "./AnalysisParameters";
import { ExplainedVariance } from "./ExplainedVariance";
import { ProjectionPlot } from "./ProjectionPlot";
import { ClusterMetrics } from "./ClusterMetrics";
import { ResultsTable } from "./ResultsTable";
import { ROWS_PER_PAGE } from "../../constants/pcaConstants";

const PCAView = ({ fileId, columns, numericCols, userSettings }) => {
  const wrapperRef = useRef(null);

  const {
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
  } = usePcaAnalysis(fileId, numericCols, columns, userSettings);

  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [lockedPoint, setLockedPoint] = useState(null);
  const [zoom, setZoom] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
  const [page, setPage] = useState(0);

  const handleAnalyze = async () => {
    setPage(0);
    setZoom({ scale: 1, offsetX: 0, offsetY: 0 });
    setLockedPoint(null);
    setHoveredPoint(null);
    await analyze();
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setZoom({ scale: 1, offsetX: 0, offsetY: 0 });
    setHoveredPoint(null);
    setLockedPoint(null);
  }, [axisX, axisY]);

  const handleRowClick = (absoluteIndex) => {
    setLockedPoint(absoluteIndex);
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const pcaKeys = result ? Object.keys(result.pca_data[0]) : [];
  const totalPages = result
    ? Math.ceil(result.pca_data.length / ROWS_PER_PAGE)
    : 0;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageBody}>
        <AnalysisParameters
          numericCols={numericCols}
          columns={columns}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCols={selectedCols}
          setSelectedCols={setSelectedCols}
          toggleCol={toggleCol}
          nClusters={nClusters}
          setNClusters={setNClusters}
          labelCol={labelCol}
          setLabelCol={setLabelCol}
          analyze={handleAnalyze}
          loading={loading}
          error={error}
        />

        {result && (
          <>
            <ExplainedVariance variance={result.variance} />

            <ProjectionPlot
              result={result}
              axisX={axisX}
              setAxisX={setAxisX}
              axisY={axisY}
              setAxisY={setAxisY}
              pcaKeys={pcaKeys}
              zoom={zoom}
              setZoom={setZoom}
              hoveredPoint={hoveredPoint}
              setHoveredPoint={setHoveredPoint}
              lockedPoint={lockedPoint}
              setLockedPoint={setLockedPoint}
              wrapperRef={wrapperRef}
              labelCol={labelCol}
              selectedCols={selectedCols}
              nClusters={nClusters}
            />

            <ClusterMetrics metrics={result.cluster_metrics} />

            <ResultsTable
              result={result}
              pcaKeys={pcaKeys}
              labelCol={labelCol}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              hoveredPoint={hoveredPoint}
              setHoveredPoint={setHoveredPoint}
              lockedPoint={lockedPoint}
              handleRowClick={handleRowClick}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PCAView;
