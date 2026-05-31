export const fetchCorrelationAnalysis = async ({
  fileId,
  columns,
  fileName,
  method,
  handleOutliers,
  token,
}) => {
  const response = await fetch("/api/analysis/correlation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      file_id: fileId,
      columns,
      file_name: fileName || "Unknown file",
      method,
      handle_outliers: handleOutliers,
    }),
  });

  if (response.status === 401) {
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Analysis Error");
  }

  return response.json();
};
