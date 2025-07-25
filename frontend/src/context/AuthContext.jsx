/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || '');
  const [loading, setLoading] = useState(true);

  // Обновляем заголовок Authorization для axios при изменении токена
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Интерцептор для обработки 401 и автоматического обновления токена
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;

        // Если 401 и запрос еще не ретраился, и есть refreshToken — пробуем обновить
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          refreshToken
        ) {
          originalRequest._retry = true;
          try {
            const res = await axios.post('/auth/refresh', { refreshToken });
            const newToken = res.data.token;

            localStorage.setItem('token', newToken);
            setToken(newToken);

            // Обновляем заголовки для повторного запроса
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

            return axios(originalRequest);
          } catch (refreshError) {
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, [refreshToken]);

  // Попытка получить данные пользователя по текущему токену
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/auth/me');
        setUser(res.data);
      } catch (error) {
        console.error('Ошибка получения пользователя:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  // Функция логина
  const login = async (email, password) => {
    try {
      const res = await axios.post('/auth/login', { email, password });
      const { token: accessToken, refreshToken: refresh, user: receivedUser } = res.data;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refresh);
      setToken(accessToken);
      setRefreshToken(refresh);
      setUser(receivedUser);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка входа';
      return { success: false, message };
    }
  };

  // Функция регистрации
  const register = async (username, email, password) => {
    try {
      const res = await axios.post('/auth/register', { username, email, password });
      const { token: accessToken, refreshToken: refresh, user: receivedUser } = res.data;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refresh);
      setToken(accessToken);
      setRefreshToken(refresh);
      setUser(receivedUser);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка регистрации';
      return { success: false, message };
    }
  };

  // Выход из аккаунта
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken('');
    setRefreshToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        loading,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
