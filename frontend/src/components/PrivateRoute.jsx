import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { user, loading } = useAuth(); // Используем хук вместо useContext

  if (loading) {
    return <div>Загрузка...</div>; // Лоадер во время проверки авторизации
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;