const API = import.meta.env.VITE_API_URL || "";

export function getToken() {
  return localStorage.getItem("token");
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("email");
  window.location.href = "/login";
}

async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API}${url}`, { ...options, headers });

  if (response.status === 401) {
    logout();
    throw new Error("Session expired, please log in again");
  }

  return response;
}

export const fetchFinancialData = async () => {
  const response = await fetch("/api/financial");
  if (!response.ok) return [];
  return response.json();
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await authFetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "File upload error");
  }

  return response.json();
};

export const fetchCorrelationMatrix = async (data) => {
  const response = await authFetch("/api/analysis/correlation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Correlation analysis error");
  }

  return response.json();
};

export const fetchPCAAnalysis = async (data, nClusters = 3) => {
  const response = await authFetch("/api/analysis/pca", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, n_clusters: nClusters }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "PCA analysis error");
  }

  return response.json();
};

export const fetchHistory = async () => {
  const response = await authFetch("/api/history");
  if (!response.ok) throw new Error("Error loading history");
  return response.json();
};

export const fetchSettings = async () => {
  const response = await authFetch("/api/settings");
  if (!response.ok) throw new Error("Error loading settings");
  return response.json();
};

export const updateSettings = async (settings) => {
  const response = await authFetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!response.ok) throw new Error("Error saving settings");
  return response.json();
};

export const fetchHistoryResult = async (sessionId) => {
  const response = await authFetch(`/api/history/${sessionId}`);
  if (!response.ok) throw new Error("Results not found");
  return response.json();
};

export const fetchNewsFeed = async () => {
  const response = await fetch("/api/news/feed");
  if (!response.ok) throw new Error("Error loading news feed");
  return response.json();
};

export const extractArticleText = async (url) => {
  const response = await fetch("/api/news/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) throw new Error("Error extracting article");
  return response.json();
};

export const fetchTrendingData = async () => {
  const response = await fetch("/api/trending");
  if (!response.ok) throw new Error("Error loading trending data");
  return response.json();
};

export const fetchMarkets = async () => {
  const response = await fetch("api/markets");
  if (!response.ok) throw new Error("Network error");
  return response.json();
};
