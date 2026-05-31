import { useState, useRef, useCallback } from "react";
import { uploadDataset } from "../../services/uploadService";

export const useFileUpload = (onUploadSuccess) => {
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef(null);

  const handleFileUpload = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const token = localStorage.getItem("token");

      setUploadStatus("loading");
      setUploadMessage("Processing dataset...");

      try {
        const result = await uploadDataset(file, token);

        onUploadSuccess({
          fileId: result.file_id,
          fileName: file.name,
          columns: result.columns || [],
          numericCols: result.numeric_columns || [],
          totalRows: result.total_rows,
        });

        setUploadStatus("success");
        setUploadMessage(
          `${result.total_rows} rows • ${result.columns.length} columns`,
        );
      } catch (error) {
        setUploadStatus("error");
        setUploadMessage(error.message || "Unexpected error");
      } finally {
        if (event.target) {
          event.target.value = "";
        }
      }
    },
    [onUploadSuccess],
  );

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (!file) return;

      handleFileUpload({
        target: {
          files: [file],
        },
      });
    },
    [handleFileUpload],
  );

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  return {
    uploadStatus,
    uploadMessage,
    fileInputRef,
    handleFileUpload,
    handleDrop,
    handleDragOver,
  };
};
