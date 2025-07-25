/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from '../api/axios';

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
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Попытка восстановить сессию по токену
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch {
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
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      console.error('Ошибка при входе:', err.response?.data?.message || err.message);
      return { success: false, message: err.response?.data?.message || 'Ошибка входа' };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await axios.post('/auth/register', { username, email, password });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      return { success: true };
    } catch (err) {
      console.error('Ошибка при регистрации:', err.response?.data?.message || err.message);
      return { success: false, message: err.response?.data?.message || 'Ошибка регистрации' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
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
