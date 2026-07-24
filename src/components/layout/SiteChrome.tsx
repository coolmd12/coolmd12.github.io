import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function SiteHeader() {
  const { user, profile, logout, configured } = useAuth();

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(16 15) rotate(-38) translate(-16 -15)">
                <rect x="14.25" y="6" width="3.5" height="16" rx="1.5" fill="#C4A35A" />
                <rect x="9" y="4" width="14" height="6" rx="2" fill="#E8D5A3" />
                <rect x="10.25" y="5.25" width="11.5" height="3.5" rx="1.25" fill="#C4A35A" />
              </g>
              <rect x="5" y="24" width="12" height="3" rx="1.25" fill="#C4A35A" opacity="0.9" />
              <rect x="7" y="22.25" width="8" height="2.25" rx="0.9" fill="#E8D5A3" />
            </svg>
          </span>
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
                  {profile?.username ? ` · @${profile.username}` : ''}
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
