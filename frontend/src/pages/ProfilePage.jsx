import React from "react";
import { useAuth } from "../hooks/Profile/useAuth";
import { useProfileSettings } from "../hooks/Profile/useProfileSettings";
import { useSecurity } from "../hooks/Profile/useSecurity";
import { useProfileHistory } from "../hooks/Profile/useProfileHistory";
import { ProfileHeader } from "../components/Profile/ProfileHeader";
import { AccountSection } from "../components/Profile/AccountSection";
import { SettingsSection } from "../components/Profile/SettingsSection";
import { SecuritySection } from "../components/Profile/SecuritySection";
import { HistorySection } from "../components/Profile/HistorySection";
import styles from "../css/profile.module.css";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const {
    settings,
    loadingSettings,
    savingSettings,
    settingsSaved,
    updateSettingField,
    saveSettings,
  } = useProfileSettings();

  const { passwords, pwdStatus, updatePasswordState, submitPasswordChange } =
    useSecurity();

  const { history, loadingHistory, openId, results, loadingId, handleToggle } =
    useProfileHistory();

  return (
    <div className={styles.pageContainer}>
      <ProfileHeader onLogout={logout} />

      <div className={styles.pageBody}>
        <div className={styles.topRow}>
          <AccountSection user={user} />

          <SettingsSection
            settings={settings}
            loadingSettings={loadingSettings}
            savingSettings={savingSettings}
            settingsSaved={settingsSaved}
            updateSettingField={updateSettingField}
            saveSettings={saveSettings}
          />
        </div>

        <SecuritySection
          passwords={passwords}
          pwdStatus={pwdStatus}
          updatePasswordState={updatePasswordState}
          submitPasswordChange={submitPasswordChange}
        />

        <HistorySection
          history={history}
          loadingHistory={loadingHistory}
          openId={openId}
          results={results}
          loadingId={loadingId}
          handleToggle={handleToggle}
        />
      </div>
    </div>
  );
}
