import React, { useState, _, useRef, useEffect } from "react";
import styles from "../../css/correlation.module.css";

function calculateRegression(data, xKey, yKey) {
  const points = data
    .map((d) => ({
      x: parseFloat(d[xKey]),
      y: parseFloat(d[yKey]),
    }))
    .filter((p) => !isNaN(p.x) && !isNaN(p.y));

  const n = points.length;
  if (n < 2) return null;

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0,
    sumY2 = 0;
  points.forEach((p) => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const rNum = n * sumXY - sumX * sumY;
  const rDen = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  const r2 = rDen === 0 ? 0 : Math.pow(rNum / rDen, 2);

  return { slope, intercept, r2, points, n };
}

export default function RegressionPage() {
  const canvasRef = useRef(null);
  const [uploadedData, setUploadedData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [fileName, setFileName] = useState("");
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [selectedX, setSelectedX] = useState("");
  const [selectedY, setSelectedY] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const numericCols = columns.filter(
    (col) =>
      uploadedData.length > 0 && !isNaN(parseFloat(uploadedData[0][col])),
  );

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const token = localStorage.getItem("token");
    setFileName(file.name);
    setUploadStatus("loading");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) throw new Error("Upload Error");
      const res = await response.json();
      setUploadedData(res.data);
      setColumns(res.columns);
      setUploadStatus("success");
      setUploadMessage(
        `${res.data.length} rows · ${res.columns.length} columns`,
      );
    } catch (err) {
      setUploadStatus("error");
      setUploadMessage(err.message);
    }
  };

  const handleAnalyze = () => {
    setLoading(true);
    setTimeout(() => {
      const res = calculateRegression(uploadedData, selectedX, selectedY);
      setResult(res);
      setLoading(false);
    }, 600);
  };

  useEffect(() => {
    if (!result || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width,
      H = canvas.height,
      PAD = 60;

    const xVals = result.points.map((p) => p.x);
    const yVals = result.points.map((p) => p.y);
    const xMin = Math.min(...xVals),
      xMax = Math.max(...xVals);
    const yMin = Math.min(...yVals),
      yMax = Math.max(...yVals);
    const xRange = xMax - xMin || 1,
      yRange = yMax - yMin || 1;

    const toX = (v) => PAD + ((v - xMin) / xRange) * (W - PAD * 2);
    const toY = (v) => H - PAD - ((v - yMin) / yRange) * (H - PAD * 2);

    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = PAD + (i / 5) * (W - PAD * 2);
      const y = PAD + (i / 5) * (H - PAD * 2);
      ctx.beginPath();
      ctx.moveTo(x, PAD);
      ctx.lineTo(x, H - PAD);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PAD, y);
      ctx.lineTo(W - PAD, y);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(37, 99, 235, 0.6)";
    result.points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(toX(p.x), toY(p.y), 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = "#d90429";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(toX(xMin), toY(result.slope * xMin + result.intercept));
    ctx.lineTo(toX(xMax), toY(result.slope * xMax + result.intercept));
    ctx.stroke();

    ctx.fillStyle = "#868e96";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(selectedX, W / 2, H - 15);
  }, [result, selectedX, selectedY]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <h1 className={styles.pageTitle}>Regression Analysis</h1>
          <p className={styles.pageDesc}>
            Linear relationship · Accuracy estimation · Trend prediction
          </p>
        </div>
      </div>

      <div className={styles.pageBody}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNum}>01</span>
            <h2 className={styles.sectionTitle}>Data Loading</h2>
          </div>
          <div
            className={`${styles.dropZone} ${uploadStatus === "success" ? styles.dropZoneSuccess : ""}`}
            onClick={() => document.getElementById("regrInp").click()}
          >
            <input
              id="regrInp"
              type="file"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <div className={styles.uploadState}>
              {uploadStatus === "success" ? (
                <div className={styles.successIcon}>✓</div>
              ) : (
                <div className={styles.uploadArrow}>↑</div>
              )}
              <div className={styles.uploadInfo}>
                <span className={styles.uploadCta}>
                  {uploadStatus === "success"
                    ? fileName
                    : "Click to upload data"}
                </span>
                <span className={styles.uploadMeta}>
                  {uploadStatus === "success"
                    ? uploadMessage
                    : "CSV, XLSX, XLS"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {numericCols.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>02</span>
              <h2 className={styles.sectionTitle}>Variable Selection</h2>
            </div>
            <div className={styles.pillGrid}>
              <div
                style={{
                  width: "100%",
                  marginBottom: "10px",
                  fontSize: "0.8rem",
                  color: "#868e96",
                }}
              >
                Select Independent (X):
              </div>
              {numericCols.map((c) => (
                <button
                  key={c}
                  className={`${styles.pill} ${selectedX === c ? styles.pillActive : ""}`}
                  onClick={() => setSelectedX(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className={styles.pillGrid}>
              <div
                style={{
                  width: "100%",
                  marginBottom: "10px",
                  fontSize: "0.8rem",
                  color: "#868e96",
                }}
              >
                Select Dependent (Y):
              </div>
              {numericCols.map((c) => (
                <button
                  key={c}
                  className={`${styles.pill} ${selectedY === c ? styles.pillActive : ""}`}
                  onClick={() => setSelectedY(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <button
              className={styles.analyzeBtn}
              onClick={handleAnalyze}
              disabled={!selectedX || !selectedY || loading}
            >
              {loading ? (
                <div className={styles.btnSpinner} />
              ) : (
                "Run Regression"
              )}
            </button>
          </div>
        )}

        {result && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>03</span>
              <h2 className={styles.sectionTitle}>Model Results</h2>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statCardTitle}>Formula</div>
                <div className={styles.statRow}>
                  <span>Equation</span>
                  <span>
                    y = {result.slope.toFixed(3)}x +{" "}
                    {result.intercept.toFixed(3)}
                  </span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statCardTitle}>Quality</div>
                <div className={styles.statRow}>
                  <span>R² Score</span>
                  <span>{(result.r2 * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>
            <div
              style={{
                background: "#fff",
                border: "1px solid #dee2e6",
                borderRadius: "4px",
                padding: "20px",
              }}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={440}
                style={{ width: "100%", height: "auto" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
