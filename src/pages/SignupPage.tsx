import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { needsProfileSetup, needsUsername } from '../types';

export function SignupPage() {
  const { loginWithGoogle, user, profile, configured, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    const dest = needsUsername(profile)
      ? '/choose-username'
      : needsProfileSetup(profile)
        ? '/welcome'
        : '/dashboard';
    return <Navigate to={dest} replace />;
  }

  async function onGoogle() {
    setError('');
    setBusy(true);
    try {
      await loginWithGoogle();
      navigate('/choose-username', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in with Google.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="signup-shell">
      <section className="signup-stage" aria-hidden="true">
        <div className="signup-stage-inner">
          <p className="signup-stage-kicker">GoMUN Delegate Arena</p>
          <h2 className="signup-stage-title">Practice like a diplomat.</h2>
          <p className="signup-stage-copy">
            Private classrooms. Real procedure. Genuinely free.
          </p>
        </div>
      </section>

      <section className="signup-side">
        <div className="signup-card">
          <p className="signup-step-meta">Genuinely free</p>
          <h1>Create your account</h1>
          <p className="signup-lede">
            Sign up with Google — any @gmail.com works. Then pick a username and how you use
            GoMUN.
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
            label="Sign up with Google"
          />

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
