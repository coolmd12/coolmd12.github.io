import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

export function SignupPage() {
  const { register, user, configured, loading } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({ email, password, displayName, role, school });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell auth-page">
      <form className="auth-panel" onSubmit={onSubmit}>
        <h1>Join free</h1>
        <p className="muted">No fees. Private classrooms. Real MUN practice.</p>

        {!configured ? (
          <p className="banner warn">
            Firebase is not configured yet. See <Link to="/setup">setup</Link>.
          </p>
        ) : null}

        {error ? <p className="banner error">{error}</p> : null}

        <label>
          Display name
          <input
            required
            maxLength={80}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Delegate name"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          School / club (optional)
          <input
            maxLength={120}
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="Lincoln High MUN"
          />
        </label>

        <fieldset className="role-fieldset">
          <legend>I am a</legend>
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
          {busy ? 'Creating account…' : 'Create free account'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
