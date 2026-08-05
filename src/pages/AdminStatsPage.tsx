import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isFounderEmail, subscribeRegisteredUserCount } from '../services/stats';

export function AdminStatsPage() {
  const { user, profile, loading, configured } = useAuth();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [error, setError] = useState('');

  const allowed = isFounderEmail(profile?.email || user?.email);

  useEffect(() => {
    if (!configured || !allowed) return;
    const unsub = subscribeRegisteredUserCount(
      (count) => {
        setUserCount(count);
        setError('');
      },
      (err) => setError(err.message),
    );
    return unsub;
  }, [configured, allowed]);

  if (loading) {
    return (
      <main className="shell page-loading">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!allowed) return <Navigate to="/dashboard" replace />;

  return (
    <main className="shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Founder only</p>
          <h1>Founder&apos;s Stats</h1>
          <p className="muted">
            How many people have finished creating a GoMUN profile. For the full Auth list
            (emails, providers), open Firebase Console → Authentication → Users.
          </p>
        </div>
      </header>

      {error ? <p className="banner error">{error}</p> : null}

      <section className="panel stats-panel">
        <p className="stats-label">Registered users</p>
        <p className="stats-value">{userCount === null ? '…' : userCount}</p>
        <p className="muted">
          Counts go up when someone finishes username setup (or the older email signup path).
          If this is behind Firebase Auth, publish the latest{' '}
          <code>firebase/firestore.rules</code>, then new signups will catch up.
        </p>
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
        <Link to="/dashboard" className="btn btn-secondary">
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
