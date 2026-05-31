export const corrToColor = (v) => {
  const val = Math.max(-1, Math.min(1, v));
  if (val >= 0) {
    return `rgb(${Math.round(220 + (255 - 220) * val)},${Math.round(220 - 220 * val)},${Math.round(220 - 220 * val)})`;
  }
  const a = Math.abs(val);
  return `rgb(${Math.round(220 - 220 * a)},${Math.round(220 - 220 * a)},${Math.round(220 + (255 - 220) * a)})`;
};

export const textColor = (v) => {
  return Math.abs(v) > 0.6 ? "#fff" : "#222";
};
