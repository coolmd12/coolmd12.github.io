import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { InviteCodeShare } from '../components/InviteCodeShare';
import { useAuth } from '../contexts/AuthContext';
import {
  createClassroom,
  joinClassroomByCode,
  listUserClassrooms,
} from '../services/classrooms';
import type { Classroom } from '../types';

export function DashboardPage() {
  const { profile, refreshProfile } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [createdRoom, setCreatedRoom] = useState<Classroom | null>(null);

  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [zoomLink, setZoomLink] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!profile) return;
      setLoading(true);
      setError('');
      try {
        const list = await listUserClassrooms(profile.classroomIds || []);
        if (!cancelled) setClassrooms(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load classrooms.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const room = await createClassroom({
        name: className,
        description,
        teacher: profile,
        meetLink,
        zoomLink,
      });
      setClassName('');
      setDescription('');
      setMeetLink('');
      setZoomLink('');
      setCreatedRoom(room);
      setMessage(`Classroom “${room.name}” is ready. Share the invite code with your class.`);
      await refreshProfile();
      setClassrooms((prev) => [room, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create classroom.');
    } finally {
      setBusy(false);
    }
  }

  async function onJoin(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const room = await joinClassroomByCode(inviteCode, profile);
      setInviteCode('');
      setMessage(`Joined ${room.name}.`);
      await refreshProfile();
      setClassrooms((prev) =>
        prev.some((c) => c.id === room.id) ? prev : [room, ...prev],
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join classroom.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell dashboard">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Welcome, {profile?.displayName}. Your classrooms are private to your group.
          </p>
        </div>
        <Link to="/practice" className="btn btn-secondary">
          Open practice hub
        </Link>
      </header>

      {error ? <p className="banner error">{error}</p> : null}
      {message ? <p className="banner ok">{message}</p> : null}
      {createdRoom ? (
        <div className="panel invite-created">
          <h2>Share “{createdRoom.name}”</h2>
          <p className="muted">Students join from the dashboard with this code.</p>
          <InviteCodeShare code={createdRoom.inviteCode} classroomName={createdRoom.name} />
          <div className="invite-created-links">
            <Link className="btn btn-secondary" to={`/classroom/${createdRoom.id}`}>
              Open classroom
            </Link>
            <button
              type="button"
              className="btn btn-ghost-dark"
              onClick={() => setCreatedRoom(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <section className="dash-grid">
        <div className="panel">
          <h2>Your classrooms</h2>
          {loading ? <p className="muted">Loading…</p> : null}
          {!loading && classrooms.length === 0 ? (
            <p className="muted">No classrooms yet. Create one or join with a code.</p>
          ) : null}
          <ul className="classroom-list">
            {classrooms.map((c) => (
              <li key={c.id}>
                <Link to={`/classroom/${c.id}`}>
                  <strong>{c.name}</strong>
                  <span>
                    Code {c.inviteCode} · {c.memberCount} member
                    {c.memberCount === 1 ? '' : 's'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel-stack">
          {profile?.role === 'teacher' ? (
            <form className="panel" onSubmit={onCreate}>
              <h2>Create classroom</h2>
              <label>
                Name
                <input
                  required
                  maxLength={80}
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Period 3 MUN"
                />
              </label>
              <label>
                Description
                <textarea
                  maxLength={300}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Spring conference prep"
                  rows={3}
                />
              </label>
              <label>
                Default Google Meet link (optional)
                <input
                  type="url"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                />
              </label>
              <label>
                Default Zoom link (optional)
                <input
                  type="url"
                  value={zoomLink}
                  onChange={(e) => setZoomLink(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                />
              </label>
              <button className="btn btn-primary" type="submit" disabled={busy}>
                Create classroom
              </button>
            </form>
          ) : null}

          <form className="panel" onSubmit={onJoin}>
            <h2>Join with invite code</h2>
            <p className="muted">
              Students use this to enter a class. Teachers can also join another
              teacher&apos;s room (co-advisor / guest chair).
            </p>
            <label>
              Invite code
              <input
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABC1234"
                maxLength={12}
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Join classroom
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
