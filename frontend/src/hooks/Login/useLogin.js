import { useState, useCallback } from "react";
import { loginUser } from "../../services/auth";

export const useLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
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
      setLoading(true);
      setError("");

      try {
        const data = await loginUser(formData.email, formData.password);

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
