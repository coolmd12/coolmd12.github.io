import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { finishProfileSetup, uploadProfilePhoto } from '../services/auth';
import { needsProfileSetup } from '../types';

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
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [school, setSchool] = useState('');
  const [photoURL, setPhotoURL] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setSchool(profile.school || '');
    setPhotoURL(profile.photoURL);
  }, [profile]);

  if (loading) {
    return (
      <main className="shell page-loading">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  if (!user) return <Navigate to="/signup" replace />;

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
        displayName: displayName.trim() || current.displayName,
        school,
        ...(photoURL ? { photoURL } : {}),
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

  async function onPhotoPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setUploading(true);
    try {
      const url = await uploadProfilePhoto(file);
      setPhotoURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload photo.');
    } finally {
      setUploading(false);
    }
  }

  const initials = initialsFromName(displayName || current.displayName);

  return (
    <main className="shell auth-page">
      <form className="auth-panel profile-panel welcome-panel" onSubmit={onSave}>
        <h1>Customize your profile</h1>
        <p className="muted">
          Optional — add a name, school, or photo so classmates recognize you. You can skip
          and change this anytime later.
        </p>

        {error ? <p className="banner error">{error}</p> : null}

        <div className="locked-account-meta">
          <div>
            <span className="meta-label">Email</span>
            <strong>{current.email}</strong>
          </div>
          <div>
            <span className="meta-label">Role</span>
            <strong>{current.role === 'teacher' ? 'Teacher / advisor' : 'Student / delegate'}</strong>
          </div>
        </div>

        <div className="profile-avatar-row">
          <div className="avatar avatar-lg" aria-hidden="true">
            {photoURL ? <img src={photoURL} alt="" /> : <span>{initials}</span>}
          </div>
          <div className="profile-avatar-actions">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => void onPhotoPick(e)}
            />
            <button
              type="button"
              className="btn btn-ghost"
              disabled={uploading || busy}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? 'Uploading…' : 'Add photo (optional)'}
            </button>
            {photoURL ? (
              <button
                type="button"
                className="btn btn-ghost"
                disabled={uploading || busy}
                onClick={() => setPhotoURL(undefined)}
              >
                Remove
              </button>
            ) : null}
            <p className="muted profile-hint">JPG, PNG, or WebP · under 2 MB</p>
          </div>
        </div>

        <label>
          Display name <span className="opt-mark">optional</span>
          <input
            maxLength={80}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How you want to appear"
          />
        </label>

        <label>
          School / club <span className="opt-mark">optional</span>
          <input
            maxLength={120}
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="Lincoln High MUN"
          />
        </label>

        <div className="welcome-actions">
          <button className="btn btn-primary" type="submit" disabled={busy || uploading}>
            {busy ? 'Saving…' : 'Save and continue'}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={busy || uploading}
            onClick={() => void onSkip()}
          >
            Skip for now
          </button>
        </div>
      </form>
    </main>
  );
}
