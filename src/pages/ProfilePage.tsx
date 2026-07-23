import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../services/auth';

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [school, setSchool] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setSchool(profile.school || '');
  }, [profile]);

  if (!profile) {
    return (
      <main className="shell page-loading">
        <p className="muted">Loading profile…</p>
      </main>
    );
  }

  const current = profile;
  const initials = initialsFromName(displayName || current.displayName);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      await updateUserProfile({
        displayName,
        school,
      });
      await refreshProfile();
      setOk('Profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell profile-page">
      <header className="page-header">
        <div>
          <h1>Your profile</h1>
          <p className="muted">Customize how you appear in classrooms and sessions.</p>
        </div>
        <Link to="/dashboard" className="btn btn-ghost">
          Back to dashboard
        </Link>
      </header>

      <form className="auth-panel profile-panel" onSubmit={(e) => void onSave(e)}>
        {error ? <p className="banner error">{error}</p> : null}
        {ok ? <p className="banner ok">{ok}</p> : null}

        <div className="profile-avatar-row">
          <div className="avatar avatar-lg" aria-hidden="true">
            <span>{initials}</span>
          </div>
          <p className="muted profile-hint">
            Photos are off for now so we can stay on Firebase’s free plan. Your initials show
            instead.
          </p>
        </div>

        <label>
          Display name
          <input
            required
            maxLength={80}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>

        <label>
          Username
          <input value={current.username ? `@${current.username}` : 'Not set'} disabled readOnly />
          <span className="field-hint">Usernames are locked after signup (Discord-style).</span>
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

        <label>
          Email
          <input value={current.email} disabled readOnly />
        </label>

        <label>
          Role
          <input value={current.role} disabled readOnly />
        </label>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </main>
  );
}
