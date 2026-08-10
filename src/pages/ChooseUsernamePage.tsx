import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  needsUsername,
  normalizeAccountRoles,
  type UserRole,
} from '../types';
import { validateDisplayName, validateUsername } from '../lib/username';

export function ChooseUsernamePage() {
  const { user, profile, loading, claimUsername, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [roles, setRoles] = useState<UserRole[]>(['student']);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  const isGoogleOnboarding = Boolean(
    profile && !profile.username && profile.profileSetupComplete === false,
  );

  useEffect(() => {
    if (!profile || prefilled || !isGoogleOnboarding) return;
    if (profile.displayName) setDisplayName(profile.displayName);
    setPrefilled(true);
  }, [profile, prefilled, isGoogleOnboarding]);

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
    if (check.ok === false) {
      setError(check.error);
      return;
    }

    let extras: { displayName?: string; roles?: UserRole[] } | undefined;
    if (isGoogleOnboarding) {
      const nameCheck = validateDisplayName(displayName || profile?.displayName || '');
      if (nameCheck.ok === false) {
        setError(nameCheck.error);
        return;
      }
      let normalized;
      try {
        normalized = normalizeAccountRoles(roles);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Choose at least one role.');
        return;
      }
      extras = { displayName: nameCheck.displayName, roles: normalized.roles };
    }

    setBusy(true);
    try {
      await claimUsername(check.username, extras);
      await refreshProfile();
      navigate(isGoogleOnboarding ? '/welcome' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not claim username.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell auth-page">
      <form className="auth-panel" onSubmit={(e) => void onSubmit(e)}>
        <h1>{isGoogleOnboarding ? 'Finish your GoMUN account' : 'Choose a username'}</h1>
        <p className="muted">
          {isGoogleOnboarding
            ? 'Pick a unique @handle, how your name shows in rooms, and whether you’re a student, teacher, or both. You can change these anytime from your profile.'
            : 'Your account was created before usernames were required. Pick a unique @handle — you can change it anytime from your profile.'}
        </p>

        {error ? <p className="banner error">{error}</p> : null}

        {isGoogleOnboarding && profile?.email ? (
          <p className="signup-chip">
            Signed in as <strong>{profile.email}</strong>
          </p>
        ) : null}

        <label>
          <span className="req-mark" aria-hidden="true">*</span> Username
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

        {isGoogleOnboarding ? (
          <>
            <label>
              <span className="req-mark" aria-hidden="true">*</span> Display name
              <input
                required
                maxLength={80}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ex: Dhyanvi M."
              />
            </label>

            <fieldset className="role-fieldset">
              <legend>
                <span className="req-mark" aria-hidden="true">*</span> I am a…
              </legend>
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
          </>
        ) : null}

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : isGoogleOnboarding ? 'Continue' : 'Save username'}
        </button>
      </form>
    </main>
  );
}
