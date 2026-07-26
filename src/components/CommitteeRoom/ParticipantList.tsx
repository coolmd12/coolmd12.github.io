import React from 'react';

interface ParticipantListProps {
  participants: { id: string; name: string; role: string; status: string }[];
}

const ParticipantList: React.FC<ParticipantListProps> = ({ participants }) => {
  return (
    <div className="participant-list">
      <h2>Participants</h2>
      <ul>
        {participants.map((participant) => (
          <li key={participant.id}>
            {participant.name} - {participant.role} ({participant.status})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ParticipantList;
