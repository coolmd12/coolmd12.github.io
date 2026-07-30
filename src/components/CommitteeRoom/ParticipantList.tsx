import { formatSeatLabel } from '../../services/committeeRoomLogic';
import type { Participant } from '../../types/committee';

interface ParticipantListProps {
  participants: Participant[];
}

export function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <div className="participant-list">
      <h2>In the room</h2>
      <ul className="member-list">
        {participants.map((participant) => (
          <li key={participant.userId} className="member-row">
            <strong>{formatSeatLabel(participant.role, participant.displayName)}</strong>
            <span>{participant.raisedPlacard ? 'placard up' : ''}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ParticipantList;
