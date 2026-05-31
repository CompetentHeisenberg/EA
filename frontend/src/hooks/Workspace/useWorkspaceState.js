import { useState, useEffect, useCallback } from "react";
import { fetchSettings } from "../../services/api";

export const useWorkspaceState = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [fileId, setFileId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [numericCols, setNumericCols] = useState([]);
  const [fileName, setFileName] = useState("");
  const [userSettings, setUserSettings] = useState(null);

  useEffect(() => {
    fetchSettings()
      .then((data) => setUserSettings(data))
      .catch(console.error);
  }, []);

  const setDatasetData = useCallback((id, name, allCols, numCols) => {
    setFileId(id);
    setFileName(name);
    setColumns(allCols);
    setNumericCols(numCols);
  }, []);

  return {
    activeTab,
    setActiveTab,
    fileId,
    columns,
    numericCols,
    fileName,
    userSettings,
    setDatasetData,
  };
};
