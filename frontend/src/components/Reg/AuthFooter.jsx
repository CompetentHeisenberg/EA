import React from "react";
import styles from "../../css/register.module.css";

export const AuthFooter = () => {
  return (
    <div className={styles.authFooter}>
      Already have an account? <a href="/login">Log In</a>
    </div>
  );
};
