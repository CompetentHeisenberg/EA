import { useState, useCallback } from "react";
import { registerUser } from "../../services/auth";

const check = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const useRegister = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (!check.test(formData.password)) {
        setError(
          "Password must be at least 8 characters long and contain at least one letter and one number",
        );
        return;
      }

      setLoading(true);

      try {
        const data = await registerUser({
          email: formData.email,
          username: formData.username,
          password: formData.password,
        });

        localStorage.setItem("token", data.access_token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email);

        window.location.href = "/";
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [formData],
  );

  return {
    formData,
    error,
    loading,
    handleChange,
    handleSubmit,
  };
};
