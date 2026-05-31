import { useState, useCallback } from "react";
import { registerUser } from "../../services/auth";

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

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long");
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
