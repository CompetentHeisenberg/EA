export const uploadDataset = async (file, token) => {
  const formData = new FormData();
  formData.append("file", file);

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

  return result;
};
