import React from "react";
import styles from "../../css/workspace.module.css";
import { workspaceIcons } from "../../assets/sentiment";

export const UploadView = ({
  uploadStatus,
  uploadMessage,
  fileName,
  fileInputRef,
  handleFileUpload,
  handleDrop,
  handleDragOver,
}) => {
  const { success: SuccessIcon, dropArrow: DropIcon } = workspaceIcons;

  const getDropzoneClasses = () => {
    const classes = [styles.dropzone];
    if (uploadStatus === "success") {
      classes.push(styles.dropzoneSuccess);
    }
    if (uploadStatus === "error") {
      classes.push(styles.dropzoneError);
    }
    return classes.join(" ");
  };

  return (
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
        className={getDropzoneClasses()}
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
  );
};
