import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

const resolvedBaseUrl = rawApiUrl
  ? rawApiUrl.endsWith('/api')
    ? rawApiUrl
    : `${rawApiUrl.replace(/\/+$/, '')}/api`
  : '/api';

let accessToken = localStorage.getItem('accessToken') || '';
let refreshRequest = null;
let unauthorizedHandler = null;

export const setAccessToken = (token) => {
  accessToken = token || '';

  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

const api = axios.create({
  baseURL: resolvedBaseUrl,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: resolvedBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isUnauthorized = error.response?.status === 401;
    const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');
    const isAuthMutation =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/logout');

    if (!isUnauthorized || originalRequest._retry || isRefreshRequest || isAuthMutation) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshRequest) {
        refreshRequest = refreshClient
          .post('/auth/refresh')
          .then((response) => {
            const nextToken = response.data.accessToken;

            if (!nextToken) {
              throw new Error('Refresh endpoint did not return an access token');
            }

            setAccessToken(nextToken);
            return nextToken;
          })
          .finally(() => {
            refreshRequest = null;
          });
      }

      const nextToken = await refreshRequest;
      originalRequest.headers.Authorization = `Bearer ${nextToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      setAccessToken('');

      if (unauthorizedHandler) {
        unauthorizedHandler(refreshError);
      }

      return Promise.reject(refreshError);
    }
  },
);

export default api;
