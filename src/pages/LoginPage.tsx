import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { needsProfileSetup, needsUsername } from '../types';

export function LoginPage() {
  const { loginWithGoogle, user, profile, configured, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    const dest = needsUsername(profile)
      ? '/choose-username'
      : needsProfileSetup(profile)
        ? '/welcome'
        : from;
    return <Navigate to={dest} replace />;
  }

  async function onGoogle() {
    setError('');
    setBusy(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in with Google.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-side">
        <div className="login-card">
          <p className="login-kicker">Genuinely free</p>
          <h1>Log in to GoMUN</h1>
          <p className="login-lede">
            Use your Google account to open classrooms, practice rooms, and conference guides.
          </p>

          {!configured ? (
            <p className="banner warn">
              Firebase is not configured yet. See <Link to="/setup">setup</Link>.
            </p>
          ) : null}

          {error ? <p className="banner error">{error}</p> : null}

          <GoogleSignInButton
            busy={busy}
            disabled={!configured}
            onClick={() => void onGoogle()}
            label="Log in with Google"
          />

          <p className="auth-switch">
            New here? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </section>

      <section className="login-stage" aria-hidden="true">
        <div className="login-stage-inner">
          <p className="login-stage-kicker">GoMUN Delegate Arena</p>
          <h2 className="login-stage-title">Ready for the next session?</h2>
          <p className="login-stage-copy">Private classrooms. Real procedure. Genuinely free.</p>
        </div>
      </section>
    </main>
  );
}
