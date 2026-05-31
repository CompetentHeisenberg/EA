import React from "react";
import { useRegister } from "../hooks/Registration/useRegister";
import { RegisterForm } from "../components/Reg/RegisterForm";
import { AuthHeader } from "../components/Reg/AuthHeader";
import { AuthFooter } from "../components/Reg/AuthFooter";
import DataParticlesBg from "../components/Reg/DataParticlesBg";
import styles from "../css/register.module.css";

export default function RegisterPage() {
  const { formData, error, loading, handleChange, handleSubmit } =
    useRegister();

  return (
    <div className={styles.authContainer}>
      <DataParticlesBg />
      <div className={styles.authCard}>
        <AuthHeader />

        <RegisterForm
          formData={formData}
          error={error}
          loading={loading}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />

        <AuthFooter />
      </div>
    </div>
  );
}
