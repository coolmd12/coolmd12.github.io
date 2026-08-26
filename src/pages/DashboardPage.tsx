import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { CommitteeRoomList } from '../components/CommitteeRoom/CommitteeRoomList';
import { InviteCodeShare } from '../components/InviteCodeShare';
import { useAuth } from '../contexts/AuthContext';
import {
  backfillActivityEvents,
  computeActivityUsage,
  mergeActivityEvents,
  streamActivityLog,
  syncActivityBackfillToFirestore,
} from '../services/activity';
import {
  createClassroom,
  joinClassroomByCode,
  listUserClassrooms,
} from '../services/classrooms';
import { buildCommitteeRoomDraft } from '../services/committeeRoomLogic';
import {
  closeRoom,
  createRoom,
  streamMyCommitteeRooms,
  type MyCommitteeRoom,
} from '../services/rooms';
import { isRoomClosed } from '../services/committeeRoomLogic';
import type { ActivityEvent } from '../types/activity';
import { canTeach, isParentOnly, type Classroom } from '../types';

export function DashboardPage() {
  const { profile, refreshProfile } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [committeeRooms, setCommitteeRooms] = useState<MyCommitteeRoom[]>([]);
  const [liveActivity, setLiveActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [createdRoom, setCreatedRoom] = useState<Classroom | null>(null);

  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [zoomLink, setZoomLink] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [busy, setBusy] = useState(false);

  const teacherCapable = canTeach(profile);

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

  const liveRooms = useMemo(
    () => committeeRooms.filter((r) => !isRoomClosed(r)),
    [committeeRooms],
  );
  const pastRooms = useMemo(
    () => committeeRooms.filter((r) => isRoomClosed(r)),
    [committeeRooms],
  );

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
    if (loading || roomsLoading) return;
    void syncActivityBackfillToFirestore({
      profile,
      rooms: committeeRooms,
      classrooms,
    });
  }, [profile, committeeRooms, classrooms, loading, roomsLoading]);

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

  async function onCreateCommitteeRoom(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const room = await createRoom(
        buildCommitteeRoomDraft({
          name: roomName,
          createdBy: profile.uid,
          meetingLink,
        }),
      );
      if (!room) throw new Error('Could not create the committee room.');
      setRoomName('');
      setMeetingLink('');
      setMessage(
        `Committee room “${room.name}” is ready — it stays on your dashboard until you close it.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create committee room.');
    } finally {
      setBusy(false);
    }
  }

  async function onCloseCommitteeRoom(roomId: string) {
    if (!profile) return;
    const room = committeeRooms.find((r) => r.roomId === roomId);
    const ok = window.confirm(
      `Close “${room?.name ?? 'this room'}”? It will leave everyone’s live list. Recess does not close a room — only this does.`,
    );
    if (!ok) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await closeRoom(roomId, profile.uid);
      setMessage('Committee room closed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not close room.');
    } finally {
      setBusy(false);
    }
  }

  function emptyStateCopy() {
    if (teacherCapable) {
      return 'No classrooms yet. Create your first classroom, or join another room with an invite code.';
    }
    return 'No classrooms yet. Ask your teacher for an invite code to join.';
  }

  if (profile && isParentOnly(profile)) {
    return <Navigate to="/family" replace />;
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

      <ActivityTimeline
        events={activityEvents}
        stats={activityStats}
        loading={activityLoading || roomsLoading || loading}
      />

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
          <div className="rooms-section">
            <h2>Your committee rooms</h2>
            <p className="muted">
              Live rooms stay here until closed. Past rooms are listed below after you close them.
            </p>
            {profile ? (
              <CommitteeRoomList
                rooms={liveRooms}
                userId={profile.uid}
                loading={roomsLoading}
                busy={busy}
                onCloseRoom={(id) => void onCloseCommitteeRoom(id)}
              />
            ) : null}
          </div>
          <div className="rooms-section">
            <h2>Past rooms</h2>
            <p className="muted">Closed sessions you’ve hosted or joined.</p>
            {profile ? (
              <CommitteeRoomList
                rooms={pastRooms}
                userId={profile.uid}
                loading={roomsLoading}
                busy={busy}
                past
                emptyMessage="No past rooms yet. When you close a live room, it shows up here."
              />
            ) : null}
          </div>
          <p className="panel-footer-link">
            <Link to="/rooms">Open rooms hub</Link>
          </p>
        </div>

        <div className="panel">
          <h2>Your classrooms</h2>
          {loading ? <p className="muted">Loading…</p> : null}
          {!loading && classrooms.length === 0 ? (
            <p className="muted">{emptyStateCopy()}</p>
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
          {teacherCapable ? (
            <form className="panel" onSubmit={onCreate}>
              <h2>Create classroom</h2>
              <label>
                Name
                <input
                  required
                  maxLength={80}
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="ex: Period 3 MUN"
                />
              </label>
              <label>
                Description
                <textarea
                  maxLength={300}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ex: Spring conference prep"
                  rows={3}
                />
              </label>
              <label>
                Default Google Meet link (optional)
                <input
                  type="url"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  placeholder="ex: https://meet.google.com/abc-defg-hij"
                />
              </label>
              <label>
                Default Zoom link (optional)
                <input
                  type="url"
                  value={zoomLink}
                  onChange={(e) => setZoomLink(e.target.value)}
                  placeholder="ex: https://zoom.us/j/1234567890"
                />
              </label>
              <button className="btn btn-primary" type="submit" disabled={busy}>
                Create classroom
              </button>
            </form>
          ) : null}

          <form className="panel" onSubmit={onCreateCommitteeRoom}>
            <h2>Create committee room</h2>
            <p className="muted">
              Open to anyone with a GoMUN account — share the link after you create it. Joiners
              pick chair or delegate when they enter.
            </p>
            <label>
              Room name
              <input
                required
                maxLength={80}
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="ex: GA Committee"
              />
            </label>
            <label>
              Meeting link (optional)
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="ex: https://meet.google.com/… or Zoom link"
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Create room
            </button>
          </form>

          <form className="panel" onSubmit={onJoin}>
            <h2>Join with invite code</h2>
            <p className="muted">
              {teacherCapable
                ? 'Enter another teacher’s room as a delegate (or guest). Creating a room is above — joining does not make you the owner.'
                : 'Enter the code your teacher shared. You’ll join as a delegate in that classroom.'}
            </p>
            <label>
              Invite code
              <input
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ex: ABC1234"
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
