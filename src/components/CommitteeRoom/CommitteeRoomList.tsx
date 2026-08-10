import { Link } from 'react-router-dom';
import { isRoomClosed } from '../../services/committeeRoomLogic';
import type { MyCommitteeRoom } from '../../services/rooms';

function relationLabel(relation: MyCommitteeRoom['relation']): string {
  if (relation === 'hosted') return 'Hosted';
  if (relation === 'joined') return 'Joined';
  return 'Hosted · Joined';
}

interface CommitteeRoomListProps {
  rooms: MyCommitteeRoom[];
  userId: string;
  loading?: boolean;
  busy?: boolean;
  onCloseRoom?: (roomId: string) => void;
  emptyMessage?: string;
  /** When true, list is treated as past/closed rooms (View instead of Close). */
  past?: boolean;
}

export function CommitteeRoomList({
  rooms,
  userId,
  loading = false,
  busy = false,
  onCloseRoom,
  emptyMessage = 'No live committee rooms yet. Create one or join with a shared link.',
  past = false,
}: CommitteeRoomListProps) {
  if (loading) {
    return <p className="muted">Loading rooms…</p>;
  }

  if (rooms.length === 0) {
    return <p className="muted room-list-empty">{emptyMessage}</p>;
  }

  return (
    <ul className="committee-room-list">
      {rooms.map((room) => {
        const closed = past || isRoomClosed(room);
        const canClose = !closed && (room.createdBy === userId || room.chairId === userId);
        return (
          <li
            key={room.roomId}
            className={`committee-room-card${closed ? ' is-past' : ''}`}
          >
            <div className="committee-room-card-main">
              <div className="committee-room-card-top">
                <strong className="committee-room-card-title">{room.name}</strong>
                <span className={`room-status-chip${closed ? ' is-closed' : ' is-live'}`}>
                  {closed ? 'Closed' : 'Live'}
                </span>
              </div>
              <p className="committee-room-card-meta">
                <span>{relationLabel(room.relation)}</span>
                {!closed ? (
                  <>
                    <span className="meta-dot" aria-hidden="true">
                      ·
                    </span>
                    <span>{room.currentStatus.replace(/_/g, ' ')}</span>
                  </>
                ) : null}
              </p>
            </div>
            <div className="committee-room-list-actions">
              <Link className="btn btn-secondary" to={`/room/${room.roomId}`}>
                {closed ? 'View' : 'Open'}
              </Link>
              {canClose && onCloseRoom ? (
                <button
                  type="button"
                  className="btn btn-ghost-dark"
                  disabled={busy}
                  onClick={() => onCloseRoom(room.roomId)}
                >
                  Close
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default CommitteeRoomList;
