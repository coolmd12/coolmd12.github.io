import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  CHAT_MAX_CHARS,
  formatSeatLabel,
  resolveChatLabel,
} from '../../services/committeeRoomLogic';
import { sendMessage, streamMessages } from '../../services/messages';
import type { Participant, RoomMessage } from '../../types/committee';

interface RoomChatProps {
  roomId: string;
  me: Participant;
  participants: Participant[];
  onError?: (message: string) => void;
}

function formatChatTime(ms: number): string {
  try {
    return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function RoomChat({ roomId, me, participants, onError }: RoomChatProps) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [limitWarning, setLimitWarning] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const shouldStickAfterSend = useRef(false);

  const overLimit = draft.length > CHAT_MAX_CHARS;
  const canSend = Boolean(draft.trim()) && !overLimit && !busy;

  useEffect(() => {
    return streamMessages(roomId, setMessages);
  }, [roomId]);

  useEffect(() => {
    if (!shouldStickAfterSend.current) return;
    shouldStickAfterSend.current = false;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!overLimit) setLimitWarning(false);
  }, [overLimit]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || !draft.trim()) return;
    if (draft.length > CHAT_MAX_CHARS) {
      setLimitWarning(true);
      return;
    }
    setBusy(true);
    setLimitWarning(false);
    try {
      await sendMessage({
        roomId,
        userId: me.userId,
        displayName: formatSeatLabel(me.role, me.displayName),
        text: draft,
      });
      setDraft('');
      shouldStickAfterSend.current = true;
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not send message.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel room-chat">
      <h2>Chat</h2>
      <p className="muted">Room-only text chat. Labels follow each person’s current seat.</p>
      <div className="room-chat-list" ref={listRef}>
        {messages.length === 0 ? (
          <p className="muted">No messages yet.</p>
        ) : (
          <ul className="room-chat-messages">
            {messages.map((m) => (
              <li key={m.messageId} className="room-chat-row">
                <div className="room-chat-meta">
                  <strong>{resolveChatLabel(m, participants)}</strong>
                  <span className="muted">{formatChatTime(m.createdAt)}</span>
                </div>
                <p className="room-chat-text">{m.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      {limitWarning || overLimit ? (
        <p className="banner warn room-chat-limit-warning" role="alert">
          You have too many characters. The limit is {CHAT_MAX_CHARS} characters per message.
        </p>
      ) : null}
      <form className="room-chat-form" onSubmit={(e) => void onSubmit(e)}>
        <label>
          Message
          <span className={`room-chat-count${overLimit ? ' is-over' : ''}`}>
            {draft.length} / {CHAT_MAX_CHARS}
          </span>
          <input
            type="text"
            placeholder="Write a message…"
            value={draft}
            onChange={(e) => {
              const next = e.target.value;
              setDraft(next);
              if (next.length > CHAT_MAX_CHARS) setLimitWarning(true);
            }}
            disabled={busy}
            aria-invalid={overLimit}
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={!canSend}>
          Send
        </button>
      </form>
    </div>
  );
}

export default RoomChat;
