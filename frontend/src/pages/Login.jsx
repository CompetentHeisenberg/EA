import React from "react";
import { useLogin } from "../hooks/Login/useLogin";
import { LoginForm } from "../components/Login/LoginForm";
import { LoginHeader } from "../components/Login/LoginHeader";
import { LoginFooter } from "../components/Login/LoginFooter";
import DataParticlesBg from "../components/Reg/DataParticlesBg";
import styles from "../css/register.module.css";

export default function LoginPage() {
  const { formData, error, loading, handleChange, handleSubmit } = useLogin();

  return (
    <div className={styles.authContainer}>
      <DataParticlesBg />
      <div className={styles.authCard}>
        <LoginHeader />

        <LoginForm
          formData={formData}
          error={error}
          loading={loading}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />

        <LoginFooter />
      </div>
    </div>
  );
}
