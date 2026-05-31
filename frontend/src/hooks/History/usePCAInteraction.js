import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { quadtree } from "d3-quadtree";
import { CLUSTER_COLORS } from "../../constants/analysis";
import { CANVAS_WIDTH, CANVAS_HEIGHT, PAD } from "../../constants/pcaConstants";

export const usePCAInteraction = (result) => {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const hoverThrottle = useRef(false);
  const hasDragged = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const [axisX, setAxisX] = useState("PC1");
  const [axisY, setAxisY] = useState("PC2");
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [lockedPoint, setLockedPoint] = useState(null);
  const [zoom, setZoom] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [page, setPage] = useState(0);

  const rowsPerPage = 50;

  const pcaKeys = useMemo(() => {
    return result?.pca_data?.length ? Object.keys(result.pca_data[0]) : [];
  }, [result]);

  const nClusters = useMemo(() => {
    return result?.clusters ? Math.max(...result.clusters) + 1 : 0;
  }, [result]);

  const totalPages = useMemo(() => {
    return result?.pca_data
      ? Math.ceil(result.pca_data.length / rowsPerPage)
      : 0;
  }, [result, rowsPerPage]);

  const handleAxisXChange = useCallback((e) => {
    setAxisX(e.target.value);
    setZoom({ scale: 1, offsetX: 0, offsetY: 0 });
    setHoveredPoint(null);
    setLockedPoint(null);
  }, []);

  const handleAxisYChange = useCallback((e) => {
    setAxisY(e.target.value);
    setZoom({ scale: 1, offsetX: 0, offsetY: 0 });
    setHoveredPoint(null);
    setLockedPoint(null);
  }, []);

  const getTopFeature = useCallback(
    (pcKey) => {
      if (!result || !result.loadings) return null;
      const loadings = result.loadings[pcKey];
      if (!loadings) return null;
      let maxAbs = -Infinity;
      let topFeature = null;
      for (const [feat, val] of Object.entries(loadings)) {
        if (Math.abs(val) > maxAbs) {
          maxAbs = Math.abs(val);
          topFeature = feat;
        }
      }
      return topFeature;
    },
    [result],
  );

  const chartData = useMemo(() => {
    if (!result || !result.pca_data) return [];
    const xs = result.pca_data.map((p) => p[axisX] ?? 0);
    const ys = result.pca_data.map((p) => p[axisY] ?? 0);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);

    const xMargin = (xMax - xMin) * 0.05 || 1;
    const yMargin = (yMax - yMin) * 0.05 || 1;
    const finalXMin = xMin - xMargin;
    const finalYMin = yMin - yMargin;
    const xRange = xMax + xMargin - finalXMin || 1;
    const yRange = yMax + yMargin - finalYMin || 1;

    const toCanvasX = (v) =>
      PAD + ((v - finalXMin) / xRange) * (CANVAS_WIDTH - PAD * 2);
    const toCanvasY = (v) =>
      CANVAS_HEIGHT -
      PAD -
      ((v - finalYMin) / yRange) * (CANVAS_HEIGHT - PAD * 2);

    return result.pca_data.map((point, idx) => ({
      originalIndex: idx,
      cx: toCanvasX(point[axisX] ?? 0),
      cy: toCanvasY(point[axisY] ?? 0),
      cluster: result.clusters[idx],
      color: CLUSTER_COLORS[result.clusters[idx] % CLUSTER_COLORS.length],
    }));
  }, [result, axisX, axisY]);

  const tree = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    return quadtree()
      .x((d) => d.cx)
      .y((d) => d.cy)
      .addAll(chartData);
  }, [chartData]);

  const activePointId = lockedPoint !== null ? lockedPoint : hoveredPoint;

  useEffect(() => {
    if (!chartData || chartData.length === 0 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const { scale, offsetX, offsetY } = zoom;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1 / scale;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const x = PAD + (i / 5) * (CANVAS_WIDTH - PAD * 2);
      const y = PAD + (i / 5) * (CANVAS_HEIGHT - PAD * 2);
      ctx.moveTo(x, PAD);
      ctx.lineTo(x, CANVAS_HEIGHT - PAD);
      ctx.moveTo(PAD, y);
      ctx.lineTo(CANVAS_WIDTH - PAD, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "#dee2e6";
    ctx.lineWidth = 1.5 / scale;
    ctx.beginPath();
    ctx.moveTo(PAD, CANVAS_HEIGHT - PAD);
    ctx.lineTo(CANVAS_WIDTH - PAD, CANVAS_HEIGHT - PAD);
    ctx.moveTo(PAD, PAD);
    ctx.lineTo(PAD, CANVAS_HEIGHT - PAD);
    ctx.stroke();
    ctx.restore();

    const topFeatureX = getTopFeature(axisX);
    const topFeatureY = getTopFeature(axisY);
    const xLabel = topFeatureX ? `${axisX} (${topFeatureX})` : axisX;
    const yLabel = topFeatureY ? `${axisY} (${topFeatureY})` : axisY;

    ctx.fillStyle = "#868e96";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(xLabel, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
    ctx.save();
    ctx.translate(20, CANVAS_HEIGHT / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    ctx.globalAlpha = 0.75;
    chartData.forEach(({ cx, cy, color, originalIndex }) => {
      if (activePointId === originalIndex) return;
      ctx.beginPath();
      ctx.arc(cx, cy, 5 / scale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    if (activePointId !== null) {
      const activePoint = chartData[activePointId];
      if (activePoint) {
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(activePoint.cx, activePoint.cy, 8 / scale, 0, Math.PI * 2);
        ctx.fillStyle = activePoint.color;
        ctx.fill();
        ctx.strokeStyle = "#121212";
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }
    }
    ctx.restore();
  }, [chartData, activePointId, axisX, axisY, zoom, getTopFeature]);

  const handleMouseDown = useCallback(
    (e) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const cursorX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const cursorY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      setIsDragging(true);
      hasDragged.current = false;
      dragStart.current = {
        x: cursorX - zoom.offsetX,
        y: cursorY - zoom.offsetY,
      };
    },
    [zoom],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (!hasDragged.current && hoveredPoint !== null) {
      setLockedPoint(hoveredPoint);
    }
  }, [hoveredPoint]);

  const handleCanvasMouseMove = useCallback(
    (e) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const cursorX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const cursorY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);

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
      requestAnimationFrame(() => (hoverThrottle.current = false));

      const mx = (cursorX - zoom.offsetX) / zoom.scale;
      const my = (cursorY - zoom.offsetY) / zoom.scale;
      const closest = tree.find(mx, my, 20 / zoom.scale);
      setHoveredPoint(closest ? closest.originalIndex : null);
    },
    [isDragging, lockedPoint, tree, zoom],
  );

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;

    setZoom((prev) => {
      const newScale = Math.min(Math.max(prev.scale * zoomFactor, 0.1), 10000);
      const mouseXData = (mouseX - prev.offsetX) / prev.scale;
      const mouseYData = (mouseY - prev.offsetY) / prev.scale;
      return {
        scale: newScale,
        offsetX: mouseX - mouseXData * newScale,
        offsetY: mouseY - mouseYData * newScale,
      };
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e) => handleWheel(e);
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, [handleWheel]);

  const handleRowClick = useCallback((absoluteIndex) => {
    setLockedPoint(absoluteIndex);
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    if (lockedPoint === null) setHoveredPoint(null);
  }, [lockedPoint]);

  return {
    canvasRef,
    wrapperRef,
    axisX,
    axisY,
    zoom,
    setZoom,
    isDragging,
    page,
    setPage,
    pcaKeys,
    nClusters,
    totalPages,
    activePointId,
    hoveredPoint,
    lockedPoint,
    setHoveredPoint,
    setLockedPoint,
    rowsPerPage,
    getTopFeature,
    handleAxisXChange,
    handleAxisYChange,
    handleMouseDown,
    handleMouseUp,
    handleCanvasMouseMove,
    handleMouseLeave,
    handleRowClick,
  };
};
