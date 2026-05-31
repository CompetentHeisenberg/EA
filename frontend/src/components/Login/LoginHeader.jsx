import React from "react";
import styles from "../../css/register.module.css";

export const LoginHeader = () => {
  return (
    <div className={styles.authHeader}>
      <h2>Welcome Back</h2>
      <p>Sign in to your financial dashboard</p>
    </div>
  );
};
