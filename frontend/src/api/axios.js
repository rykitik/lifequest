import axios from "axios";

// Создаем инстанс
const api = axios.create({
  baseURL: "/api", // Все запросы будут идти от /api
});

// Interceptor для добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
