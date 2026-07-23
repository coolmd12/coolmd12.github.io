import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, uploadProfilePhoto } from '../services/auth';

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
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [school, setSchool] = useState('');
  const [photoURL, setPhotoURL] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setSchool(profile.school || '');
    setPhotoURL(profile.photoURL);
  }, [profile]);

  if (!profile) {
    return (
      <main className="shell page-loading">
        <p className="muted">Loading profile…</p>
      </main>
    );
  }

  const current = profile;

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

  async function onPhotoPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setOk('');
    setUploading(true);
    try {
      const url = await uploadProfilePhoto(file);
      await updateUserProfile({
        displayName: displayName.trim() || current.displayName,
        school,
        photoURL: url,
      });
      setPhotoURL(url);
      await refreshProfile();
      setOk('Photo updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload photo.');
    } finally {
      setUploading(false);
    }
  }

  async function onRemovePhoto() {
    setError('');
    setOk('');
    setBusy(true);
    try {
      await updateUserProfile({
        displayName: displayName.trim() || current.displayName,
        school,
        photoURL: null,
      });
      setPhotoURL(undefined);
      await refreshProfile();
      setOk('Photo removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove photo.');
    } finally {
      setBusy(false);
    }
  }

  const initials = initialsFromName(displayName || current.displayName);

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

      <form className="auth-panel profile-panel" onSubmit={onSave}>
        {error ? <p className="banner error">{error}</p> : null}
        {ok ? <p className="banner ok">{ok}</p> : null}

        <div className="profile-avatar-row">
          <div className="avatar avatar-lg" aria-hidden="true">
            {photoURL ? (
              <img src={photoURL} alt="" />
            ) : (
              <span>{initials}</span>
            )}
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
              {uploading ? 'Uploading…' : 'Upload photo'}
            </button>
            {photoURL ? (
              <button
                type="button"
                className="btn btn-ghost"
                disabled={uploading || busy}
                onClick={() => void onRemovePhoto()}
              >
                Remove
              </button>
            ) : null}
            <p className="muted profile-hint">JPG, PNG, or WebP · under 2 MB</p>
          </div>
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

        <button className="btn btn-primary" type="submit" disabled={busy || uploading}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </main>
  );
}
