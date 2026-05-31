import React from "react";
import styles from "../../css/register.module.css";

export const LoginForm = ({ formData, error, loading, onChange, onSubmit }) => {
  return (
    <form className={styles.authForm} onSubmit={onSubmit}>
      <div className={styles.inputGroup}>
        <label>Email Address</label>
        <input
          type="email"
          name="email"
          placeholder="name@company.com"
          value={formData.email}
          onChange={onChange}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label>Password</label>
        <input
          type="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={onChange}
          required
        />
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}

      <button type="submit" className={styles.authButton} disabled={loading}>
        {loading ? "Entering..." : "Log In"}
      </button>
    </form>
  );
};
