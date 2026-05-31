import { quadtree } from "d3-quadtree";

export const getTopFeature = (result, pcKey) => {
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
};

export const calculateChartData = (
  result,
  axisX,
  axisY,
  pad,
  width,
  height,
  colors,
) => {
  if (!result || !result.pca_data) return null;

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

  const toCanvasX = (v) => pad + ((v - finalXMin) / xRange) * (width - pad * 2);

  const toCanvasY = (v) =>
    height - pad - ((v - finalYMin) / yRange) * (height - pad * 2);

  return result.pca_data.map((point, idx) => ({
    originalIndex: idx,
    cx: toCanvasX(point[axisX] ?? 0),
    cy: toCanvasY(point[axisY] ?? 0),
    cluster: result.clusters[idx],
    color: colors[result.clusters[idx] % colors.length],
  }));
};

export const buildQuadtree = (chartData) => {
  if (!chartData) return null;
  return quadtree()
    .x((d) => d.cx)
    .y((d) => d.cy)
    .addAll(chartData);
};
