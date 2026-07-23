import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { needsProfileSetup } from '../types';

export function ProtectedRoute() {
  const { user, profile, loading, configured } = useAuth();
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

  if (!profile) {
    return (
      <div className="shell page-loading">
        <p>Loading your profile…</p>
      </div>
    );
  }

  if (needsProfileSetup(profile) && location.pathname !== '/welcome') {
    return <Navigate to="/welcome" replace />;
  }

  return <Outlet />;
}
