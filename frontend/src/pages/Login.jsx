import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');

    const result = await login(identifier, password);

    if (result.success) {
      navigate('/dashboard');
      return;
    }

    setError(result.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-4 text-center text-2xl font-bold">Вход</h2>

        {error && <p className="mb-3 text-center text-red-500">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="mb-1 block text-sm font-medium text-gray-700">
              Email или username
            </label>
            <input
              id="identifier"
              type="text"
              placeholder="Ваш email или username"
              className="w-full rounded-md border p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              placeholder="Ваш пароль"
              className="w-full rounded-md border p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 p-2 text-white transition duration-200 hover:bg-blue-700"
          >
            Войти
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
