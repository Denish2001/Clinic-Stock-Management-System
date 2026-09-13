import { Navigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/stock" replace />;
  return <LoginForm />;
}
