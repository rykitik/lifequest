import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { AuthContext } from './AuthContext';

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => {
    const token = localStorage.getItem("accessToken");
    return token && token !== "undefined" ? token : "";
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Конфигурация axios
  useEffect(() => {
    if (accessToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [accessToken]);

  const logout = useCallback(async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.warn("Ошибка при выходе:", err);
    } finally {
      setUser(null);
      setAccessToken("");
      localStorage.removeItem("accessToken");
      setError(null);
    }
  }, []);

  const tryRefreshToken = useCallback(async () => {
    try {
      const { data } = await axios.post("/auth/refresh", {}, { 
        withCredentials: true 
      });

      if (!data.accessToken) {
        throw new Error("Токен не получен в ответе");
      }

      setAccessToken(data.accessToken);
      localStorage.setItem("accessToken", data.accessToken);
      return data.accessToken;
    } catch (err) {
      console.error("Ошибка обновления токена:", err);
      await logout();
      throw err;
    }
  }, [logout]);

  const fetchUser = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return null;
    }

    try {
      const { data } = await axios.get("/auth/me");
      
      if (!data?.id) {
        throw new Error("Неверный формат данных пользователя");
      }

      const userData = {
        id: data.id,
        username: data.username || "",
        email: data.email || "",
        xp: data.xp || 0,
        level: data.level || 1,
        ...(data.progress && { progress: data.progress }),
      };

      setUser(userData);
      setError(null);
      return userData;
    } catch (err) {
      if (err.response?.status === 401) {
        try {
          await tryRefreshToken();
          return await fetchUser();
        } catch {
          return null;
        }
      }

      setError(
        err.response?.data?.message || 
        err.message || 
        "Ошибка загрузки данных пользователя"
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [accessToken, tryRefreshToken]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        if (!error.config || error.config._retry) {
          return Promise.reject(error);
        }

        if (error.response?.status === 401) {
          try {
            const newToken = await tryRefreshToken();
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return axios(error.config);
          } catch {
            return Promise.reject(error);
          }
        }

        setError(
          error.response?.data?.message || 
          error.message || 
          "Ошибка сети"
        );
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [tryRefreshToken]);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        if (accessToken) {
          await fetchUser();
        }
      } catch (err) {
        if (isMounted) {
          console.error("Ошибка инициализации:", err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [accessToken, fetchUser]);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await axios.post("/auth/login", 
        { email, password },
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const receivedToken = data.accessToken || data.token;
      if (!receivedToken) {
        throw new Error("Токен не получен");
      }

      const userData = data.user || {
        id: data.id,
        email: data.email,
        username: data.username,
        xp: data.xp,
        level: data.level
      };

      setAccessToken(receivedToken);
      localStorage.setItem("accessToken", receivedToken);
      setUser(userData);
      setError(null);

      return { success: true, user: userData, accessToken: receivedToken };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         "Ошибка входа";

      if (err.response?.status === 401) {
        await logout();
      }

      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [logout]);

  const register = useCallback(async (email, password, username) => {
    try {
      const { data } = await axios.post(
        "/auth/register", 
        { email, password, username },
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      setAccessToken(data.accessToken);
      localStorage.setItem("accessToken", data.accessToken);
      setUser(data.user);
      setError(null);

      return { success: true, user: data.user };
    } catch (err) {
      const message = err.response?.data?.message || "Ошибка регистрации";
      setError(message);
      return { success: false, message };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        setError
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;