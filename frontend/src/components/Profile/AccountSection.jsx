import React from "react";
import styles from "../../css/profile.module.css";

export const AccountSection = ({ user }) => {
  return (
    <div className={`${styles.section} ${styles.userCard}`}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionNum}>01</span>
        <h2 className={styles.sectionTitle}>Account</h2>
      </div>
      <div className={styles.avatar}>
        {user.username.charAt(0).toUpperCase()}
      </div>
      <div className={styles.userInfo}>
        <div className={styles.userInfoRow}>
          <span className={styles.userInfoLabel}>Username</span>
          <span className={styles.userInfoValue}>{user.username}</span>
        </div>
        <div className={styles.userInfoRow}>
          <span className={styles.userInfoLabel}>Email</span>
          <span className={styles.userInfoValue}>{user.email}</span>
        </div>
      </div>
    </div>
  );
};
