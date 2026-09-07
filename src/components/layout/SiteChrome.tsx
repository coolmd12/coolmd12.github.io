import { Link, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isParentAccount, isParentOnly } from '../../types';
import { isFounderEmail } from '../../services/stats';

export function SiteHeader() {
  const { user, profile, logout, configured } = useAuth();
  const location = useLocation();
  const [showRoomsModal, setShowRoomsModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const showFounderStats = isFounderEmail(profile?.email || user?.email);
  const parentOnly = isParentOnly(profile);
  const parentCapable = isParentAccount(profile);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showRoomsModal && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowRoomsModal(false);
        setMenuOpen(false);
      }
    };
    const prevOverflow = document.body.style.overflow;
    if (menuOpen || showRoomsModal) {
      document.body.style.overflow = 'hidden';
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [showRoomsModal, menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  const navLinks = (
    <>
      <NavLink to="/" end onClick={closeMenu}>
        Home
      </NavLink>
      {user && !parentOnly ? (
        <NavLink to="/dashboard" onClick={closeMenu}>
          Dashboard
        </NavLink>
      ) : null}
      {user && !parentOnly ? (
        <NavLink to="/progress" onClick={closeMenu}>
          Progress
        </NavLink>
      ) : null}
      {user && parentCapable ? (
        <NavLink to="/family" onClick={closeMenu}>
          Family
        </NavLink>
      ) : null}
      <NavLink to="/conferences" onClick={closeMenu}>
        Conferences
      </NavLink>
      {!parentOnly ? (
        <NavLink to="/practice" onClick={closeMenu}>
          Practice
        </NavLink>
      ) : null}
      {user && !parentOnly ? (
        <NavLink to="/motions" onClick={closeMenu}>
          Procedure
        </NavLink>
      ) : null}
      {!parentOnly ? (
        <NavLink
          to="/rooms"
          onClick={(e: MouseEvent<HTMLAnchorElement>) => {
            closeMenu();
            if (!user) {
              e.preventDefault();
              setShowRoomsModal(true);
            }
          }}
        >
          Rooms
        </NavLink>
      ) : null}
      {showFounderStats ? (
        <NavLink to="/admin" title="Founder's Stats" onClick={closeMenu}>
          Stats
        </NavLink>
      ) : null}
    </>
  );

  const handleLabel = profile?.username
    ? `@${profile.username}`
    : profile?.displayName || 'Delegate';

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link to="/" className="brand" onClick={closeMenu}>
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

        <nav className="nav nav-desktop" aria-label="Primary">
          {navLinks}
        </nav>

        <div className="header-actions">
          {!configured ? <span className="setup-chip">Setup Firebase</span> : null}
          {user ? (
            <>
              <Link
                to="/profile"
                state={{ from: `${location.pathname}${location.search}` }}
                className="user-chip user-chip-link"
                aria-label="Edit profile"
                title={
                  profile?.displayName
                    ? `${handleLabel} · ${profile.displayName}`
                    : handleLabel
                }
                onClick={closeMenu}
              >
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
                  <span className="user-chip-name">{handleLabel}</span>
                </span>
              </Link>
              <button
                type="button"
                className="btn btn-ghost header-signout"
                onClick={() => void logout()}
              >
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

          <button
            type="button"
            className={`nav-toggle ${menuOpen ? 'is-open' : ''}`}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`nav-drawer ${menuOpen ? 'is-open' : ''}`}
        hidden={!menuOpen}
      >
        <nav className="nav nav-mobile" aria-label="Mobile">
          {navLinks}
          {user ? (
            <>
              <Link to="/profile" onClick={closeMenu}>
                Profile
              </Link>
              <button
                type="button"
                className="nav-mobile-signout"
                onClick={() => {
                  closeMenu();
                  void logout();
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}>
                Log in
              </Link>
              <Link to="/signup" onClick={closeMenu}>
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
      {menuOpen ? (
        <button
          type="button"
          className="nav-drawer-backdrop"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      ) : null}

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
                  <Link
                    to="/signup"
                    className="btn btn-primary btn-lg"
                    onClick={() => setShowRoomsModal(false)}
                  >
                    Sign up
                  </Link>
                  <Link
                    to="/login"
                    className="btn btn-secondary btn-lg"
                    onClick={() => setShowRoomsModal(false)}
                  >
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
          <p className="footer-legal-links">
            <Link to="/terms">Terms and Conditions</Link>
          </p>
        </div>
        <p className="footer-note">
          Conference links point to organizers&apos; own sites. GoMUN does not host those
          events. Practice aids are not official RoP — follow your conference&apos;s academic
          honesty and AI policies.
        </p>
      </div>
    </footer>
  );
}
