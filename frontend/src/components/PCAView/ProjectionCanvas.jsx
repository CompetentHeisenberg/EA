import React, { useEffect } from "react";
import styles from "../../css/pca.module.css";
import { CANVAS_WIDTH, CANVAS_HEIGHT, PAD } from "../../constants/pcaConstants";
import { getTopFeature } from "../../utils/PCAView/pcaUtils";

export const ProjectionCanvas = React.forwardRef(
  (
    {
      chartData,
      activePointId,
      axisX,
      axisY,
      zoom,
      result,
      isDragging,
      lockedPoint,
      onMouseDown,
      onMouseUp,
      onMouseLeave,
      onMouseMove,
    },
    ref,
  ) => {
    useEffect(() => {
      if (!chartData || !ref.current) return;

      const canvas = ref.current;
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

      const topFeatureX = getTopFeature(result, axisX);
      const topFeatureY = getTopFeature(result, axisY);

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
    }, [chartData, activePointId, axisX, axisY, zoom, result, ref]);

    const cursorStyle = isDragging
      ? "grabbing"
      : activePointId !== null && lockedPoint === null
        ? "pointer"
        : "crosshair";

    return (
      <canvas
        ref={ref}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className={styles.canvas}
        style={{
          touchAction: "none",
          cursor: cursorStyle,
        }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
      />
    );
  },
);

ProjectionCanvas.displayName = "ProjectionCanvas";
