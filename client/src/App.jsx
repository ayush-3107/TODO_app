import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import TodoListsPage from './pages/TodoListsPage';
import { ProfilePage } from './components/Profile';

// Mock user data for profile page
const mockUser = {
  username: 'Demo User',
  email: 'demo@example.com',
  id: 1
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/todos" element={<TodoListsPage />} />
      
      {/* Simple profile route for testing */}
      <Route 
        path="/profile" 
        element={
          <ProfilePage 
            user={mockUser}
            onClose={() => window.history.back()} // Go back when closed
            onChangePassword={(old, newPass) => alert('Password changed!')}
            onLogout={() => alert('Logged out!')}
          />
        } 
      />
      
      {/* Default route */}
      <Route path="/" element={<LoginPage />} />
    </Routes>
  );
}
