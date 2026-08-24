import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { parseParentDateOfBirth } from '../lib/dateOfBirth';
import {
  homePathForProfile,
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
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  const isGoogleOnboarding = Boolean(
    profile && !profile.username && profile.profileSetupComplete === false,
  );
  const parentSelected = roles.length === 1 && roles[0] === 'parent';

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
    return <Navigate to={homePathForProfile(profile)} replace />;
  }

  function toggleStudentTeacher(role: 'student' | 'teacher', checked: boolean) {
    setRoles((prev) => {
      const withoutParent = prev.filter((r) => r !== 'parent');
      if (checked) return Array.from(new Set([...withoutParent, role]));
      return withoutParent.filter((r) => r !== role);
    });
  }

  function selectParent(checked: boolean) {
    if (checked) {
      setRoles(['parent']);
      return;
    }
    setRoles(['student']);
    setDateOfBirth('');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const check = validateUsername(username);
    if (check.ok === false) {
      setError(check.error);
      return;
    }

    let extras:
      | { displayName?: string; roles?: UserRole[]; dateOfBirth?: string }
      | undefined;
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
      if (normalized.roles.includes('parent')) {
        const dobCheck = parseParentDateOfBirth(dateOfBirth);
        if (dobCheck.ok === false) {
          setError(dobCheck.error);
          return;
        }
        extras = {
          displayName: nameCheck.displayName,
          roles: normalized.roles,
          dateOfBirth: dobCheck.dateOfBirth,
        };
      } else {
        extras = { displayName: nameCheck.displayName, roles: normalized.roles };
      }
    }

    setBusy(true);
    try {
      await claimUsername(check.username, extras);
      await refreshProfile();
      if (isGoogleOnboarding) {
        navigate(extras?.roles?.includes('parent') ? '/family' : '/welcome', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
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
            ? 'Pick a unique @handle, how your name shows, and your role. Parent accounts are parent-only for now.'
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
                    onChange={(e) => toggleStudentTeacher('student', e.target.checked)}
                  />
                  <span>Student / delegate</span>
                </label>
                <label className={`role-card ${roles.includes('teacher') ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={roles.includes('teacher')}
                    onChange={(e) => toggleStudentTeacher('teacher', e.target.checked)}
                  />
                  <span>Teacher / advisor</span>
                </label>
                <label className={`role-card ${parentSelected ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={parentSelected}
                    onChange={(e) => selectParent(e.target.checked)}
                  />
                  <span>Parent / guardian</span>
                </label>
              </div>
              <p className="field-hint">
                Parent is exclusive in V1 (not combined with student or teacher yet).
              </p>
            </fieldset>

            {parentSelected ? (
              <label>
                <span className="req-mark" aria-hidden="true">*</span> Date of birth
                <input
                  required
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                />
                <span className="field-hint">
                  Used like a school parent portal — parents must be 18 or older. No ID upload.
                </span>
              </label>
            ) : null}
          </>
        ) : null}

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : isGoogleOnboarding ? 'Continue' : 'Save username'}
        </button>
      </form>
    </main>
  );
}
