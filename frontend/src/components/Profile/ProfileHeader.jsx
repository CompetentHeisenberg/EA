import React from "react";
import styles from "../../css/profile.module.css";

export const ProfileHeader = ({ onLogout }) => {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderInner}>
        <div>
          <h1 className={styles.pageTitle}>User Profile</h1>
          <p className={styles.pageDesc}>
            Personal Data · Settings · Security · Analysis History
          </p>
        </div>
        <button className={styles.logoutBtn} onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};
