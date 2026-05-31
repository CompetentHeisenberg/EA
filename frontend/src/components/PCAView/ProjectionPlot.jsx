import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import styles from "../../css/pca.module.css";
import {
  calculateChartData,
  buildQuadtree,
} from "../../utils/PCAView/pcaUtils";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PAD,
  CLUSTER_COLORS,
} from "../../constants/pcaConstants";
import { ProjectionCanvas } from "./ProjectionCanvas";
import { ProjectionTooltip } from "./ProjectionTooltip";

export const ProjectionPlot = ({
  result,
  axisX,
  setAxisX,
  axisY,
  setAxisY,
  pcaKeys,
  zoom,
  setZoom,
  hoveredPoint,
  setHoveredPoint,
  lockedPoint,
  setLockedPoint,
  wrapperRef,
  labelCol,
  selectedCols,
  nClusters,
}) => {
  const canvasRef = useRef(null);
  const hoverThrottle = useRef(false);
  const hasDragged = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const chartData = useMemo(() => {
    return calculateChartData(
      result,
      axisX,
      axisY,
      PAD,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      CLUSTER_COLORS,
    );
  }, [result, axisX, axisY]);

  const tree = useMemo(() => {
    return buildQuadtree(chartData);
  }, [chartData]);

  const activePointId = lockedPoint !== null ? lockedPoint : hoveredPoint;

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const cursorX = (e.clientX - rect.left) * scaleX;
    const cursorY = (e.clientY - rect.top) * scaleY;

    setIsDragging(true);
    hasDragged.current = false;
    dragStart.current = {
      x: cursorX - zoom.offsetX,
      y: cursorY - zoom.offsetY,
    };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (!hasDragged.current && hoveredPoint !== null) {
      setLockedPoint(hoveredPoint);
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (lockedPoint === null) setHoveredPoint(null);
  };

  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const cursorX = (e.clientX - rect.left) * scaleX;
    const cursorY = (e.clientY - rect.top) * scaleY;

    if (isDragging) {
      hasDragged.current = true;
      setZoom((prev) => ({
        ...prev,
        offsetX: cursorX - dragStart.current.x,
        offsetY: cursorY - dragStart.current.y,
      }));
      return;
    }

    if (lockedPoint !== null) return;

    if (!tree || hoverThrottle.current) return;

    hoverThrottle.current = true;
    requestAnimationFrame(() => {
      hoverThrottle.current = false;
    });

    const { scale, offsetX, offsetY } = zoom;
    const mx = (cursorX - offsetX) / scale;
    const my = (cursorY - offsetY) / scale;

    const closest = tree.find(mx, my, 20 / scale);
    setHoveredPoint(closest ? closest.originalIndex : null);
  };

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;

      setZoom((prev) => {
        const newScale = Math.min(
          Math.max(prev.scale * zoomFactor, 0.1),
          10000,
        );
        const mouseXData = (mouseX - prev.offsetX) / prev.scale;
        const mouseYData = (mouseY - prev.offsetY) / prev.scale;
        const newOffsetX = mouseX - mouseXData * newScale;
        const newOffsetY = mouseY - mouseYData * newScale;
        return { scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY };
      });
    },
    [setZoom],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e) => handleWheel(e);
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handler);
    };
  }, [handleWheel, result]);

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNum}>03</span>
        <h2 className={styles.sectionTitle}>Projection Plot</h2>
        <div className={styles.axisSelectors}>
          <select
            className={styles.axisSelect}
            value={axisX}
            onChange={(e) => setAxisX(e.target.value)}
          >
            {pcaKeys.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <select
            className={styles.axisSelect}
            value={axisY}
            onChange={(e) => setAxisY(e.target.value)}
          >
            {pcaKeys.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          {(zoom.scale !== 1 || zoom.offsetX !== 0 || zoom.offsetY !== 0) && (
            <button
              className={styles.pill}
              onClick={() => setZoom({ scale: 1, offsetX: 0, offsetY: 0 })}
            >
              Reset view
            </button>
          )}
        </div>
      </div>

      <div
        className={styles.chartArea}
        ref={wrapperRef}
        style={{ position: "relative" }}
      >
        <ProjectionCanvas
          ref={canvasRef}
          chartData={chartData}
          activePointId={activePointId}
          axisX={axisX}
          axisY={axisY}
          zoom={zoom}
          result={result}
          isDragging={isDragging}
          lockedPoint={lockedPoint}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleCanvasMouseMove}
        />

        {!isDragging && (
          <ProjectionTooltip
            activePointId={activePointId}
            lockedPoint={lockedPoint}
            setLockedPoint={setLockedPoint}
            labelCol={labelCol}
            result={result}
            selectedCols={selectedCols}
            pcaKeys={pcaKeys}
          />
        )}
      </div>

      <div className={styles.clusterLegend}>
        {Array.from({ length: nClusters }, (_, i) => (
          <div key={i} className={styles.legendItem}>
            <div
              className={styles.legendDot}
              style={{
                background: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
              }}
            />
            Cluster {i + 1} ({result.clusters.filter((c) => c === i).length}{" "}
            obs.)
          </div>
        ))}
      </div>
    </div>
  );
};
