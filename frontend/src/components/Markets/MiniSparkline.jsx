import React, { useMemo } from "react";
import { generateSparkData, buildPath } from "../../utils/Markets/chartHelpers";
import styles from "../../css/markets.module.css";

export const MiniSparkline = ({ change, width = 80, height = 32 }) => {
  const data = useMemo(() => generateSparkData(change), [change]);
  const points = buildPath(data, width, height);
  const positive = change >= 0;
  const color = positive ? "#00e676" : "#ff1744";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={styles.sparkline}
    >
      <defs>
        <linearGradient id={`grad-${change}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
};
