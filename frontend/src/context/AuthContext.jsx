/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || '');
  const [loading, setLoading] = useState(true);

  // Обновляем заголовок Authorization
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Интерцептор для обновления токена
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;

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

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [refreshToken]);

  // Получение пользователя по токену
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/auth/me');
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } catch (error) {
        console.error('Ошибка получения пользователя:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/auth/login', { email, password });
      const { token: accessToken, refreshToken: refresh, user: receivedUser } = res.data;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(receivedUser));

      setToken(accessToken);
      setRefreshToken(refresh);
      setUser(receivedUser);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка входа';
      return { success: false, message };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await axios.post('/auth/register', { username, email, password });
      const { token: accessToken, refreshToken: refresh, user: receivedUser } = res.data;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(receivedUser));

      setToken(accessToken);
      setRefreshToken(refresh);
      setUser(receivedUser);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка регистрации';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
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
