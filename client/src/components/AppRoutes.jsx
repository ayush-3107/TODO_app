import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../pages/LoginPage';
import TodoListsPage from '../pages/TodoListsPage';
import LoadingSpinner from './UI/LoadingSpinner';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/todos" replace /> : <LoginPage />} 
      />
      <Route 
        path="/todos" 
        element={user ? <TodoListsPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={user ? "/todos" : "/login"} replace />} 
      />
      <Route 
        path="*" 
        element={<Navigate to={user ? "/todos" : "/login"} replace />} 
      />
    </Routes>
  );
};

export default AppRoutes;
