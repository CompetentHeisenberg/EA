import React from "react";
import styles from "../../css/profile.module.css";

export const SecuritySection = ({
  passwords,
  pwdStatus,
  updatePasswordState,
  submitPasswordChange,
}) => {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNum}>03</span>
        <h2 className={styles.sectionTitle}>Security</h2>
      </div>
      <form
        onSubmit={submitPasswordChange}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "400px",
        }}
      >
        <div className={styles.settingRow} style={{ marginBottom: "0" }}>
          <label className={styles.settingLabel}>Current Password</label>
          <input
            type="password"
            className={styles.inputField}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              marginTop: "8px",
            }}
            value={passwords.current}
            onChange={(e) => updatePasswordState("current", e.target.value)}
            required
          />
        </div>
        <div className={styles.settingRow} style={{ marginBottom: "0" }}>
          <label className={styles.settingLabel}>New Password</label>
          <input
            type="password"
            className={styles.inputField}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              marginTop: "8px",
            }}
            value={passwords.new}
            onChange={(e) => updatePasswordState("new", e.target.value)}
            required
          />
        </div>
        <div className={styles.settingRow} style={{ marginBottom: "0" }}>
          <label className={styles.settingLabel}>Confirm New Password</label>
          <input
            type="password"
            className={styles.inputField}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              marginTop: "8px",
            }}
            value={passwords.confirm}
            onChange={(e) => updatePasswordState("confirm", e.target.value)}
            required
          />
        </div>

        {pwdStatus.error && (
          <div style={{ color: "#d90429", fontSize: "14px", marginTop: "4px" }}>
            {pwdStatus.error}
          </div>
        )}

        <button
          type="submit"
          className={styles.saveBtn}
          disabled={pwdStatus.loading}
          style={{ alignSelf: "flex-start", marginTop: "8px" }}
        >
          {pwdStatus.loading ? (
            <>
              <div className={styles.btnSpinner} />
              Updating...
            </>
          ) : pwdStatus.success ? (
            "✓ Password Updated"
          ) : (
            "Change Password"
          )}
        </button>
      </form>
    </div>
  );
};
