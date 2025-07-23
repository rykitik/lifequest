import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const navigate = useNavigate();

  // Загружаем данные пользователя при монтировании
  useEffect(() => {
    if (token && localStorage.getItem("user")) {
      try {
        setUser(JSON.parse(localStorage.getItem("user")));
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
      }
    }
  }, [token]);

  // Функция логина
  const login = (userData, tokenData) => {
    localStorage.setItem("token", tokenData);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setToken(tokenData);
  };

  // Функция выхода
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
