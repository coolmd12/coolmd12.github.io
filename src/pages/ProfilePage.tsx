import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../services/auth';
import { normalizeAccountRoles, profileRoles, type UserRole } from '../types';
import { validateDisplayName, validateUsername } from '../lib/username';

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
  const [username, setUsername] = useState('');
  const [school, setSchool] = useState('');
  const [roles, setRoles] = useState<UserRole[]>(['student']);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setUsername(profile.username || '');
    setSchool(profile.school || '');
    setRoles(profileRoles(profile).length ? profileRoles(profile) : ['student']);
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

    const nameCheck = validateDisplayName(displayName);
    if (nameCheck.ok === false) {
      setError(nameCheck.error);
      return;
    }

    const usernameCheck = validateUsername(username);
    if (usernameCheck.ok === false) {
      setError(usernameCheck.error);
      return;
    }

    let normalized;
    try {
      normalized = normalizeAccountRoles(roles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Choose at least one role.');
      return;
    }

    setBusy(true);
    try {
      await updateUserProfile({
        displayName: nameCheck.displayName,
        username: usernameCheck.username,
        school,
        roles: normalized.roles,
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
            Your initials appear in rooms and classrooms.
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
          <input
            required
            maxLength={32}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="ex: dhyanvi_m"
          />
          <span className="field-hint">Letters, numbers, underscores, and periods only.</span>
        </label>

        <label>
          School / club (optional)
          <input
            maxLength={120}
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="ex: Lincoln High MUN"
          />
        </label>

        <fieldset className="role-fieldset">
          <legend>I am a…</legend>
          <div className="role-cards">
            <label className={`role-card ${roles.includes('student') ? 'selected' : ''}`}>
              <input
                type="checkbox"
                checked={roles.includes('student')}
                onChange={(e) =>
                  setRoles((prev) =>
                    e.target.checked
                      ? Array.from(new Set([...prev, 'student']))
                      : prev.filter((r) => r !== 'student'),
                  )
                }
              />
              <span>Student / delegate</span>
            </label>
            <label className={`role-card ${roles.includes('teacher') ? 'selected' : ''}`}>
              <input
                type="checkbox"
                checked={roles.includes('teacher')}
                onChange={(e) =>
                  setRoles((prev) =>
                    e.target.checked
                      ? Array.from(new Set([...prev, 'teacher']))
                      : prev.filter((r) => r !== 'teacher'),
                  )
                }
              />
              <span>Teacher / advisor</span>
            </label>
          </div>
        </fieldset>

        <label>
          Email
          <input value={current.email} disabled readOnly />
          <span className="field-hint">Managed by your Google account.</span>
        </label>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </main>
  );
}
