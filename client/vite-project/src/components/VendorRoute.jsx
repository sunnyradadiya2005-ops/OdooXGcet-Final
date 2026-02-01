import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VendorRoute({ children }) {
  const { user } = useAuth();

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is not a vendor, redirect to their appropriate dashboard
  if (user.role !== 'VENDOR') {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // User is a vendor, allow access
  return children;
}
