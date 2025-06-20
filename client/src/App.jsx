import { AuthProvider } from './contexts/AuthContext.jsx';
import AppRoutes from './components/AppRoutes.jsx';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
