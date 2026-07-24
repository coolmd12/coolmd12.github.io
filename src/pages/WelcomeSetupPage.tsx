import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { finishProfileSetup } from '../services/auth';
import { needsProfileSetup, needsUsername } from '../types';

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export function WelcomeSetupPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [school, setSchool] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setSchool(profile.school || '');
  }, [profile]);

  if (loading) {
    return (
      <main className="shell page-loading">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  if (!user) return <Navigate to="/signup" replace />;

  if (profile && needsUsername(profile)) {
    return <Navigate to="/choose-username" replace />;
  }

  if (profile && !needsProfileSetup(profile)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!profile) {
    return (
      <main className="shell page-loading">
        <p className="muted">Preparing your profile…</p>
      </main>
    );
  }

  const current = profile;
  const initials = initialsFromName(current.displayName);

  async function goDashboard() {
    await refreshProfile();
    navigate('/dashboard', { replace: true });
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await finishProfileSetup({
        displayName: current.displayName,
        school,
      });
      await goDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setBusy(false);
    }
  }

  async function onSkip() {
    setError('');
    setBusy(true);
    try {
      await finishProfileSetup();
      await goDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not continue.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell auth-page">
      <form className="auth-panel profile-panel welcome-panel" onSubmit={(e) => void onSave(e)}>
        <h1>Optional extras</h1>
        <p className="muted">
          Your username and display name are set. Add a school if you want — or skip and change
          this anytime later.
        </p>

        {error ? <p className="banner error">{error}</p> : null}

        <div className="locked-account-meta">
          <div>
            <span className="meta-label">Email</span>
            <strong>{current.email}</strong>
          </div>
          <div>
            <span className="meta-label">Username</span>
            <strong>@{current.username}</strong>
          </div>
          <div>
            <span className="meta-label">Display name</span>
            <strong>{current.displayName}</strong>
          </div>
          <div>
            <span className="meta-label">Role</span>
            <strong>
              {current.role === 'teacher' ? 'Teacher / advisor' : 'Student / delegate'}
            </strong>
          </div>
        </div>

        <div className="profile-avatar-row">
          <div className="avatar avatar-lg" aria-hidden="true">
            <span>{initials}</span>
          </div>
          <p className="muted profile-hint">
            Profile photos are paused for now (no paid Firebase Storage). Your initials will show
            in rooms.
          </p>
        </div>

        <label>
          School / club <span className="opt-mark">optional</span>
          <input
            maxLength={120}
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="ex: Lincoln High MUN"
          />
        </label>

        <div className="welcome-actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save and continue'}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={busy}
            onClick={() => void onSkip()}
          >
            Skip for now
          </button>
        </div>
      </form>
    </main>
  );
}
