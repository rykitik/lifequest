import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = () => {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div>Загрузка...</div>; // Можно заменить на спиннер
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;