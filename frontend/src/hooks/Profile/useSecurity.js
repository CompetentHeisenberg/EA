import { useState, useCallback } from "react";
import { changePassword } from "../../services/api";

export const useSecurity = () => {
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [pwdStatus, setPwdStatus] = useState({
    loading: false,
    error: "",
    success: false,
  });

  const updatePasswordState = useCallback((field, value) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  }, []);

  const submitPasswordChange = useCallback(
    async (e) => {
      e.preventDefault();
      if (passwords.new !== passwords.confirm) {
        setPwdStatus({
          loading: false,
          error: "New passwords do not match",
          success: false,
        });
        return;
      }
      setPwdStatus({ loading: true, error: "", success: false });
      try {
        await changePassword({
          current_password: passwords.current,
          new_password: passwords.new,
        });
        setPwdStatus({ loading: false, error: "", success: true });
        setPasswords({ current: "", new: "", confirm: "" });
        setTimeout(
          () => setPwdStatus((prev) => ({ ...prev, success: false })),
          3000,
        );
      } catch (err) {
        setPwdStatus({
          loading: false,
          error: err.response?.data?.detail || "Failed to change password",
          success: false,
        });
      }
    },
    [passwords],
  );

  return {
    passwords,
    pwdStatus,
    updatePasswordState,
    submitPasswordChange,
  };
};
