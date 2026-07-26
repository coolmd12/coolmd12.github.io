import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { buildSpeakerQueue, type CommitteeQueueEntry } from '../services/committeeRoomLogic';
import { streamRoom } from '../services/rooms';
import type { Room } from '../types/committee';

const initialQueue: CommitteeQueueEntry[] = [
  { id: 'q1', userId: 'delegate-1', displayName: 'Ava Patel', role: 'delegate' },
  { id: 'q2', userId: 'delegate-2', displayName: 'Jordan Kim', role: 'delegate' },
  { id: 'q3', userId: 'chair-1', displayName: 'Ms. Rivera', role: 'chair' },
];

const CommitteeRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { profile } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<CommitteeQueueEntry[]>(initialQueue);

  useEffect(() => {
    if (!roomId) {
      setError('Room ID is missing.');
      setLoading(false);
      return;
    }

    const unsubscribe = streamRoom(roomId, (currentRoom) => {
      if (currentRoom) {
        setRoom(currentRoom);
      } else {
        setError('Room not found or inaccessible.');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const queueView = useMemo(() => buildSpeakerQueue(queue), [queue]);
  const isChair = profile?.uid === room?.chairId || profile?.roles?.includes('teacher');

  const addToQueue = () => {
    if (!profile?.displayName) return;
    setQueue((current) => [
      ...current,
      {
        id: `q${Date.now()}`,
        userId: profile.uid,
        displayName: profile.displayName,
        role: isChair ? 'chair' : 'delegate',
      },
    ]);
  };

  const advanceQueue = () => {
    setQueue((current) => current.slice(1));
  };

  if (loading) {
    return <main className="shell page-loading">Loading room...</main>;
  }

  if (error) {
    return <main className="shell"><p className="banner error">{error}</p></main>;
  }

  if (!room) {
    return <main className="shell">No room data available.</main>;
  }

  return (
    <main className="shell committee-room-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Live committee room</p>
          <h1>{room.name}</h1>
          <p className="muted">Status: {room.currentStatus.replace(/_/g, ' ')}</p>
        </div>
        <div className="panel panel-inline">
          <strong>{isChair ? 'Chair controls' : 'Delegate view'}</strong>
          <p className="muted">The room starts with a simple speaker queue and motion-ready layout.</p>
        </div>
      </header>

      <section className="dash-grid">
        <div className="panel">
          <h2>Speaker queue</h2>
          <ol className="member-list">
            {queueView.map((entry) => (
              <li key={entry.id} className="member-row">
                <strong>{entry.displayName}</strong>
                <span>{entry.role}</span>
                <span>#{entry.position}</span>
              </li>
            ))}
          </ol>
          <div className="profile-avatar-actions" style={{ marginTop: '1rem' }}>
            {isChair ? (
              <>
                <button className="btn btn-secondary" onClick={advanceQueue} type="button">
                  Advance speaker
                </button>
                <button className="btn btn-primary" onClick={addToQueue} type="button">
                  Add current user to queue
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={addToQueue} type="button">
                Request to speak
              </button>
            )}
          </div>
        </div>

        <div className="panel">
          <h2>Motion tools</h2>
          <p className="muted">Moderated caucus, unmoderated caucus, and adjourn are ready for the next build step.</p>
          <ul className="link-list">
            <li>Moderated caucus</li>
            <li>Unmoderated caucus</li>
            <li>Adjourn</li>
          </ul>
          <p className="muted">This first slice focuses on queue visibility and room state, keeping the path toward real-time motions clear.</p>
        </div>
      </section>
    </main>
  );
};

export default CommitteeRoomPage;
