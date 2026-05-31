export const generateSparkData = (baseChange, points = 30) => {
  const data = [];
  let val = 100;
  for (let i = 0; i < points; i++) {
    const drift = baseChange / points;
    val += drift + (Math.random() - 0.5) * 1.2;
    data.push(parseFloat(val.toFixed(2)));
  }
  return data;
};

export const buildPath = (values, w, h) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
};
