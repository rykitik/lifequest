/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "../api/axios";

const AuthContext = createContext();

/**
 * Хук для доступа к контексту авторизации
 */
export const useAuth = () => useContext(AuthContext);

/**
 * Провайдер авторизации
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem("accessToken") || "");
  const [loading, setLoading] = useState(true);

  // Получение текущего пользователя
  const fetchUser = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setUser(res.data);
    } catch (err) {
      console.warn("Сессия истекла, попытка обновления токена...", err);
      await tryRefreshToken();
    } finally {
      setLoading(false);
    }
  };

  // Попытка обновления accessToken
  const tryRefreshToken = async () => {
    try {
      const res = await axios.post("/auth/refresh", {}, { withCredentials: true });
      const newAccessToken = res.data.accessToken;
      setAccessToken(newAccessToken);
      localStorage.setItem("accessToken", newAccessToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
      await fetchUser();
    } catch (err) {
      console.error("Не удалось обновить токен:", err);
      logout();
    }
  };

  // Axios интерцептор
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await tryRefreshToken();
            originalRequest.headers["Authorization"] = `Bearer ${localStorage.getItem("accessToken")}`;
            return axios(originalRequest);
          } catch (refreshErr) {
            return Promise.reject(refreshErr);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // Автовосстановление сессии
  useEffect(() => {
    fetchUser();
  }, []);

  // Функция логина
  const login = async (email, password) => {
    try {
      const res = await axios.post("/auth/login", { email, password }, { withCredentials: true });
      const { accessToken, user } = res.data;

      setAccessToken(accessToken);
      localStorage.setItem("accessToken", accessToken);
      setUser(user);
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      return { success: true };
    } catch (err) {
      console.error("Ошибка при входе:", err.response?.data?.message || err.message);
      return { success: false, message: err.response?.data?.message || "Ошибка входа" };
    }
  };

  // Функция регистрации
  const register = async (email, password, username) => {
    try {
      const res = await axios.post("/auth/register", { email, password, username }, { withCredentials: true });
      const { accessToken, user } = res.data;

      setAccessToken(accessToken);
      localStorage.setItem("accessToken", accessToken);
      setUser(user);
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      return { success: true };
    } catch (err) {
      console.error("Ошибка при регистрации:", err.response?.data?.message || err.message);
      return { success: false, message: err.response?.data?.message || "Ошибка регистрации" };
    }
  };

  // Функция выхода
  const logout = async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.warn("Ошибка при выходе:", err.message);
    }

    setUser(null);
    setAccessToken("");
    localStorage.removeItem("accessToken");
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
