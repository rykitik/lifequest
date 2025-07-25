/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem("accessToken") || null;
  });

  const [refreshToken, setRefreshToken] = useState(() => {
    return localStorage.getItem("refreshToken") || null;
  });

  const [loading, setLoading] = useState(true);

  // Устанавливаем accessToken в заголовках axios
  useEffect(() => {
    if (accessToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [accessToken]);

  // Получение пользователя по токену
  useEffect(() => {
    const fetchUser = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("/auth/me");
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      } catch (error) {
        console.error("Ошибка получения пользователя:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [accessToken]);

  // Интерцептор для обновления токена при 401
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          refreshToken
        ) {
          originalRequest._retry = true;
          try {
            const res = await axios.post("/auth/refresh", { refreshToken });
            const { accessToken: newAccessToken } = res.data;

            setAccessToken(newAccessToken);
            localStorage.setItem("accessToken", newAccessToken);
            axios.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

            originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [refreshToken]);

  const login = async (email, password) => {
    try {
       console.log("Попытка входа:", { email, password }); // TODO: убрать
      const res = await axios.post("/auth/login", { email, password });
      const { user: loggedUser, accessToken: at, refreshToken: rt } = res.data;
      console.log("Ответ сервера:", res.data);

      setUser(loggedUser);
      setAccessToken(at);
      setRefreshToken(rt);
      localStorage.setItem("user", JSON.stringify(loggedUser));
      localStorage.setItem("accessToken", at);
      localStorage.setItem("refreshToken", rt);

      axios.defaults.headers.common["Authorization"] = `Bearer ${at}`;

      return { success: true };
    } catch (err) {
      console.error("Ошибка логина:", err.response?.data || err.message); // TODO: убрать
      const message = err.response?.data?.message || "Ошибка входа";
      return { success: false, message };
    }
  };

  const register = async (email, password) => {
    try {
      const res = await axios.post("/auth/register", { email, password });
      const { user: registeredUser, accessToken: at, refreshToken: rt } = res.data;

      setUser(registeredUser);
      setAccessToken(at);
      setRefreshToken(rt);
      localStorage.setItem("user", JSON.stringify(registeredUser));
      localStorage.setItem("accessToken", at);
      localStorage.setItem("refreshToken", rt);

      axios.defaults.headers.common["Authorization"] = `Bearer ${at}`;

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Ошибка регистрации";
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, refreshToken, login, register, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
