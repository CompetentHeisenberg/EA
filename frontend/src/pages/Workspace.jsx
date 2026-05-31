import React, { useCallback } from "react";
import CorrelationView from "../components/CorrelationView/CorrelationView";
import PCAView from "../components/PCAView/PCAView";
import styles from "../css/workspace.module.css";
import { useWorkspaceState } from "../hooks/Workspace/useWorkspaceState";
import { useFileUpload } from "../hooks/Workspace/useFileUpload";
import { Sidebar } from "../components/Workspace/Sidebar";
import { Header } from "../components/Workspace/Header";
import { UploadView } from "../components/Workspace/UploadView";

const Workspace = () => {
  const {
    activeTab,
    setActiveTab,
    fileId,
    columns,
    numericCols,
    fileName,
    userSettings,
    setDatasetData,
  } = useWorkspaceState();

  const handleUploadSuccess = useCallback(
    ({
      fileId: newFileId,
      fileName: newFileName,
      columns: newCols,
      numericCols: newNumericCols,
    }) => {
      setDatasetData(newFileId, newFileName, newCols, newNumericCols);
      setTimeout(() => {
        setActiveTab("correlation");
      }, 700);
    },
    [setDatasetData, setActiveTab],
  );

  const {
    uploadStatus,
    uploadMessage,
    fileInputRef,
    handleFileUpload,
    handleDrop,
    handleDragOver,
  } = useFileUpload(handleUploadSuccess);

  return (
    <div className={styles.workspace}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDatasetLoaded={!!fileId}
      />

      <main className={styles.main}>
        <Header activeTab={activeTab} fileId={fileId} fileName={fileName} />

        <section className={styles.content}>
          {activeTab === "upload" && (
            <UploadView
              uploadStatus={uploadStatus}
              uploadMessage={uploadMessage}
              fileName={fileName}
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              handleDrop={handleDrop}
              handleDragOver={handleDragOver}
            />
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
};

export default Workspace;
