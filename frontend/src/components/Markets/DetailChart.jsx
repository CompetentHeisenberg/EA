import React, { useRef, useEffect, useMemo } from "react";
import { generateSparkData } from "../../utils/Markets/chartHelpers";
import styles from "../../css/markets.module.css";

export const DetailChart = ({ stock }) => {
  const canvasRef = useRef(null);

  const data = useMemo(
    () => generateSparkData(stock.change, 60),
    [stock.change],
  );

  const positive = stock.change >= 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const color = positive ? "#00e676" : "#ff1744";

    const toX = (i) => (i / (data.length - 1)) * (w - 40) + 20;
    const toY = (v) => h - 30 - ((v - min) / range) * (h - 60);

    ctx.beginPath();
    ctx.moveTo(toX(0), toY(data[0]));
    data.forEach((v, i) => ctx.lineTo(toX(i), toY(v)));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + "44");
    grad.addColorStop(1, color + "00");
    ctx.lineTo(toX(data.length - 1), h - 30);
    ctx.lineTo(toX(0), h - 30);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.5;
    [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
      const y = h - 30 - t * (h - 60);
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
      const val = (min + t * range).toFixed(1);
      ctx.fillStyle = "#666";
      ctx.font = "10px monospace";
      ctx.fillText(val, 2, y + 3);
    });

    const labels = ["1M", "1W ago", "3D ago", "1D ago", "Now"];
    labels.forEach((label, idx) => {
      const x = toX(
        Math.floor((idx / (labels.length - 1)) * (data.length - 1)),
      );
      ctx.fillStyle = "#555";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, x, h - 10);
    });
  }, [stock, data, positive]);

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={200}
      className={styles.detailChart}
    />
  );
};
