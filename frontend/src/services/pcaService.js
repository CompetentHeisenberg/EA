export const fetchPcaAnalysis = async ({
  fileId,
  columns,
  labelCol,
  nClusters,
  token,
}) => {
  const response = await fetch("/api/analysis/pca", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      file_id: fileId,
      columns,
      label_column: labelCol || null,
      n_clusters: nClusters,
    }),
  });

  if (response.status === 401) {
    throw new Error("Authorization expired.");
  }

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Analysis error");
  }

  return response.json();
};
