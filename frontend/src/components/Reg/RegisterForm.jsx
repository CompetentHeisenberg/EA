import React from "react";
import styles from "../../css/register.module.css";

export const RegisterForm = ({
  formData,
  error,
  loading,
  onChange,
  onSubmit,
}) => {
  return (
    <form className={styles.authForm} onSubmit={onSubmit}>
      <div className={styles.inputGroup}>
        <label>Username</label>
        <input
          type="text"
          name="username"
          placeholder="Enter your name"
          value={formData.username}
          onChange={onChange}
          required
        />
      </div>

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

      <div className={styles.inputGroup}>
        <label>Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={onChange}
          required
        />
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}

      <button type="submit" className={styles.authButton} disabled={loading}>
        {loading ? "Creating..." : "Sign Up"}
      </button>
    </form>
  );
};
