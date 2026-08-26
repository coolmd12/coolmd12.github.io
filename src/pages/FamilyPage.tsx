import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { useAuth } from '../contexts/AuthContext';
import { needsParentDateOfBirth, parseParentDateOfBirth } from '../lib/dateOfBirth';
import {
  buildMonthlyActivitySummary,
  computeActivityUsageFromEvents,
  loadStudentActivityView,
  streamActivityLog,
} from '../services/activity';
import {
  linkStudentAsParent,
  listLinkedStudents,
  saveParentDateOfBirth,
  unlinkParentLink,
} from '../services/parentLinks';
import { isParentOnly } from '../types';
import type { ActivityEvent } from '../types/activity';
import type { LinkedStudentSummary, MonthlyActivitySummary } from '../types/parent';
import { MAX_PARENT_LINKS } from '../types/parent';

export function FamilyPage() {
  const { profile, refreshProfile } = useAuth();
  const [linked, setLinked] = useState<LinkedStudentSummary[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activityError, setActivityError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const [studentUsername, setStudentUsername] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [dobDraft, setDobDraft] = useState('');
  const [summary, setSummary] = useState<MonthlyActivitySummary | null>(null);

  const now = new Date();
  const [summaryYear, setSummaryYear] = useState(now.getFullYear());
  const [summaryMonth, setSummaryMonth] = useState(now.getMonth() + 1);

  const parentAccount = isParentOnly(profile);
  const needsDob = needsParentDateOfBirth(profile);

  const selected = linked.find((s) => s.link.studentUid === selectedUid) || null;
  const stats = useMemo(() => computeActivityUsageFromEvents(events), [events]);

  async function reloadLinks() {
    if (!profile) return;
    setLoadingLinks(true);
    setError('');
    try {
      const list = await listLinkedStudents(profile.uid);
      setLinked(list);
      setSelectedUid((prev) => {
        if (prev && list.some((s) => s.link.studentUid === prev)) return prev;
        return list[0]?.link.studentUid ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load linked students.');
    } finally {
      setLoadingLinks(false);
    }
  }

  useEffect(() => {
    if (!profile || !parentAccount) return;
    setDobDraft(profile.dateOfBirth || '');
    void reloadLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when profile uid changes
  }, [profile?.uid, parentAccount]);

  useEffect(() => {
    if (!selectedUid) {
      setEvents([]);
      setSummary(null);
      setActivityError('');
      setLastUpdatedAt(null);
      setLoadingActivity(false);
      return;
    }

    // Clear previous student's data immediately so a failed load never shows stale events.
    setEvents([]);
    setSummary(null);
    setActivityError('');
    setLastUpdatedAt(null);
    setLoadingActivity(true);

    let cancelled = false;
    async function refresh() {
      try {
        const merged = await loadStudentActivityView(selectedUid!);
        if (!cancelled) {
          setEvents(merged);
          setActivityError('');
          setLastUpdatedAt(Date.now());
          setLoadingActivity(false);
        }
      } catch (err) {
        if (!cancelled) {
          setEvents([]);
          const raw = err instanceof Error ? err.message : 'Could not load this student’s activity.';
          setActivityError(
            /insufficient permissions|permission-denied/i.test(raw)
              ? 'Could not read this student’s activity (permissions). Ask them to open their Dashboard once, and make sure Firestore rules are published from firebase/firestore.rules.'
              : raw,
          );
          setLoadingActivity(false);
        }
      }
    }

    void refresh();
    const unsub = streamActivityLog(selectedUid, () => {
      void refresh();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [selectedUid]);

  if (!profile) {
    return (
      <main className="shell page-loading">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  if (!parentAccount) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSaveDob(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    setError('');
    setOk('');
    try {
      const parsed = parseParentDateOfBirth(dobDraft);
      if (parsed.ok === false) throw new Error(parsed.error);
      await saveParentDateOfBirth(profile.uid, parsed.dateOfBirth);
      await refreshProfile();
      setOk('Date of birth saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save date of birth.');
    } finally {
      setBusy(false);
    }
  }

  async function onLink(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    setError('');
    setOk('');
    try {
      await linkStudentAsParent({
        parent: profile,
        studentUsername,
        familyCode,
      });
      setStudentUsername('');
      setFamilyCode('');
      setOk('Student added to your portal.');
      await reloadLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not link student.');
    } finally {
      setBusy(false);
    }
  }

  async function onUnlink(linkId: string) {
    setBusy(true);
    setError('');
    setOk('');
    try {
      await unlinkParentLink(linkId);
      setOk('Student removed from your portal.');
      await reloadLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove link.');
    } finally {
      setBusy(false);
    }
  }

  function onGenerateSummary() {
    setSummary(buildMonthlyActivitySummary(events, summaryYear, summaryMonth));
  }

  const lastUpdatedLabel =
    lastUpdatedAt != null
      ? new Date(lastUpdatedAt).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : null;

  return (
    <main className="shell family-page">
      <header className="page-header">
        <div>
          <h1>Parent portal</h1>
          <p className="muted">
            View your student’s GoMUN practice activity — rooms, classrooms, and monthly summaries.
            Similar spirit to a school parent portal: you look in; you don’t join committee rooms as
            them.
          </p>
        </div>
        <Link to="/profile" className="btn btn-secondary">
          Profile
        </Link>
      </header>

      {error ? <p className="banner error">{error}</p> : null}
      {ok ? <p className="banner ok">{ok}</p> : null}

      {needsDob ? (
        <section className="auth-panel family-panel">
          <h2>Your date of birth</h2>
          <p className="muted">
            Parent accounts need a date of birth on file (18 or older). No ID photos or uploads —
            just the date, like registering for a school parent account.
          </p>
          <form className="family-link-form" onSubmit={(e) => void onSaveDob(e)}>
            <label>
              Date of birth
              <input
                required
                type="date"
                value={dobDraft}
                onChange={(e) => setDobDraft(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save and continue'}
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className="family-portal-layout">
            <aside className="auth-panel family-panel family-students-panel">
              <h2>Your students</h2>
              <p className="muted">Select a student to view their activity.</p>
              {loadingLinks ? (
                <p className="muted">Loading…</p>
              ) : linked.length === 0 ? (
                <p className="muted">No students linked yet. Add one below.</p>
              ) : (
                <ul className="family-student-list">
                  {linked.map((item) => (
                    <li key={item.link.linkId}>
                      <button
                        type="button"
                        className={`family-student-btn ${selectedUid === item.link.studentUid ? 'selected' : ''}`}
                        onClick={() => setSelectedUid(item.link.studentUid)}
                      >
                        <strong>{item.displayName}</strong>
                        <span>@{item.username}</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost-dark"
                        disabled={busy}
                        onClick={() => void onUnlink(item.link.linkId)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="family-add-student">
                <h3>Add a student</h3>
                <p className="muted">
                  Enter their GoMUN @username and the family code from their Profile (up to{' '}
                  {MAX_PARENT_LINKS}).
                </p>
                <form className="family-link-form" onSubmit={(e) => void onLink(e)}>
                  <label>
                    Student username
                    <input
                      required
                      maxLength={32}
                      value={studentUsername}
                      onChange={(e) => setStudentUsername(e.target.value.toLowerCase())}
                      placeholder="ex: alex_m"
                    />
                  </label>
                  <label>
                    Family code
                    <input
                      required
                      maxLength={16}
                      value={familyCode}
                      onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                      placeholder="ex: AB12CD34"
                      autoComplete="off"
                    />
                  </label>
                  <button className="btn btn-primary" type="submit" disabled={busy}>
                    {busy ? 'Adding…' : 'Add student'}
                  </button>
                </form>
              </div>
            </aside>

            <div className="family-student-detail">
              {selected ? (
                <>
                  <header className="family-detail-head">
                    <div>
                      <h2>{selected.displayName}</h2>
                      <p className="muted">@{selected.username}</p>
                      {lastUpdatedLabel && !loadingActivity ? (
                        <p className="muted family-last-updated">Updated {lastUpdatedLabel}</p>
                      ) : null}
                    </div>
                  </header>

                  {activityError ? <p className="banner error">{activityError}</p> : null}

                  <ActivityTimeline
                    title="Practice activity"
                    emptyMessage={
                      activityError
                        ? 'Activity could not be loaded. Try again in a moment.'
                        : 'Linked successfully, but no practice activity yet. When they join rooms or classrooms (and open their dashboard), it will show up here.'
                    }
                    events={[...events].sort((a, b) => a.at - b.at)}
                    stats={stats}
                    loading={loadingActivity}
                  />

                  <section className="auth-panel family-panel family-summary-panel">
                    <h2>Monthly summary</h2>
                    <p className="muted">
                      Snapshot from their activity log for the month you pick (not AI-written).
                    </p>
                    <div className="family-summary-controls">
                      <label>
                        Month
                        <select
                          value={summaryMonth}
                          onChange={(e) => setSummaryMonth(Number(e.target.value))}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <option key={m} value={m}>
                              {new Date(2000, m - 1, 1).toLocaleString(undefined, { month: 'long' })}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Year
                        <input
                          type="number"
                          min={2020}
                          max={2100}
                          value={summaryYear}
                          onChange={(e) =>
                            setSummaryYear(Number(e.target.value) || now.getFullYear())
                          }
                        />
                      </label>
                      <button type="button" className="btn btn-primary" onClick={onGenerateSummary}>
                        Generate summary
                      </button>
                    </div>
                    {summary ? (
                      <div className="family-summary-result">
                        <h3>{summary.label}</h3>
                        <ul>
                          {summary.bullets.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </section>
                </>
              ) : (
                <section className="auth-panel family-panel">
                  <h2>Student overview</h2>
                  <p className="muted">
                    {linked.length === 0
                      ? 'No students linked yet. Add one on the left with their @username and family code from Profile.'
                      : 'Select a student on the left to see their practice timeline and monthly summaries.'}
                  </p>
                </section>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default FamilyPage;
