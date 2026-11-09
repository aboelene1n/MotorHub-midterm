import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("motorhub_token");

    if (!token) {
      setLoading(false);
      return;
    }

    api.get("/auth/profile")
      .then((response) => setUser(response.data.user || response.data))
      .catch(() => {
        localStorage.removeItem("motorhub_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    localStorage.setItem("motorhub_token", response.data.token);
    setUser(response.data.user || response.data);

    return response.data;
  };

  const register = async (userData) => {
    const response = await api.post("/auth/register", userData);

    localStorage.setItem("motorhub_token", response.data.token);
    setUser(response.data.user || response.data);

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("motorhub_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}