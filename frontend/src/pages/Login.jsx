import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [accountStatusError, setAccountStatusError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'account_inactive') {
      setAccountStatusError('Ваш аккаунт неактивен. Обратитесь к администратору.');
    }
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setAccountStatusError("");

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate("/dashboard");
      } else if (result.message.includes('неактивна')) {
        setAccountStatusError(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Ошибка при входе в систему', err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Вход</h2>
        
        {accountStatusError && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{accountStatusError}</p>
          </div>
        )}

        {error && <p className="text-red-500 text-center mb-3">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Ваш email"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              placeholder="Ваш пароль"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 
                      transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Войти
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-gray-600">
          Нет аккаунта?{" "}
          <a 
            href="/register" 
            className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:rounded-sm"
          >
            Зарегистрироваться
          </a>
        </p>
      </div>
    </div>
  );
}