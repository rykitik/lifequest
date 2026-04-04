import { useCallback, useEffect, useState } from 'react';
import api, { setAccessToken, setUnauthorizedHandler } from '../api/axios';
import { AuthContext } from './AuthContext';

const normalizeUser = (payload) => {
  const user = payload?.user ?? payload;

  if (!user?.id) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    xp: user.xp ?? 0,
    level: user.level ?? 1,
    status: user.status ?? 'active',
  };
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const clearSession = useCallback(() => {
    setAccessToken('');
    setUser(null);
    setError('');
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    const nextUser = normalizeUser(data);

    if (!nextUser) {
      throw new Error('Invalid /auth/me response');
    }

    setUser(nextUser);
    return nextUser;
  }, []);

  const hydrateSession = useCallback(async () => {
    const { data } = await api.post('/auth/refresh');

    if (!data?.accessToken) {
      throw new Error('Invalid /auth/refresh response');
    }

    setAccessToken(data.accessToken);
    return fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (logoutError) {
      console.warn('Logout request failed:', logoutError);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const login = useCallback(async (identifier, password) => {
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      const nextUser = normalizeUser(data);

      if (!data?.accessToken || !nextUser) {
        throw new Error('Invalid login response');
      }

      setAccessToken(data.accessToken);
      setUser(nextUser);
      setError('');

      return { success: true, user: nextUser };
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Login failed';
      clearSession();
      setError(message);

      return { success: false, message };
    }
  }, [clearSession]);

  const register = useCallback(async (username, email, password) => {
    try {
      const { data } = await api.post('/auth/register', { username, email, password });
      const nextUser = normalizeUser(data);

      if (!data?.accessToken || !nextUser) {
        throw new Error('Invalid register response');
      }

      setAccessToken(data.accessToken);
      setUser(nextUser);
      setError('');

      return { success: true, user: nextUser };
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Registration failed';
      clearSession();
      setError(message);

      return { success: false, message };
    }
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [clearSession]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        if (localStorage.getItem('accessToken')) {
          await fetchCurrentUser();
        } else {
          await hydrateSession();
        }
      } catch (initialError) {
        try {
          await hydrateSession();
        } catch {
          if (isMounted) {
            clearSession();
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [clearSession, fetchCurrentUser, hydrateSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user),
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
