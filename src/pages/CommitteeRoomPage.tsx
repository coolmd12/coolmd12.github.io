import React, { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { RoomChat } from '../components/CommitteeRoom/RoomChat';
import { useAuth } from '../contexts/AuthContext';
import {
  isCommitteeAudioUnlocked,
  playGavelTaps,
  playTimerEndChime,
  playTimerWarningTick,
  subscribeCommitteeAudioUnlock,
  unlockCommitteeAudio,
} from '../lib/gavelAudio';
import {
  buildSpeakerQueue,
  formatSeatLabel,
  formatTimerClock,
  isRoomClosed,
  motionTypeLabel,
  remainingTimerSeconds,
  tallyVotes,
} from '../services/committeeRoomLogic';
import {
  castMotionVote,
  closeMotionVote,
  openMotionVote,
  proposeMotion,
  streamMotions,
} from '../services/motions';
import {
  advanceSpeakerQueue,
  clearSpeakerTimer,
  closeRoom,
  joinRoom,
  pauseSpeakerTimer,
  recognizeSpeaker,
  resumeSpeakerTimer,
  setPlacard,
  setRoomSessionStatus,
  startSpeakerTimer,
  streamParticipants,
  streamRoom,
  strikeGavel,
  updateSeat,
} from '../services/rooms';
import type {
  Motion,
  MotionType,
  Participant,
  ProceduralVote,
  Room,
  SessionRole,
} from '../types/committee';

const CommitteeRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { profile } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [motions, setMotions] = useState<Motion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  const [joinRole, setJoinRole] = useState<SessionRole>('delegate');
  const [country, setCountry] = useState('');
  const [chairName, setChairName] = useState('');

  const [editRole, setEditRole] = useState<SessionRole>('delegate');
  const [editCountry, setEditCountry] = useState('');
  const [editChairName, setEditChairName] = useState('');
  const [editingSeat, setEditingSeat] = useState(false);

  const [timerDuration, setTimerDuration] = useState(60);
  const [motionType, setMotionType] = useState<MotionType>('moderated_caucus');
  const [motionTopic, setMotionTopic] = useState('');
  const [motionTotalMinutes, setMotionTotalMinutes] = useState(10);
  const [motionSpeakerSeconds, setMotionSpeakerSeconds] = useState(60);
  const [audioReady, setAudioReady] = useState(isCommitteeAudioUnlocked);
  const lastHeardGavelAt = useRef<number | null>(null);
  const lastTimerWarningId = useRef<string | null>(null);
  const lastTimerEndId = useRef<string | null>(null);
  const prevTimerSeconds = useRef<number | null>(null);

  useEffect(() => {
    if (!roomId) {
      setError('Room ID is missing.');
      setLoading(false);
      return;
    }

    const unsubRoom = streamRoom(roomId, (currentRoom) => {
      if (currentRoom) {
        setRoom(currentRoom);
        setError(null);
      } else {
        setError('Room not found or inaccessible.');
      }
      setLoading(false);
    });

    const unsubParticipants = streamParticipants(roomId, setParticipants);
    const unsubMotions = streamMotions(roomId, setMotions);

    return () => {
      unsubRoom();
      unsubParticipants();
      unsubMotions();
    };
  }, [roomId]);

  useEffect(() => {
    return subscribeCommitteeAudioUnlock(setAudioReady);
  }, []);

  // Browsers block sound until a gesture — unlock on first click/key in the room.
  useEffect(() => {
    if (audioReady) return;
    const onGesture = () => {
      void unlockCommitteeAudio();
    };
    window.addEventListener('pointerdown', onGesture, { once: true });
    window.addEventListener('keydown', onGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, [audioReady]);

  useEffect(() => {
    if (profile?.displayName && !chairName) {
      setChairName(profile.displayName);
    }
  }, [profile?.displayName, chairName]);

  const me = useMemo(
    () => participants.find((p) => p.userId === profile?.uid) ?? null,
    [participants, profile?.uid],
  );

  useEffect(() => {
    if (!me) return;
    setEditRole(me.role);
    setEditCountry(me.country ?? me.displayName);
    setEditChairName(me.role === 'chair' ? me.displayName : profile?.displayName ?? '');
  }, [me, profile?.displayName]);

  useEffect(() => {
    if (room?.settings.defaultSpeakerTime) {
      setTimerDuration(room.settings.defaultSpeakerTime);
    }
  }, [room?.settings.defaultSpeakerTime]);

  useEffect(() => {
    if (room?.activeTimer?.status !== 'running') return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [room?.activeTimer?.status, room?.activeTimer?.timerId]);

  useEffect(() => {
    const pulse = room?.lastGavel;
    if (!pulse?.at) return;
    if (lastHeardGavelAt.current === null) {
      // Skip historical pulse when first loading the room.
      lastHeardGavelAt.current = pulse.at;
      return;
    }
    if (pulse.at === lastHeardGavelAt.current) return;
    lastHeardGavelAt.current = pulse.at;
    void playGavelTaps(1);
  }, [room?.lastGavel]);

  const timerSeconds = remainingTimerSeconds(room?.activeTimer, now);

  useEffect(() => {
    const timer = room?.activeTimer;
    const timerId = timer?.timerId ?? null;
    const prev = prevTimerSeconds.current;

    // Skip the first sample so refreshing mid-timer does not false-chime.
    if (prev === null) {
      prevTimerSeconds.current = timerSeconds;
      return;
    }
    prevTimerSeconds.current = timerSeconds;

    if (!timer || timer.status !== 'running' || !timerId) return;

    // One warning tick when crossing at/under 10 seconds.
    if (
      timerSeconds <= 10 &&
      timerSeconds > 0 &&
      prev > 10 &&
      lastTimerWarningId.current !== timerId
    ) {
      lastTimerWarningId.current = timerId;
      void playTimerWarningTick();
    }

    // End chime once when the clock hits zero.
    if (timerSeconds === 0 && prev > 0 && lastTimerEndId.current !== timerId) {
      lastTimerEndId.current = timerId;
      void playTimerEndChime();
    }
  }, [room?.activeTimer, timerSeconds]);

  const isSessionChair = me?.role === 'chair';
  const canCloseRoom =
    Boolean(profile && room && (room.createdBy === profile.uid || room.chairId === profile.uid));
  const placardsUp = participants.filter((p) => p.raisedPlacard);
  const queueEntries = useMemo(
    () => buildSpeakerQueue(room?.speakerQueue ?? [], participants),
    [room?.speakerQueue, participants],
  );
  const currentSpeaker = queueEntries[0] ?? null;
  const currentSpeakerLabel = currentSpeaker
    ? formatSeatLabel(currentSpeaker.role, currentSpeaker.displayName)
    : 'Speaker';
  const activeMotion = motions.find((m) => m.motionId === room?.activeMotionId) ?? null;
  const proposedMotions = motions.filter((m) => m.status === 'proposed');
  const recentMotions = motions.filter((m) => m.status === 'passed' || m.status === 'failed').slice(0, 5);
  const shareUrl =
    typeof window !== 'undefined' && roomId ? `${window.location.origin}/room/${roomId}` : '';

  async function onJoin(e: FormEvent) {
    e.preventDefault();
    if (!profile || !roomId) return;
    setBusy(true);
    setActionError('');
    try {
      await unlockCommitteeAudio();
      await joinRoom({
        roomId,
        userId: profile.uid,
        role: joinRole,
        profileDisplayName: profile.displayName,
        chairName: joinRole === 'chair' ? chairName : undefined,
        country: joinRole === 'delegate' ? country : undefined,
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not join room.');
    } finally {
      setBusy(false);
    }
  }

  async function onSaveSeat(e: FormEvent) {
    e.preventDefault();
    if (!profile || !roomId) return;
    setBusy(true);
    setActionError('');
    try {
      await updateSeat({
        roomId,
        userId: profile.uid,
        role: editRole,
        profileDisplayName: profile.displayName,
        chairName: editRole === 'chair' ? editChairName : undefined,
        country: editRole === 'delegate' ? editCountry : undefined,
      });
      setEditingSeat(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update seat.');
    } finally {
      setBusy(false);
    }
  }

  async function onTogglePlacard() {
    if (!profile || !roomId || !me) return;
    setBusy(true);
    setActionError('');
    try {
      await setPlacard(roomId, profile.uid, !me.raisedPlacard);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update placard.');
    } finally {
      setBusy(false);
    }
  }

  async function onRecognize(userId: string) {
    if (!roomId) return;
    setBusy(true);
    setActionError('');
    try {
      await recognizeSpeaker(roomId, userId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not recognize speaker.');
    } finally {
      setBusy(false);
    }
  }

  async function onAdvance() {
    if (!roomId) return;
    setBusy(true);
    setActionError('');
    try {
      await advanceSpeakerQueue(roomId, currentSpeakerLabel);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not advance queue.');
    } finally {
      setBusy(false);
    }
  }

  async function onStartTimer() {
    if (!roomId) return;
    setBusy(true);
    setActionError('');
    try {
      await startSpeakerTimer(roomId, timerDuration, currentSpeaker?.userId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not start timer.');
    } finally {
      setBusy(false);
    }
  }

  async function onPauseTimer() {
    if (!roomId) return;
    setBusy(true);
    try {
      await pauseSpeakerTimer(roomId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not pause timer.');
    } finally {
      setBusy(false);
    }
  }

  async function onResumeTimer() {
    if (!roomId) return;
    setBusy(true);
    try {
      await resumeSpeakerTimer(roomId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not resume timer.');
    } finally {
      setBusy(false);
    }
  }

  async function onClearTimer() {
    if (!roomId) return;
    setBusy(true);
    try {
      await clearSpeakerTimer(roomId, currentSpeakerLabel);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not clear timer.');
    } finally {
      setBusy(false);
    }
  }

  async function onGavel() {
    if (!roomId || !profile) return;
    setBusy(true);
    setActionError('');
    try {
      await unlockCommitteeAudio();
      await playGavelTaps(1);
      const at = await strikeGavel(roomId, profile.uid);
      lastHeardGavelAt.current = at;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not strike gavel.');
    } finally {
      setBusy(false);
    }
  }

  async function onSessionStatus(status: 'open' | 'recess') {
    if (!roomId) return;
    setBusy(true);
    setActionError('');
    try {
      await setRoomSessionStatus(roomId, status);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update session.');
    } finally {
      setBusy(false);
    }
  }

  async function onCloseRoom() {
    if (!roomId || !profile || !room) return;
    const ok = window.confirm(
      `Close “${room.name}”? It will leave everyone’s live dashboard list. This is different from recess.`,
    );
    if (!ok) return;
    setBusy(true);
    setActionError('');
    try {
      await closeRoom(roomId, profile.uid);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not close room.');
    } finally {
      setBusy(false);
    }
  }

  async function onEnableSound() {
    const ok = await unlockCommitteeAudio();
    if (!ok) {
      setActionError('Could not enable sound. Check that your tab is not muted.');
    }
  }

  async function onProposeMotion(e: FormEvent) {
    e.preventDefault();
    if (!profile || !roomId || !me) return;
    setBusy(true);
    setActionError('');
    try {
      await proposeMotion({
        roomId,
        proposerId: profile.uid,
        proposerLabel: formatSeatLabel(me.role, me.displayName),
        type: motionType,
        topic: motionType === 'moderated_caucus' ? motionTopic : undefined,
        totalDuration:
          motionType === 'adjourn' ? undefined : Math.max(1, motionTotalMinutes) * 60,
        speakerTime:
          motionType === 'moderated_caucus' ? Math.max(1, motionSpeakerSeconds) : undefined,
      });
      setMotionTopic('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not propose motion.');
    } finally {
      setBusy(false);
    }
  }

  async function onOpenVote(motionId: string) {
    if (!roomId) return;
    setBusy(true);
    setActionError('');
    try {
      await openMotionVote(roomId, motionId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not open voting.');
    } finally {
      setBusy(false);
    }
  }

  async function onVote(vote: ProceduralVote) {
    if (!roomId || !profile || !activeMotion) return;
    setBusy(true);
    setActionError('');
    try {
      await castMotionVote(roomId, activeMotion.motionId, profile.uid, vote);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not cast vote.');
    } finally {
      setBusy(false);
    }
  }

  async function onCloseVote() {
    if (!roomId || !activeMotion) return;
    setBusy(true);
    setActionError('');
    try {
      await closeMotionVote(roomId, activeMotion.motionId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not close vote.');
    } finally {
      setBusy(false);
    }
  }

  async function copyShareLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setActionError('');
    } catch {
      setActionError('Could not copy link — copy it from the address bar.');
    }
  }

  if (loading) {
    return <main className="shell page-loading">Loading room…</main>;
  }

  if (error) {
    return (
      <main className="shell">
        <p className="banner error">{error}</p>
      </main>
    );
  }

  if (!room) {
    return <main className="shell">No room data available.</main>;
  }

  if (isRoomClosed(room)) {
    return (
      <main className="shell committee-room-page">
        <header className="page-header">
          <div>
            <p className="eyebrow">Committee room</p>
            <h1>{room.name}</h1>
            <p className="muted">This room has been closed by the host or chair.</p>
          </div>
        </header>
        <p className="banner warn">
          It no longer appears on live dashboards. Create a new room from the dashboard or rooms hub
          if you need another session.
        </p>
        <Link className="btn btn-secondary" to="/dashboard">
          Back to dashboard
        </Link>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="shell committee-room-page">
        <header className="page-header">
          <div>
            <p className="eyebrow">Join committee room</p>
            <h1>{room.name}</h1>
            <p className="muted">Pick your role for this session, then enter the floor.</p>
          </div>
        </header>

        {actionError ? <p className="banner error">{actionError}</p> : null}

        <form className="panel" onSubmit={onJoin} style={{ maxWidth: '28rem' }}>
          <h2>Enter as</h2>
          <label>
            Role
            <select
              value={joinRole}
              onChange={(e) => setJoinRole(e.target.value as SessionRole)}
            >
              <option value="delegate">Delegate</option>
              <option value="chair">Chair</option>
            </select>
          </label>
          {joinRole === 'delegate' ? (
            <label>
              Country
              <input
                required
                maxLength={80}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="ex: Brazil"
              />
            </label>
          ) : (
            <label>
              Chair name
              <input
                required
                maxLength={80}
                value={chairName}
                onChange={(e) => setChairName(e.target.value)}
                placeholder="ex: Ms. Rivera"
              />
            </label>
          )}
          <p className="muted">Only one chair per room. You can edit your seat after joining.</p>
          <button className="btn btn-primary" type="submit" disabled={busy || !profile}>
            Join room
          </button>
        </form>
      </main>
    );
  }

  const myVote = activeMotion && profile ? activeMotion.votes?.[profile.uid] : undefined;
  const voteTally = activeMotion ? tallyVotes(activeMotion.votes) : null;

  return (
    <main className="shell committee-room-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Live committee room</p>
          <h1>{room.name}</h1>
          <p className="muted">
            Status: <strong>{room.currentStatus.replace(/_/g, ' ')}</strong> · You are{' '}
            <strong>{formatSeatLabel(me.role, me.displayName)}</strong>
          </p>
          {room.meetingLink ? (
            <p>
              <a href={room.meetingLink} target="_blank" rel="noreferrer">
                Open meeting link
              </a>
            </p>
          ) : null}
          {room.activeCaucus ? (
            <p className="muted">
              Active caucus: {room.activeCaucus.type}
              {room.activeCaucus.topic ? ` — ${room.activeCaucus.topic}` : ''} (chair starts
              timers manually)
            </p>
          ) : null}
        </div>
        <div className="panel panel-inline">
          <strong>Invite others</strong>
          <p className="muted">Anyone with a GoMUN account can join this open room.</p>
          <button className="btn btn-secondary" type="button" onClick={() => void copyShareLink()}>
            Copy room link
          </button>
          {!audioReady ? (
            <div className="profile-avatar-actions" style={{ marginTop: '0.75rem' }}>
              <button className="btn btn-primary" type="button" onClick={() => void onEnableSound()}>
                Enable sound
              </button>
              <p className="muted" style={{ margin: 0 }}>
                Browsers block gavel/timer sounds until you allow audio.
              </p>
            </div>
          ) : (
            <p className="muted" style={{ marginTop: '0.75rem' }}>
              Sound on — gavel + timer cues enabled.
            </p>
          )}
          {isSessionChair ? (
            <div className="profile-avatar-actions" style={{ marginTop: '0.75rem' }}>
              {room.currentStatus === 'recess' ? (
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={busy}
                  onClick={() => void onSessionStatus('open')}
                >
                  Start / resume session
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={busy}
                  onClick={() => void onSessionStatus('recess')}
                >
                  End session (recess)
                </button>
              )}
              <button
                className="btn btn-primary"
                type="button"
                disabled={busy}
                onClick={() => void onGavel()}
              >
                Gavel
              </button>
              {canCloseRoom ? (
                <button
                  className="btn btn-ghost-dark"
                  type="button"
                  disabled={busy}
                  onClick={() => void onCloseRoom()}
                >
                  Close room
                </button>
              ) : null}
            </div>
          ) : canCloseRoom ? (
            <div className="profile-avatar-actions" style={{ marginTop: '0.75rem' }}>
              <button
                className="btn btn-ghost-dark"
                type="button"
                disabled={busy}
                onClick={() => void onCloseRoom()}
              >
                Close room
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {actionError ? <p className="banner error">{actionError}</p> : null}
      {room.currentStatus === 'recess' ? (
        <p className="banner warn">
          Session is in recess. {isSessionChair ? 'Use Start / resume session when ready.' : 'Wait for the chair to resume.'}
        </p>
      ) : null}

      <section className="dash-grid">
        {!isSessionChair ? (
          <div className="panel">
            <h2>Your actions</h2>
            <p className="muted">Raise your placard to seek the floor. Vote when a motion is open.</p>
            <div className="profile-avatar-actions">
              <button
                className="btn btn-primary"
                onClick={() => void onTogglePlacard()}
                type="button"
                disabled={busy}
              >
                {me.raisedPlacard ? 'Lower placard' : 'Raise placard'}
              </button>
            </div>
            {me.raisedPlacard ? <p className="muted">Placard is up — waiting for the chair.</p> : null}
          </div>
        ) : null}

        <div className="panel">
          <h2>Speaker timer</h2>
          <p className="committee-timer">{formatTimerClock(timerSeconds)}</p>
          <p className="muted">
            {currentSpeaker ? `Floor: ${currentSpeakerLabel}` : 'No one on the floor yet.'}
            {room.activeTimer ? ` · ${room.activeTimer.status}` : ''}
          </p>
          {isSessionChair ? (
            <>
              <label>
                Duration (seconds)
                <input
                  type="number"
                  min={1}
                  max={3600}
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(Number(e.target.value) || 1)}
                />
              </label>
              <div className="profile-avatar-actions">
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={busy}
                  onClick={() => void onStartTimer()}
                >
                  Start
                </button>
                {room.activeTimer?.status === 'running' ? (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={busy}
                    onClick={() => void onPauseTimer()}
                  >
                    Pause
                  </button>
                ) : null}
                {room.activeTimer?.status === 'paused' ? (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={busy}
                    onClick={() => void onResumeTimer()}
                  >
                    Resume
                  </button>
                ) : null}
                {room.activeTimer ? (
                  <button
                    className="btn btn-ghost-dark"
                    type="button"
                    disabled={busy}
                    onClick={() => void onClearTimer()}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <div>
                <h3>Unused time bank</h3>
                <p className="muted">
                  Total leftover:{' '}
                  <strong>
                    {formatTimerClock(room.speechTimeBank?.totalUnusedSeconds ?? 0)}
                  </strong>{' '}
                  (practice aid — not official RoP pooling)
                </p>
                {(room.speechTimeBank?.entries ?? []).length === 0 ? (
                  <p className="muted">No leftover entries yet. Clear/advance early to log time.</p>
                ) : (
                  <ul className="member-list">
                    {[...(room.speechTimeBank?.entries ?? [])].reverse().slice(0, 8).map((entry) => (
                      <li key={`${entry.at}-${entry.userId}`} className="member-row">
                        <strong>{entry.label}</strong>
                        <span>{formatTimerClock(entry.unusedSeconds)} left</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <p className="muted">Live clock for everyone — chair controls start / pause / clear.</p>
          )}
        </div>

        <div className="panel">
          <h2>Speaker queue</h2>
          {queueEntries.length === 0 ? (
            <p className="muted">No speakers yet. Raise a placard, then the chair recognizes you.</p>
          ) : (
            <ol className="member-list">
              {queueEntries.map((entry) => (
                <li key={entry.id} className="member-row">
                  <strong>{formatSeatLabel(entry.role, entry.displayName)}</strong>
                  <span>#{entry.position}</span>
                </li>
              ))}
            </ol>
          )}
          <div className="profile-avatar-actions" style={{ marginTop: '1rem' }}>
            {isSessionChair ? (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => void onAdvance()}
                  type="button"
                  disabled={busy || queueEntries.length === 0}
                >
                  Advance speaker
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => void onTogglePlacard()}
                  type="button"
                  disabled={busy}
                >
                  {me.raisedPlacard ? 'Lower placard' : 'Raise placard'}
                </button>
              </>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Use <strong>Your actions</strong> to raise or lower your placard.
              </p>
            )}
          </div>
        </div>

        <div className="panel">
          <h2>Placards up</h2>
          {placardsUp.length === 0 ? (
            <p className="muted">No placards raised.</p>
          ) : (
            <ul className="member-list">
              {placardsUp.map((p) => (
                <li key={p.userId} className="member-row">
                  <strong>{formatSeatLabel(p.role, p.displayName)}</strong>
                  {isSessionChair ? (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      disabled={busy}
                      onClick={() => void onRecognize(p.userId)}
                    >
                      Recognize
                    </button>
                  ) : (
                    <span>waiting</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <h2>Motions</h2>
          <p className="muted">
            Propose verbally and log it here. Multiple motions can wait; chair opens one vote at a
            time. Procedural votes are yes/no only.
          </p>

          {activeMotion ? (
            <div className="panel" style={{ boxShadow: 'none', marginBottom: '0.75rem' }}>
              <h3>On the floor: {motionTypeLabel(activeMotion.type)}</h3>
              <p className="muted">
                Proposed by {activeMotion.proposerLabel}
                {activeMotion.topic ? ` · ${activeMotion.topic}` : ''}
                {activeMotion.totalDuration
                  ? ` · ${Math.round(activeMotion.totalDuration / 60)} min`
                  : ''}
                {activeMotion.speakerTime ? ` · ${activeMotion.speakerTime}s speakers` : ''}
              </p>
              <div className="profile-avatar-actions">
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={busy}
                  onClick={() => void onVote('yes')}
                >
                  Vote yes{myVote === 'yes' ? ' ✓' : ''}
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={busy}
                  onClick={() => void onVote('no')}
                >
                  Vote no{myVote === 'no' ? ' ✓' : ''}
                </button>
              </div>
              {isSessionChair && voteTally ? (
                <>
                  <p>
                    Tally (chair only): <strong>{voteTally.yes}</strong> yes ·{' '}
                    <strong>{voteTally.no}</strong> no · {voteTally.total} voted
                  </p>
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={busy}
                    onClick={() => void onCloseVote()}
                  >
                    Close vote
                  </button>
                </>
              ) : (
                <p className="muted">
                  {myVote ? `You voted ${myVote}.` : 'Cast your vote.'} Running tally is chair-only
                  until the vote closes.
                </p>
              )}
            </div>
          ) : null}

          <form onSubmit={onProposeMotion}>
            <h3>Propose a motion</h3>
            <label>
              Type
              <select
                value={motionType}
                onChange={(e) => setMotionType(e.target.value as MotionType)}
              >
                <option value="moderated_caucus">Moderated caucus</option>
                <option value="unmoderated_caucus">Unmoderated caucus</option>
                <option value="adjourn">Adjourn</option>
              </select>
            </label>
            {motionType === 'moderated_caucus' ? (
              <>
                <label>
                  Topic
                  <input
                    required
                    maxLength={120}
                    value={motionTopic}
                    onChange={(e) => setMotionTopic(e.target.value)}
                    placeholder="ex: water access"
                  />
                </label>
                <label>
                  Total length (minutes)
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={motionTotalMinutes}
                    onChange={(e) => setMotionTotalMinutes(Number(e.target.value) || 1)}
                  />
                </label>
                <label>
                  Speaker time (seconds)
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={motionSpeakerSeconds}
                    onChange={(e) => setMotionSpeakerSeconds(Number(e.target.value) || 1)}
                  />
                </label>
              </>
            ) : null}
            {motionType === 'unmoderated_caucus' ? (
              <label>
                Total length (minutes)
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={motionTotalMinutes}
                  onChange={(e) => setMotionTotalMinutes(Number(e.target.value) || 1)}
                />
              </label>
            ) : null}
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Log motion
            </button>
          </form>

          <h3>Proposed</h3>
          {proposedMotions.length === 0 ? (
            <p className="muted">No proposed motions waiting.</p>
          ) : (
            <ul className="member-list">
              {proposedMotions.map((m) => (
                <li key={m.motionId} className="member-row">
                  <strong>
                    {motionTypeLabel(m.type)}
                    {m.topic ? ` — ${m.topic}` : ''}
                  </strong>
                  <span>{m.proposerLabel}</span>
                  {isSessionChair && !activeMotion ? (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      disabled={busy}
                      onClick={() => void onOpenVote(m.motionId)}
                    >
                      Open vote
                    </button>
                  ) : (
                    <span>{activeMotion ? 'wait' : ''}</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {recentMotions.length > 0 ? (
            <>
              <h3>Recent results</h3>
              <ul className="member-list">
                {recentMotions.map((m) => {
                  const t = tallyVotes(m.votes);
                  return (
                    <li key={m.motionId} className="member-row">
                      <strong>
                        {motionTypeLabel(m.type)} — {m.status}
                      </strong>
                      <span>
                        {t.yes}–{t.no}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </div>

        <div className="panel">
          <h2>Your seat</h2>
          {!editingSeat ? (
            <>
              <p>
                <strong>{formatSeatLabel(me.role, me.displayName)}</strong>
              </p>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setEditingSeat(true)}
              >
                Edit role / name
              </button>
            </>
          ) : (
            <form onSubmit={onSaveSeat}>
              <label>
                Role
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as SessionRole)}
                >
                  <option value="delegate">Delegate</option>
                  <option value="chair">Chair</option>
                </select>
              </label>
              {editRole === 'delegate' ? (
                <label>
                  Country
                  <input
                    required
                    maxLength={80}
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                  />
                </label>
              ) : (
                <label>
                  Chair name
                  <input
                    required
                    maxLength={80}
                    value={editChairName}
                    onChange={(e) => setEditChairName(e.target.value)}
                  />
                </label>
              )}
              <div className="profile-avatar-actions">
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  Save
                </button>
                <button
                  className="btn btn-ghost-dark"
                  type="button"
                  onClick={() => setEditingSeat(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="panel">
          <h2>In the room</h2>
          <ul className="member-list">
            {participants.map((p) => (
              <li key={p.userId} className="member-row">
                <strong>{formatSeatLabel(p.role, p.displayName)}</strong>
                <span>{p.raisedPlacard ? 'placard up' : ''}</span>
              </li>
            ))}
          </ul>
        </div>

        <RoomChat
          roomId={room.roomId}
          me={me}
          participants={participants}
          onError={setActionError}
        />
      </section>
    </main>
  );
};

export default CommitteeRoomPage;
