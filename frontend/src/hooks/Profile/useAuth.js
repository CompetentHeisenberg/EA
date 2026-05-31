import { useMemo, useCallback } from "react";

export const useAuth = () => {
  const user = useMemo(
    () => ({
      username: localStorage.getItem("username") || "—",
      email: localStorage.getItem("email") || "—",
    }),
    [],
  );

  const logout = useCallback(() => {
    localStorage.clear();
    window.location.href = "/login";
  }, []);

  return { user, logout };
};
