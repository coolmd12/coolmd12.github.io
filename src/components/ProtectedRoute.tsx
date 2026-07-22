import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
  const { user, loading, configured } = useAuth();
  const location = useLocation();

  if (!configured) {
    return <Navigate to="/setup" replace state={{ from: location.pathname }} />;
  }

  if (loading) {
    return (
      <div className="shell page-loading">
        <p>Preparing your delegation credentials…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
