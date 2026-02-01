import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user } = useAuth();

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is not an admin, redirect to their appropriate dashboard
  if (user.role !== 'ADMIN') {
    if (user.role === 'VENDOR') {
      return <Navigate to="/erp" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // User is an admin, allow access
  return children;
}
