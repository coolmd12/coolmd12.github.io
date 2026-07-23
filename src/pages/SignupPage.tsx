import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import { needsProfileSetup } from '../types';

export function SignupPage() {
  const { register, user, profile, configured, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    return (
      <Navigate to={needsProfileSetup(profile) ? '/welcome' : '/dashboard'} replace />
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({ email, password, role });
      navigate('/welcome', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell auth-page">
      <form className="auth-panel" onSubmit={onSubmit}>
        <h1>Sign up</h1>
        <p className="muted">
          Create your account first — you can customize your profile on the next step
          (or skip it).
        </p>

        {!configured ? (
          <p className="banner warn">
            Firebase is not configured yet. See <Link to="/setup">setup</Link>.
          </p>
        ) : null}

        {error ? <p className="banner error">{error}</p> : null}

        <label>
          Email <span className="req-mark">required</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password <span className="req-mark">required</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <fieldset className="role-fieldset">
          <legend>
            I am a <span className="req-mark">required</span>
          </legend>
          <label className="role-option">
            <input
              type="radio"
              name="role"
              checked={role === 'student'}
              onChange={() => setRole('student')}
            />
            Student / delegate
          </label>
          <label className="role-option">
            <input
              type="radio"
              name="role"
              checked={role === 'teacher'}
              onChange={() => setRole('teacher')}
            />
            Teacher / advisor
          </label>
        </fieldset>

        <button className="btn btn-primary" type="submit" disabled={busy || !configured}>
          {busy ? 'Creating account…' : 'Continue'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}
