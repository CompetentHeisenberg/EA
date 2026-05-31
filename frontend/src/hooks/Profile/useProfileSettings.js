import { useState, useEffect, useCallback } from "react";
import { fetchSettings, updateSettings } from "../../services/api";

export const useProfileSettings = () => {
  const [settings, setSettings] = useState({
    default_clusters: 3,
    preferred_pca_axes: "PC1,PC2",
    correlation_method: "pearson",
    outlier_treatment: "none",
    theme: "light",
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((data) => setSettings((prev) => ({ ...prev, ...data })))
      .catch(console.error)
      .finally(() => setLoadingSettings(false));
  }, []);

  const updateSettingField = useCallback((field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }, []);

  const saveSettings = useCallback(async () => {
    setSavingSettings(true);
    try {
      await updateSettings(settings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  }, [settings]);

  return {
    settings,
    loadingSettings,
    savingSettings,
    settingsSaved,
    updateSettingField,
    saveSettings,
  };
};
