import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext'; // Добавьте этот импорт

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider> {/* Оберните App в AuthProvider */}
      <App />
    </AuthProvider>
  </StrictMode>
);