import { useState } from 'react';

type InviteCodeShareProps = {
  code: string;
  classroomName?: string;
  compact?: boolean;
};

export function InviteCodeShare({ code, classroomName, compact = false }: InviteCodeShareProps) {
  const [status, setStatus] = useState('');

  const shareText = classroomName
    ? `Join my GoMUN classroom “${classroomName}” with invite code: ${code}`
    : `Join my GoMUN classroom with invite code: ${code}`;

  async function copy(text: string, okMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(okMessage);
      window.setTimeout(() => setStatus(''), 2200);
    } catch {
      setStatus('Could not copy — select the code manually.');
    }
  }

  async function share() {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: classroomName ? `GoMUN: ${classroomName}` : 'GoMUN classroom invite',
          text: shareText,
        });
        setStatus('Share sheet opened.');
        window.setTimeout(() => setStatus(''), 2200);
        return;
      } catch {
        // User cancelled or share failed — fall through to copy.
      }
    }
    await copy(shareText, 'Invite message copied.');
  }

  return (
    <div className={`invite-share ${compact ? 'invite-share-compact' : ''}`}>
      <div className="invite-box">
        <span>Invite code</span>
        <strong className="invite-code-value">{code}</strong>
      </div>
      <div className="invite-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void copy(code, 'Code copied.')}
        >
          Copy code
        </button>
        <button type="button" className="btn btn-primary" onClick={() => void share()}>
          Share invite
        </button>
      </div>
      {status ? <p className="invite-status">{status}</p> : null}
    </div>
  );
}
