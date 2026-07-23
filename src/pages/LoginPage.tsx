import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { login, user, configured, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code: string }).code)
          : '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-email'
      ) {
        setError('Email or password is incorrect.');
      } else {
        setError(err instanceof Error ? err.message : 'Could not log in.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-side">
        <div className="login-card">
          <p className="login-kicker">Welcome back</p>
          <h1>Log in to GoMUN</h1>
          <p className="login-lede">
            Continue to your classrooms, practice rooms, and conference guides.
          </p>

          {!configured ? (
            <p className="banner warn">
              Firebase is not configured yet. See <Link to="/setup">setup</Link>.
            </p>
          ) : null}

          {error ? <p className="banner error">{error}</p> : null}

          <form className="login-form" onSubmit={(e) => void onSubmit(e)}>
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <button
              className="btn btn-primary btn-block"
              type="submit"
              disabled={busy || !configured}
            >
              {busy ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="auth-switch">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </section>

      <section className="login-stage" aria-hidden="true">
        <div className="login-stage-inner">
          <p className="login-stage-kicker">GoMUN Delegate Arena</p>
          <h2 className="login-stage-title">Ready for the next session?</h2>
          <p className="login-stage-copy">Private classrooms. Real procedure. Always free.</p>
        </div>
      </section>
    </main>
  );
}
