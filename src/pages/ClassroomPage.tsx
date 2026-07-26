import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { InviteCodeShare } from '../components/InviteCodeShare';
import { useAuth } from '../contexts/AuthContext';
import { getClassroom, listClassroomMembers } from '../services/classrooms';
import type { Classroom, ClassroomMember } from '../types';

export function ClassroomPage() {
  const { classroomId = '' } = useParams();
  const { profile } = useAuth();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [members, setMembers] = useState<ClassroomMember[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const room = await getClassroom(classroomId);
        if (!room) throw new Error('Classroom not found or you do not have access.');
        const memberList = await listClassroomMembers(classroomId);
        if (!cancelled) {
          setClassroom(room);
          setMembers(memberList);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load classroom.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  if (loading) {
    return (
      <main className="shell page-loading">
        <p>Opening committee chamber…</p>
      </main>
    );
  }

  if (error || !classroom) {
    return (
      <main className="shell">
        <p className="banner error">{error || 'Not found'}</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </main>
    );
  }

  const isOwner = profile?.uid === classroom.teacherId;

  return (
    <main className="shell classroom-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Private classroom</p>
          <h1>{classroom.name}</h1>
          <p className="muted">{classroom.description || 'No description yet.'}</p>
        </div>
        {isOwner ? (
          <InviteCodeShare code={classroom.inviteCode} classroomName={classroom.name} />
        ) : (
          <div className="invite-box">
            <span>You’re in this room as a delegate</span>
            <strong>Ask your teacher if you need the invite code</strong>
          </div>
        )}
      </header>

      {error ? <p className="banner error">{error}</p> : null}

      <section className="dash-grid">
        <div className="panel">
          <h2>Members</h2>
          <ul className="member-list">
            {members.map((m) => {
              const initials = m.displayName
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase() || '')
                .join('') || '?';
              return (
                <li key={m.uid} className="member-row">
                  <span className="avatar avatar-sm" aria-hidden="true">
                    {m.photoURL ? <img src={m.photoURL} alt="" /> : <span>{initials}</span>}
                  </span>
                  <strong>{m.displayName}</strong>
                  <span>{m.role}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="panel-stack">
          <div className="panel">
            <h2>Meeting links</h2>
          <p className="muted">
            {isOwner
              ? 'Paste Meet or Zoom URLs for your class. Embedding video SDKs can come later without blocking practice.'
              : 'Join the Meet or Zoom link your teacher set — then head to practice when the room is ready.'}
          </p>
          <ul className="link-list">
            <li>
              Google Meet:{' '}
              {classroom.defaultMeetLink ? (
                <a href={classroom.defaultMeetLink} target="_blank" rel="noreferrer">
                  Open Meet
                </a>
              ) : (
                <span className="muted">Not set</span>
              )}
            </li>
            <li>
              Zoom:{' '}
              {classroom.defaultZoomLink ? (
                <a href={classroom.defaultZoomLink} target="_blank" rel="noreferrer">
                  Open Zoom
                </a>
              ) : (
                <span className="muted">Not set</span>
              )}
            </li>
          </ul>
            {isOwner ? (
              <p className="muted">Teachers can edit default links from future settings.</p>
            ) : null}
            <Link className="btn btn-secondary" to="/practice">
              {isOwner ? 'Open practice hub' : 'Go to practice'}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
