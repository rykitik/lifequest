import { createContext, useContext } from 'react';

export const AuthContext = createContext();

// Экспортируем хук
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};