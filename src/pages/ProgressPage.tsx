import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { useAuth } from '../contexts/AuthContext';
import {
  backfillActivityEvents,
  buildMonthlyActivitySummary,
  computeActivityUsage,
  mergeActivityEvents,
  streamActivityLog,
  syncActivityBackfillToFirestore,
} from '../services/activity';
import { listUserClassrooms } from '../services/classrooms';
import { streamMyCommitteeRooms, type MyCommitteeRoom } from '../services/rooms';
import type { ActivityEvent } from '../types/activity';
import { isParentOnly, type Classroom } from '../types';
import type { MonthlyActivitySummary } from '../types/parent';

export function ProgressPage() {
  const { profile } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [committeeRooms, setCommitteeRooms] = useState<MyCommitteeRoom[]>([]);
  const [liveActivity, setLiveActivity] = useState<ActivityEvent[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<MonthlyActivitySummary | null>(null);

  const now = new Date();
  const [summaryYear, setSummaryYear] = useState(now.getFullYear());
  const [summaryMonth, setSummaryMonth] = useState(now.getMonth() + 1);

  const activityEvents = useMemo(() => {
    if (!profile) return [];
    const backfill = backfillActivityEvents({
      profile,
      rooms: committeeRooms,
      classrooms,
    });
    return mergeActivityEvents(liveActivity, backfill);
  }, [profile, committeeRooms, classrooms, liveActivity]);

  const activityStats = useMemo(
    () => computeActivityUsage(activityEvents, committeeRooms, classrooms),
    [activityEvents, committeeRooms, classrooms],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!profile) return;
      setLoadingClassrooms(true);
      setError('');
      try {
        const list = await listUserClassrooms(profile.classroomIds || []);
        if (!cancelled) setClassrooms(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load classrooms.');
        }
      } finally {
        if (!cancelled) setLoadingClassrooms(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  useEffect(() => {
    if (!profile?.uid) {
      setCommitteeRooms([]);
      setRoomsLoading(false);
      return;
    }
    setRoomsLoading(true);
    const unsub = streamMyCommitteeRooms(profile.uid, (rooms) => {
      setCommitteeRooms(rooms);
      setRoomsLoading(false);
    });
    return unsub;
  }, [profile?.uid]);

  useEffect(() => {
    if (!profile?.uid) {
      setLiveActivity([]);
      setActivityLoading(false);
      return;
    }
    setActivityLoading(true);
    return streamActivityLog(profile.uid, (events) => {
      setLiveActivity(events);
      setActivityLoading(false);
    });
  }, [profile?.uid]);

  useEffect(() => {
    if (!profile || isParentOnly(profile)) return;
    if (loadingClassrooms || roomsLoading) return;
    void syncActivityBackfillToFirestore({
      profile,
      rooms: committeeRooms,
      classrooms,
    });
  }, [profile, committeeRooms, classrooms, loadingClassrooms, roomsLoading]);

  if (!profile) {
    return (
      <main className="shell page-loading">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  if (isParentOnly(profile)) {
    return <Navigate to="/family" replace />;
  }

  function onGenerateSummary() {
    setSummary(buildMonthlyActivitySummary(activityEvents, summaryYear, summaryMonth));
  }

  return (
    <main className="shell progress-page">
      <header className="page-header">
        <div>
          <h1>My progress</h1>
          <p className="muted">
            Your practice activity, usage, and monthly summaries — the same overview your linked
            parent can see, for you.
          </p>
        </div>
        <Link to="/dashboard" className="btn btn-secondary">
          Dashboard
        </Link>
      </header>

      {error ? <p className="banner error">{error}</p> : null}

      <ActivityTimeline
        title="Practice activity"
        emptyMessage="Nothing here yet. Create or join a committee room or classroom and your trail will start here."
        events={activityEvents}
        stats={activityStats}
        loading={activityLoading || roomsLoading || loadingClassrooms}
      />

      <section className="auth-panel family-panel family-summary-panel">
        <h2>Monthly summary</h2>
        <p className="muted">
          Snapshot from your activity for the month you pick (not AI-written).
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
              onChange={(e) => setSummaryYear(Number(e.target.value) || now.getFullYear())}
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
    </main>
  );
}

export default ProgressPage;
