import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CommitteeRoomList } from '../components/CommitteeRoom/CommitteeRoomList';
import { useAuth } from '../contexts/AuthContext';
import { buildCommitteeRoomDraft } from '../services/committeeRoomLogic';
import {
  closeRoom,
  createRoom,
  streamMyCommitteeRooms,
  type MyCommitteeRoom,
} from '../services/rooms';

export default function RoomsPage() {
  const { user, profile } = useAuth();
  const [committeeRooms, setCommitteeRooms] = useState<MyCommitteeRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomName, setRoomName] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!profile?.uid) {
      setCommitteeRooms([]);
      setRoomsLoading(false);
      return;
    }
    setRoomsLoading(true);
    return streamMyCommitteeRooms(profile.uid, (rooms) => {
      setCommitteeRooms(rooms);
      setRoomsLoading(false);
    });
  }, [profile?.uid]);

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
      setMessage(`Created “${room.name}”. It stays listed until you close it.`);
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
      `Close “${room?.name ?? 'this room'}”? It will leave everyone’s live list.`,
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

  return (
    <main className="shell">
      <header className="page-header">
        <div>
          <h1>Live committee rooms</h1>
          <p className="muted">
            Open procedure floors for any GoMUN account — create a room, share the link, pick chair
            or delegate when you join. Rooms you host or join stay listed until closed.
          </p>
        </div>
      </header>

      {error ? <p className="banner error">{error}</p> : null}
      {message ? <p className="banner ok">{message}</p> : null}

      {!user ? (
        <section className="panel">
          <h2>Get started</h2>
          <p className="muted">Sign in to create or reopen your live committee rooms.</p>
          <Link to="/signup" className="btn btn-primary">
            Create a free account
          </Link>
        </section>
      ) : (
        <section className="dash-grid">
          <div className="panel">
            <h2>Your rooms</h2>
            <p className="muted">Hosted and joined — survives refresh. Recess ≠ closed.</p>
            {profile ? (
              <CommitteeRoomList
                rooms={committeeRooms}
                userId={profile.uid}
                loading={roomsLoading}
                busy={busy}
                onCloseRoom={(id) => void onCloseCommitteeRoom(id)}
              />
            ) : null}
          </div>

          <form className="panel" onSubmit={(e) => void onCreateCommitteeRoom(e)}>
            <h2>Create committee room</h2>
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
            <button className="btn btn-primary" type="submit" disabled={busy || !profile}>
              Create room
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
