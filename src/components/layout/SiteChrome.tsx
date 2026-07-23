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
          <NavLink to="/" end>
            Home
          </NavLink>
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
              <Link to="/profile" className="user-chip user-chip-link" title="Edit profile">
                <span className="avatar avatar-sm" aria-hidden="true">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" />
                  ) : (
                    <span>
                      {(profile?.displayName || 'D')
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase() || '')
                        .join('') || '?'}
                    </span>
                  )}
                </span>
                <span>
                  {profile?.displayName || 'Delegate'}
                  {profile?.role ? ` · ${profile.role}` : ''}
                </span>
              </Link>
              <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Log in
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Sign up
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
          <p className="footer-meta">Founded by Dhyanvi Mehta</p>
        </div>
        <p className="footer-note">
          Conference links point to organizers&apos; own sites. GoMUN does not host those
          events.
        </p>
      </div>
    </footer>
  );
}
