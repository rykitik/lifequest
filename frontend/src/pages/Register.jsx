import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');

    const result = await register(username, email, password);

    if (result.success) {
      navigate('/dashboard');
      return;
    }

    setError(result.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-4 text-center text-2xl font-bold">Регистрация</h2>

        {error && <p className="mb-3 text-center text-red-500">{error}</p>}

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Имя пользователя"
            className="w-full rounded-md border p-2"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-md border p-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            className="w-full rounded-md border p-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full rounded-md bg-green-600 p-2 text-white hover:bg-green-700"
          >
            Зарегистрироваться
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
