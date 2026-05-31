export const getCorrelationColor = (value) => {
  if (value === null || value === undefined) {
    return "#e5e5e5";
  }

  const normalizedValue = Math.max(-1, Math.min(1, value));

  if (normalizedValue >= 0) {
    const r = Math.round(220 + (255 - 220) * normalizedValue);
    const g = Math.round(220 - 220 * normalizedValue);
    const b = Math.round(220 - 220 * normalizedValue);
    return `rgb(${r},${g},${b})`;
  }

  const absValue = Math.abs(normalizedValue);
  const r = Math.round(220 - 220 * absValue);
  const g = Math.round(220 - 220 * absValue);
  const b = Math.round(220 + (255 - 220) * absValue);

  return `rgb(${r},${g},${b})`;
};

export const getTextColorForBackground = (value) => {
  return Math.abs(value) > 0.6 ? "#fff" : "#222";
};
