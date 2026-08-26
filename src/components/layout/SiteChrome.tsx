import { Link, NavLink } from 'react-router-dom';
import { useState, useEffect, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatCapabilities, isParentOnly } from '../../types';
import { isFounderEmail } from '../../services/stats';

export function SiteHeader() {
  const { user, profile, logout, configured } = useAuth();
  const [showRoomsModal, setShowRoomsModal] = useState(false);
  const caps = formatCapabilities(profile);
  const showFounderStats = isFounderEmail(profile?.email || user?.email);
  const parentAccount = isParentOnly(profile);

  useEffect(() => {
    if (!showRoomsModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowRoomsModal(false);
    };
    // Prevent background scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [showRoomsModal]);

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
          {user && !parentAccount ? <NavLink to="/dashboard">Dashboard</NavLink> : null}
          {user && !parentAccount ? <NavLink to="/progress">My progress</NavLink> : null}
          {user && parentAccount ? <NavLink to="/family">Parent portal</NavLink> : null}
          <NavLink to="/conferences">Conferences</NavLink>
          {!parentAccount ? <NavLink to="/practice">Practice</NavLink> : null}
          {!parentAccount ? (
            <NavLink
              to="/rooms"
              onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                if (!user) {
                  e.preventDefault();
                  setShowRoomsModal(true);
                }
              }}
            >
              Rooms
            </NavLink>
          ) : null}
          {showFounderStats ? <NavLink to="/admin">Founder&apos;s Stats</NavLink> : null}
        </nav>

        <div className="header-actions">
          {!configured ? (
            <span className="setup-chip">Setup Firebase</span>
          ) : null}
          {user ? (
            <>
              <Link to="/profile" className="user-chip user-chip-link" aria-label="Edit profile">
                <span className="avatar avatar-sm" aria-hidden="true">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" />
                  ) : (
                    <span>
                      {(profile?.displayName || profile?.username || 'D')
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase() || '')
                        .join('') || '?'}
                    </span>
                  )}
                </span>
                <span className="user-chip-text">
                  {profile?.username ? (
                    <>
                      <span className="user-chip-name">@{profile.username}</span>
                      {profile.displayName ? (
                        <span className="user-chip-meta">{profile.displayName}</span>
                      ) : caps ? (
                        <span className="user-chip-meta">{caps}</span>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <span className="user-chip-name">{profile?.displayName || 'Delegate'}</span>
                      {caps ? <span className="user-chip-meta">{caps}</span> : null}
                    </>
                  )}
                </span>
                <span className="user-chip-tip" aria-hidden="true">
                  Edit profile
                </span>
              </Link>
              <button
                type="button"
                className="btn btn-ghost header-action-tip"
                data-tip="End session"
                onClick={() => void logout()}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost header-action-tip" data-tip="Welcome back">
                Log in
              </Link>
              <Link to="/signup" className="btn btn-primary header-action-tip" data-tip="Create a free account">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
      {showRoomsModal
        ? createPortal(
            <div className="modal-overlay modal-centered" role="dialog" aria-modal="true">
              <div className="modal-panel" tabIndex={-1} aria-labelledby="rooms-modal-title">
                <button
                  type="button"
                  className="modal-close"
                  aria-label="Close dialog"
                  onClick={() => setShowRoomsModal(false)}
                >
                  ×
                </button>
                <h2 id="rooms-modal-title">Live committee rooms</h2>
                <p className="muted">
                  Live committee rooms are available to logged-in users. Create a free account to
                  start or log in to join rooms.
                </p>
                <div className="modal-actions">
                  <Link to="/signup" className="btn btn-primary btn-lg" onClick={() => setShowRoomsModal(false)}>
                    Sign up
                  </Link>
                  <Link to="/login" className="btn btn-secondary btn-lg" onClick={() => setShowRoomsModal(false)}>
                    Log in
                  </Link>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div>
          <strong>GoMUN Delegate Arena</strong>
          <p>Genuinely free practice for students and teachers.</p>
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
