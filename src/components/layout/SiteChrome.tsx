import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function SiteHeader() {
  const { user, profile, logout, configured } = useAuth();

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">
            <strong>GoMUN</strong>
            <span>Delegate Arena</span>
          </span>
        </Link>

        <nav className="nav" aria-label="Primary">
          <NavLink to="/conferences">Conferences</NavLink>
          <NavLink to="/practice">Practice</NavLink>
          {user ? <NavLink to="/dashboard">Dashboard</NavLink> : null}
        </nav>

        <div className="header-actions">
          {!configured ? (
            <span className="setup-chip">Setup Firebase</span>
          ) : null}
          {user ? (
            <>
              <span className="user-chip">
                {profile?.displayName || 'Delegate'}
                {profile?.role ? ` · ${profile.role}` : ''}
              </span>
              <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Sign in
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Join free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div>
          <strong>GoMUN Delegate Arena</strong>
          <p>Free practice for students and teachers. Always $0.</p>
        </div>
        <p className="footer-note">
          Conference links point to organizers&apos; own sites. GoMUN does not host those
          events.
        </p>
      </div>
    </footer>
  );
}
