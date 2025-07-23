import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newQuest, setNewQuest] = useState("");
  // const navigate = useNavigate();

  const fetchQuests = async () => {
    try {
      const res = await api.get("/quests");
      setQuests(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка загрузки квестов");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuest = async (e) => {
    e.preventDefault();
    if (!newQuest.trim()) return;
    try {
      const res = await api.post("/quests", { title: newQuest, type: "daily" });
      setQuests((prev) => [...prev, res.data]);
      setNewQuest("");
    } catch (err) {
      setError("Не удалось создать квест", err);
    }
  };

  const handleCompleteQuest = async (id) => {
    try {
      await api.patch(`/quests/${id}/complete`);
      setQuests((prev) =>
        prev.map((q) => (q._id === id ? { ...q, completed: true } : q))
      );
    } catch (err) {
      setError("Не удалось завершить квест", err);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  if (loading) return <p className="text-center mt-10">Загрузка...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Привет, {user?.username || "Гость"}</h2>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Выйти
          </button>
        </div>

        <form onSubmit={handleAddQuest} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Название квеста"
            value={newQuest}
            onChange={(e) => setNewQuest(e.target.value)}
            className="flex-1 border p-2 rounded-md"
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            +
          </button>
        </form>

        {quests.length === 0 ? (
          <p className="text-gray-500 text-center">Квестов нет</p>
        ) : (
          <ul className="space-y-2">
            {quests.map((quest) => (
              <li
                key={quest._id}
                className="flex justify-between items-center p-2 border rounded-md"
              >
                <span className={quest.completed ? "line-through text-gray-500" : ""}>
                  {quest.title}
                </span>
                {!quest.completed && (
                  <button
                    onClick={() => handleCompleteQuest(quest._id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Завершить
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
