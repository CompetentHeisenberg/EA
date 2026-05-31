import React from "react";
import styles from "../../css/register.module.css";

export const LoginFooter = () => {
  return (
    <div className={styles.authFooter}>
      Don't have an account? <a href="/register">Sign Up</a>
    </div>
  );
};
