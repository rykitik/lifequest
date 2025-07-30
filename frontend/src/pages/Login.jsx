import { useState } from "react";
import api from "../api/axios";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

export default function Login() {
  // const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [error, setError] = useState("");
  // const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await api.post('/auth/login', { email, password });
    const token = res.data.accessToken;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Вход</h2>
        {/* {error && <p className="text-red-500 text-center mb-3">{error}</p>} */}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Пароль"
            className="w-full p-2 border rounded-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
          >
            Войти
          </button>
        </form>
        <p className="text-sm text-center mt-4">
          Нет аккаунта?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Зарегистрироваться
          </a>
        </p>
      </div>
    </div>
  );
}
