import { Link } from 'react-router-dom';
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
}

export function CommitteeRoomList({
  rooms,
  userId,
  loading = false,
  busy = false,
  onCloseRoom,
  emptyMessage = 'No live committee rooms yet. Create one or join with a shared link.',
}: CommitteeRoomListProps) {
  if (loading) {
    return <p className="muted">Loading rooms…</p>;
  }

  if (rooms.length === 0) {
    return <p className="muted">{emptyMessage}</p>;
  }

  return (
    <ul className="classroom-list committee-room-list">
      {rooms.map((room) => {
        const canClose = room.createdBy === userId || room.chairId === userId;
        return (
          <li key={room.roomId} className="committee-room-list-item">
            <div className="committee-room-list-main">
              <strong>{room.name}</strong>
              <span>
                {relationLabel(room.relation)} · {room.currentStatus.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="committee-room-list-actions">
              <Link className="btn btn-secondary" to={`/room/${room.roomId}`}>
                Open
              </Link>
              {canClose && onCloseRoom ? (
                <button
                  type="button"
                  className="btn btn-ghost-dark"
                  disabled={busy}
                  onClick={() => onCloseRoom(room.roomId)}
                >
                  Close room
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
