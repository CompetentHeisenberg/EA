export const sigLabel = (p) => {
  if (p < 0.01) return "***";
  if (p < 0.05) return "**";
  if (p < 0.1) return "*";
  return "";
};

export const formatStatValue = (val) => {
  if (val === null || val === undefined || isNaN(val)) return "N/A";
  const absVal = Math.abs(val);
  if (absVal >= 1e6) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 2,
    }).format(val);
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(
    val,
  );
};
