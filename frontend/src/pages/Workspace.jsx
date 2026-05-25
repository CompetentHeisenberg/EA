import React, { useState, useRef, useEffect } from "react";
import CorrelationView from "./CorrelationView";
import PCAView from "./PCAView";
import styles from "../css/workspace.module.css";
import { workspaceIcons } from "../assets/sentiment";
import { fetchSettings } from "../services/api";

export default function Workspace() {
  const [activeTab, setActiveTab] = useState("upload");
  const [fileId, setFileId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [numericCols, setNumericCols] = useState([]);
  const [fileName, setFileName] = useState("");
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  const [userSettings, setUserSettings] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSettings()
      .then((data) => setUserSettings(data))
      .catch(console.error);
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const token = localStorage.getItem("token");

    setFileName(file.name);
    setUploadStatus("loading");
    setUploadMessage("Processing dataset...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        throw new Error("Authorization error");
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Upload failed");
      }

      setFileId(result.file_id);
      setColumns(result.columns || []);
      setNumericCols(result.numeric_columns || []);

      setUploadStatus("success");
      setUploadMessage(
        `${result.total_rows} rows • ${result.columns.length} columns`,
      );

      setTimeout(() => {
        setActiveTab("correlation");
      }, 700);
    } catch (error) {
      setUploadStatus("error");
      setUploadMessage(error.message || "Unexpected error");
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (!file) return;

    handleFileUpload({
      target: {
        files: [file],
      },
    });
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const {
    upload: UploadIcon,
    correlation: CorrelationIcon,
    pca: PCAIcon,
    success: SuccessIcon,
    dropArrow: DropIcon,
    settings: SettingsIcon,
    logout: LogoutIcon,
  } = workspaceIcons;

  return (
    <div className={styles.workspace}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoAccent}>Economic</span>
          <span className={styles.logoText}>Workspace</span>
        </div>

        <div className={styles.navGroup}>
          <span className={styles.navLabel}>Workspace</span>

          <button
            className={`${styles.navButton} ${
              activeTab === "upload" ? styles.navButtonActive : ""
            }`}
            onClick={() => setActiveTab("upload")}
          >
            <UploadIcon />
            <span>Dataset Upload</span>
          </button>
        </div>

        <div className={styles.navGroup}>
          <span className={styles.navLabel}>Analytics</span>

          <button
            className={`${styles.navButton} ${
              activeTab === "correlation" ? styles.navButtonActive : ""
            }`}
            disabled={!fileId}
            onClick={() => setActiveTab("correlation")}
          >
            <CorrelationIcon />
            <span>Correlation Matrix</span>
          </button>

          <button
            className={`${styles.navButton} ${
              activeTab === "pca" ? styles.navButtonActive : ""
            }`}
            disabled={!fileId}
            onClick={() => setActiveTab("pca")}
          >
            <PCAIcon />
            <span>PCA & Clustering</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.titleWrapper}>
              <h2 className={styles.viewTitle}>
                {activeTab === "upload" && "Dataset Upload"}
                {activeTab === "correlation" && "Correlation Matrix"}
                {activeTab === "pca" && "PCA & Clustering"}
              </h2>

              {activeTab !== "upload" && (
                <span className={styles.viewSubtitle}>
                  {activeTab === "correlation" &&
                    "Pearson & Spearman matrices · Outlier Treatment · Descriptive statistics"}
                  {activeTab === "pca" &&
                    "Principal Component Analysis · K-Means clustering · Dimensionality Reduction"}
                </span>
              )}
            </div>

            <div className={styles.headerDivider}></div>

            <div className={styles.dataset}>
              <span className={styles.datasetTitle}>Active Dataset</span>

              {fileId ? (
                <div className={styles.datasetBadge}>{fileName}</div>
              ) : (
                <div className={styles.datasetEmpty}>No dataset selected</div>
              )}
            </div>
          </div>

          <div className={styles.headerActions}>
            <button className={styles.iconButton}>
              <SettingsIcon />
            </button>

            <button className={styles.iconButton}>
              <LogoutIcon />
            </button>
          </div>
        </header>

        <section className={styles.content}>
          {activeTab === "upload" && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIndex}>01</div>

                <div>
                  <h2 className={styles.cardTitle}>Data Initialization</h2>

                  <p className={styles.cardDescription}>
                    Upload CSV or Excel datasets for analysis
                  </p>
                </div>
              </div>

              <div
                className={`${styles.dropzone} ${
                  uploadStatus === "success" ? styles.dropzoneSuccess : ""
                } ${uploadStatus === "error" ? styles.dropzoneError : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className={styles.hiddenInput}
                  onChange={handleFileUpload}
                />

                {uploadStatus === "loading" ? (
                  <div className={styles.state}>
                    <div className={styles.loader} />

                    <div className={styles.stateText}>
                      <h3>Processing dataset</h3>
                      <p>Please wait a few seconds</p>
                    </div>
                  </div>
                ) : uploadStatus === "success" ? (
                  <div className={styles.state}>
                    <div className={styles.success}>
                      <SuccessIcon />
                    </div>

                    <div className={styles.stateText}>
                      <h3>{fileName}</h3>
                      <p>{uploadMessage}</p>
                    </div>

                    <span className={styles.replaceText}>
                      Click or drag another dataset
                    </span>
                  </div>
                ) : (
                  <div className={styles.state}>
                    <div className={styles.dropIcon}>
                      <DropIcon />
                    </div>

                    <div className={styles.stateText}>
                      <h3>Drag & Drop Dataset</h3>
                      <p>CSV, XLSX, XLS supported</p>
                    </div>
                  </div>
                )}
              </div>

              {uploadStatus === "error" && (
                <div className={styles.error}>{uploadMessage}</div>
              )}
            </div>
          )}

          {activeTab === "correlation" && fileId && (
            <CorrelationView
              fileId={fileId}
              numericCols={numericCols}
              fileName={fileName}
              userSettings={userSettings}
            />
          )}

          {activeTab === "pca" && fileId && (
            <PCAView
              fileId={fileId}
              columns={columns}
              numericCols={numericCols}
              fileName={fileName}
              userSettings={userSettings}
            />
          )}
        </section>
      </main>
    </div>
  );
}
