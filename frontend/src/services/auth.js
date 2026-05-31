export const registerUser = async (userData) => {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Registration error");
  }

  return data;
};

export const loginUser = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Login error");
  }

  return data;
};
