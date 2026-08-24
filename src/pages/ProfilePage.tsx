import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { parseParentDateOfBirth } from '../lib/dateOfBirth';
import { updateUserProfile } from '../services/auth';
import {
  ensureFamilyCode,
  listParentLinksForStudent,
  rotateFamilyCode,
  unlinkParentLink,
} from '../services/parentLinks';
import {
  homePathForProfile,
  isParentOnly,
  normalizeAccountRoles,
  profileRoles,
  type UserRole,
} from '../types';
import type { ParentLink } from '../types/parent';
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
  const { profile, refreshProfile, deleteAccount } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [school, setSchool] = useState('');
  const [roles, setRoles] = useState<UserRole[]>(['student']);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [parentLinks, setParentLinks] = useState<ParentLink[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [codeBusy, setCodeBusy] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const parentAccount = isParentOnly(profile);
  const parentSelected = roles.length === 1 && roles[0] === 'parent';

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
  }

  useEffect(() => {
    if (!showDeleteModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleteBusy) setShowDeleteModal(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [showDeleteModal, deleteBusy]);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setUsername(profile.username || '');
    setSchool(profile.school || '');
    setDateOfBirth(profile.dateOfBirth || '');
    setRoles(profileRoles(profile).length ? profileRoles(profile) : ['student']);
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    async function loadFamily() {
      if (!profile || parentAccount) return;
      try {
        const withCode = await ensureFamilyCode(profile);
        if (!cancelled) {
          setFamilyCode(withCode.familyCode || '');
          if (withCode.familyCode && !profile.familyCode) {
            await refreshProfile();
          }
        }
        const links = await listParentLinksForStudent(profile.uid);
        if (!cancelled) setParentLinks(links);
      } catch (err) {
        console.warn('Could not load family code', err);
      }
    }
    void loadFamily();
    return () => {
      cancelled = true;
    };
  }, [profile, parentAccount, refreshProfile]);

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
    let nextDob: string | undefined;
    try {
      if (parentAccount || parentSelected) {
        const dobCheck = parseParentDateOfBirth(dateOfBirth);
        if (dobCheck.ok === false) {
          setError(dobCheck.error);
          return;
        }
        nextDob = dobCheck.dateOfBirth;
        normalized = normalizeAccountRoles(['parent']);
      } else {
        normalized = normalizeAccountRoles(roles.filter((r) => r !== 'parent'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Choose at least one role.');
      return;
    }

    setBusy(true);
    try {
      await updateUserProfile({
        displayName: nameCheck.displayName,
        username: usernameCheck.username,
        school: parentSelected || parentAccount ? undefined : school,
        roles: normalized.roles,
        ...((parentSelected || parentAccount) && nextDob ? { dateOfBirth: nextDob } : {}),
        ...((parentSelected || parentAccount) ? { profileSetupComplete: true } : {}),
      });
      await refreshProfile();
      if (parentSelected && !parentAccount) {
        window.location.replace('/family');
        return;
      }
      setOk('Profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setBusy(false);
    }
  }

  async function onCopyCode() {
    if (!familyCode) return;
    try {
      await navigator.clipboard.writeText(familyCode);
      setOk('Family code copied.');
      setError('');
    } catch {
      setError('Could not copy. Select the code and copy manually.');
    }
  }

  async function onRotateCode() {
    if (!profile) return;
    setCodeBusy(true);
    setError('');
    setOk('');
    try {
      const next = await rotateFamilyCode(profile.uid);
      setFamilyCode(next);
      setOk('New family code created. Share it with your parent/guardian.');
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rotate family code.');
    } finally {
      setCodeBusy(false);
    }
  }

  async function onUnlink(linkId: string) {
    setCodeBusy(true);
    setError('');
    setOk('');
    try {
      await unlinkParentLink(linkId);
      setParentLinks((prev) => prev.filter((l) => l.linkId !== linkId));
      setOk('Parent link removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unlink.');
    } finally {
      setCodeBusy(false);
    }
  }

  function openDeleteModal() {
    setDeleteConfirm('');
    setDeleteError('');
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (deleteBusy) return;
    setShowDeleteModal(false);
    setDeleteConfirm('');
    setDeleteError('');
  }

  async function onConfirmDelete() {
    if (deleteConfirm.trim().toUpperCase() !== 'DELETE') return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await deleteAccount();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete account.');
      setDeleteBusy(false);
    }
  }

  const deleteReady = deleteConfirm.trim().toUpperCase() === 'DELETE';

  return (
    <main className="shell profile-page">
      <header className="page-header">
        <div>
          <h1>Your profile</h1>
          <p className="muted">
            {parentAccount
              ? 'Customize how you appear in Family.'
              : 'Customize how you appear in classrooms and sessions.'}
          </p>
        </div>
        <Link to={homePathForProfile(current)} className="btn btn-secondary">
          {parentAccount ? 'Back to parent portal' : 'Back to dashboard'}
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
            {parentAccount
              ? 'Your initials appear on your Family account.'
              : 'Your initials appear in rooms and classrooms.'}
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

        {!parentAccount ? (
          <fieldset className="role-fieldset">
            <legend>I am a…</legend>
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
              Parent is exclusive in V1 — switching saves your profile and opens the parent portal.
            </p>
          </fieldset>
        ) : (
          <p className="muted">
            Account type: <strong>Parent / guardian</strong> (parent-only in V1).
          </p>
        )}

        {parentAccount || parentSelected ? (
          <label>
            Date of birth
            <input
              required
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
            <span className="field-hint">Required for the parent portal (18 or older).</span>
          </label>
        ) : (
          <label>
            School / club (optional)
            <input
              maxLength={120}
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="ex: Lincoln High MUN"
            />
          </label>
        )}

        <label>
          Email
          <input value={current.email} disabled readOnly />
          <span className="field-hint">Managed by your Google account.</span>
        </label>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      {!parentAccount && !parentSelected ? (
        <section className="auth-panel profile-panel family-code-panel">
          <h2>Family code</h2>
          <p className="muted">
            Share your @username and this code with a parent/guardian so they can link in Family.
            Rotating the code blocks new links that use the old code.
          </p>
          <div className="family-code-row">
            <code className="family-code-value">{familyCode || '……'}</code>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!familyCode || codeBusy}
              onClick={() => void onCopyCode()}
            >
              Copy
            </button>
            <button
              type="button"
              className="btn btn-ghost-dark"
              disabled={codeBusy}
              onClick={() => void onRotateCode()}
            >
              {codeBusy ? 'Working…' : 'Rotate code'}
            </button>
          </div>

          {parentLinks.length > 0 ? (
            <div className="linked-parents">
              <h3>Linked parents</h3>
              <ul>
                {parentLinks.map((link) => (
                  <li key={link.linkId}>
                    <span>Linked {new Date(link.createdAt).toLocaleDateString()}</span>
                    <button
                      type="button"
                      className="btn btn-ghost-dark"
                      disabled={codeBusy}
                      onClick={() => void onUnlink(link.linkId)}
                    >
                      Unlink
                    </button>
                  </li>
                ))}
              </ul>
              <p className="field-hint">
                Unlink is a safety escape if a link should not continue.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="auth-panel profile-panel profile-danger-panel">
        <h2>Delete account</h2>
        <p className="muted">
          Permanently remove your GoMUN profile, username, activity log, and parent links. This
          cannot be undone. Classrooms and committee rooms you joined may keep old records until
          hosts clean them up.
        </p>
        <button type="button" className="btn btn-danger" onClick={openDeleteModal}>
          Delete my account…
        </button>
      </section>

      {showDeleteModal
        ? createPortal(
            <div className="modal-overlay modal-centered" role="dialog" aria-modal="true">
              <div className="modal-panel" tabIndex={-1} aria-labelledby="delete-account-title">
                <button
                  type="button"
                  className="modal-close"
                  aria-label="Close dialog"
                  disabled={deleteBusy}
                  onClick={closeDeleteModal}
                >
                  ×
                </button>
                <h2 id="delete-account-title">Delete your GoMUN account?</h2>
                <p className="muted">
                  This permanently deletes your profile, @
                  {current.username || 'handle'}, activity history, family links, and sign-in.
                  You can create a new account later with the same Google email, but your old data
                  will be gone.
                </p>
                {deleteError ? <p className="banner error">{deleteError}</p> : null}
                <label>
                  Type <strong>DELETE</strong> to confirm
                  <input
                    autoComplete="off"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    disabled={deleteBusy}
                  />
                </label>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={!deleteReady || deleteBusy}
                    onClick={() => void onConfirmDelete()}
                  >
                    {deleteBusy ? 'Deleting…' : 'Yes, delete my account'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={deleteBusy}
                    onClick={closeDeleteModal}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </main>
  );
}
