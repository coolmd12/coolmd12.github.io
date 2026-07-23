import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { needsUsername } from '../types';
import { validateUsername } from '../lib/username';

export function ChooseUsernamePage() {
  const { user, profile, loading, claimUsername, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <main className="shell page-loading">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (profile && !needsUsername(profile)) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const check = validateUsername(username);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setBusy(true);
    try {
      await claimUsername(check.username);
      await refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not claim username.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell auth-page">
      <form className="auth-panel" onSubmit={(e) => void onSubmit(e)}>
        <h1>Choose a username</h1>
        <p className="muted">
          Your account was created before usernames were required. Pick a unique @handle —
          you won&apos;t be able to change it later.
        </p>

        {error ? <p className="banner error">{error}</p> : null}

        <label>
          <span className="req-mark" aria-hidden="true">*</span> Username
          <input
            required
            maxLength={32}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="dhyanvi_m"
          />
          <span className="field-hint">Letters, numbers, underscores, and periods only.</span>
        </label>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save username'}
        </button>
      </form>
    </main>
  );
}
