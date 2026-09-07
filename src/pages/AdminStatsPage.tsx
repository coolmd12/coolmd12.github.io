import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  backfillProductStats,
  EMPTY_PRODUCT_STATS,
  isFounderEmail,
  subscribeProductStats,
  subscribeRegisteredUserCount,
  type ProductStats,
} from '../services/stats';

function formatWhen(ms: number | null): string {
  if (!ms) return 'Never';
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return 'Unknown';
  }
}

function StatRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | null;
  hint: string;
}) {
  return (
    <div className="stats-metric">
      <div className="stats-metric-head">
        <p className="stats-label">{label}</p>
        <p className="stats-value stats-value-sm">{value === null ? '…' : value}</p>
      </div>
      <p className="muted stats-hint">{hint}</p>
    </div>
  );
}

export function AdminStatsPage() {
  const { user, profile, loading, configured } = useAuth();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [product, setProduct] = useState<ProductStats | null>(null);
  const [error, setError] = useState('');
  const [backfillBusy, setBackfillBusy] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState('');
  const [backfillWarnings, setBackfillWarnings] = useState<string[]>([]);

  const allowed = isFounderEmail(profile?.email || user?.email);

  useEffect(() => {
    if (!configured || !allowed) return;
    const unsubUsers = subscribeRegisteredUserCount(
      (count) => {
        setUserCount(count);
        setError('');
      },
      (err) => setError(err.message),
    );
    const unsubProduct = subscribeProductStats(
      (stats) => {
        setProduct(stats);
        setError('');
      },
      (err) => setError(err.message),
    );
    return () => {
      unsubUsers();
      unsubProduct();
    };
  }, [configured, allowed]);

  async function onBackfill() {
    const already = product?.backfilledAt;
    if (already) {
      const ok = window.confirm(
        `Stats were last backfilled on ${formatWhen(already)}. Re-run and replace totals with a fresh scan?`,
      );
      if (!ok) return;
    } else {
      const ok = window.confirm(
        'Scan existing users, classrooms, rooms, motions, chat, and parent links, then write absolute totals to Founder\'s Stats?',
      );
      if (!ok) return;
    }

    setBackfillBusy(true);
    setBackfillMessage('');
    setBackfillWarnings([]);
    try {
      const result = await backfillProductStats();
      setProduct(result.stats);
      setBackfillWarnings(result.warnings);
      setBackfillMessage(
        result.warnings.length
          ? 'Backfill finished with some warnings — totals were still written.'
          : 'Backfill complete. Live increments continue from here.',
      );
    } catch (err) {
      setBackfillMessage(err instanceof Error ? err.message : 'Backfill failed.');
    } finally {
      setBackfillBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="shell page-loading">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!allowed) return <Navigate to="/dashboard" replace />;

  const p = product ?? { ...EMPTY_PRODUCT_STATS, updatedAt: 0, backfilledAt: null };

  return (
    <main className="shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Founder only</p>
          <h1>Founder&apos;s Stats</h1>
          <p className="muted">
            Reach, activation, and feature usage for GTM. Publish the latest{' '}
            <code>firebase/firestore.rules</code> before counters or backfill will work in
            production. Exact Auth roster stays in Firebase Console.
          </p>
        </div>
      </header>

      {error ? <p className="banner error">{error}</p> : null}
      {backfillMessage ? (
        <p className={`banner ${backfillWarnings.length || backfillMessage.includes('fail') ? 'error' : ''}`}>
          {backfillMessage}
        </p>
      ) : null}
      {backfillWarnings.length ? (
        <ul className="muted stats-warnings">
          {backfillWarnings.slice(0, 8).map((w) => (
            <li key={w}>{w}</li>
          ))}
          {backfillWarnings.length > 8 ? (
            <li>…and {backfillWarnings.length - 8} more</li>
          ) : null}
        </ul>
      ) : null}

      <div className="stats-grid">
        <section className="panel stats-panel">
          <h2 className="stats-section-title">Reach</h2>
          <StatRow
            label="Registered users"
            value={userCount}
            hint="Profiles finished (username setup). Down on account delete."
          />
          <StatRow
            label="Students"
            value={product ? p.students : null}
            hint="Accounts with the student capability."
          />
          <StatRow
            label="Teachers"
            value={product ? p.teachers : null}
            hint="Accounts with the teacher capability."
          />
          <StatRow
            label="Parents"
            value={product ? p.parents : null}
            hint="Accounts with the parent capability."
          />
          <StatRow
            label="Multi-role"
            value={product ? p.multiRole : null}
            hint="Accounts holding more than one capability."
          />
        </section>

        <section className="panel stats-panel">
          <h2 className="stats-section-title">Activation</h2>
          <StatRow
            label="Classrooms created"
            value={product ? p.classroomsCreated : null}
            hint="Teacher-created club homes."
          />
          <StatRow
            label="Rooms created"
            value={product ? p.roomsCreated : null}
            hint="Committee rooms hosted."
          />
          <StatRow
            label="Rooms joined"
            value={product ? p.roomsJoined : null}
            hint="New participant seats (rejoins do not count again)."
          />
          <StatRow
            label="Rooms closed"
            value={product ? p.roomsClosed : null}
            hint="Host/chair permanently closed rooms."
          />
          <StatRow
            label="Sessions started"
            value={product ? p.sessionsStarted : null}
            hint="Room create (born open) plus resume after recess. Historical backfill ≈ rooms created."
          />
        </section>

        <section className="panel stats-panel">
          <h2 className="stats-section-title">Feature usage</h2>
          <StatRow
            label="Motions proposed"
            value={product ? p.motionsProposed : null}
            hint="Motion docs created in rooms."
          />
          <StatRow
            label="Votes cast"
            value={product ? p.votesCast : null}
            hint="Each successful vote write (including vote changes)."
          />
          <StatRow
            label="Chat messages"
            value={product ? p.chatMessages : null}
            hint="Messages sent in room chat."
          />
          <StatRow
            label="Parent links"
            value={product ? p.parentLinksCreated : null}
            hint="Lifetime parent↔student links created (unlinks do not decrement)."
          />
        </section>
      </div>

      <section className="panel stats-panel stats-ops">
        <h2 className="stats-section-title">Backfill &amp; ops</h2>
        <p className="muted">
          Last backfill: <strong>{formatWhen(product?.backfilledAt ?? null)}</strong>
          {product?.updatedAt ? (
            <>
              {' '}
              · Product counters updated: {formatWhen(product.updatedAt)}
            </>
          ) : null}
        </p>
        <p className="muted">
          Run once after publishing rules to seed totals from existing Firestore data. Live
          increments continue afterward. Re-run only if you need a full recount.
        </p>
        <div className="stats-actions">
          <button
            type="button"
            className="btn"
            disabled={backfillBusy}
            onClick={() => void onBackfill()}
          >
            {backfillBusy
              ? 'Scanning…'
              : product?.backfilledAt
                ? 'Re-run backfill'
                : 'Backfill from existing data'}
          </button>
          <Link to="/dashboard" className="btn btn-secondary">
            Back to dashboard
          </Link>
        </div>
        <p className="muted">
          Exact Auth accounts:{' '}
          <a
            href="https://console.firebase.google.com/project/gomun-delegate-arena/authentication/users"
            target="_blank"
            rel="noreferrer"
          >
            Firebase → Authentication → Users
          </a>
        </p>
      </section>
    </main>
  );
}
