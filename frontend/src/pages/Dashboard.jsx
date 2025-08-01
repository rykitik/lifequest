import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newQuest, setNewQuest] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchQuests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/quests");
      setQuests(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Ошибка загрузки квестов");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuest = async (e) => {
    e.preventDefault();
    if (!newQuest.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/quests", { title: newQuest.trim(), type: "daily" });
      setQuests((prev) => [...prev, res.data]);
      setNewQuest("");
    } catch (err) {
      setError(err.response?.data?.message || "Не удалось создать квест");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteQuest = async (id) => {
    setError("");
    try {
      await api.patch(`/quests/${id}/complete`);
      setQuests((prev) =>
        prev.map((q) => (q._id === id ? { ...q, completed: true } : q))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Не удалось завершить квест");
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white p-6 flex flex-col items-center">
      <div className="max-w-3xl w-full bg-white p-8 rounded-xl shadow-lg">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-indigo-700">
            Привет, {user?.username || "Гость"}!
          </h1>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
            aria-label="Выйти из аккаунта"
          >
            Выйти
          </button>
        </header>

        <form onSubmit={handleAddQuest} className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Введите название квеста..."
            value={newQuest}
            onChange={(e) => setNewQuest(e.target.value)}
            className="flex-grow border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? "Добавляем..." : "Добавить"}
          </button>
        </form>

        {loading && (
          <p className="text-center text-gray-600">Загрузка квестов...</p>
        )}

        {error && (
          <p className="text-center text-red-600 mb-4 font-medium">{error}</p>
        )}

        {!loading && quests.length === 0 && !error && (
          <p className="text-center text-gray-500">Квестов пока нет. Создайте первый!</p>
        )}

        <ul className="space-y-3">
          {quests.map(({ _id, title, completed }) => (
            <li
              key={_id}
              className="flex justify-between items-center p-4 bg-indigo-50 rounded-lg shadow-sm hover:shadow-md transition"
            >
              <span
                className={`text-lg font-semibold ${
                  completed ? "line-through text-gray-400" : "text-indigo-800"
                }`}
              >
                {title}
              </span>
              {!completed && (
                <button
                  onClick={() => handleCompleteQuest(_id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded transition"
                  aria-label={`Завершить квест ${title}`}
                >
                  Завершить
                </button>
              )}
              {completed && (
                <span className="text-green-600 font-semibold">✓ Выполнено</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
