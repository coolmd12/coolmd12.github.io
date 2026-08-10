import { Link } from 'react-router-dom';
import type { ActivityEvent, ActivityKind, ActivityUsageStats } from '../types/activity';

const KIND_CLASS: Record<ActivityKind, string> = {
  account_created: 'kind-account',
  classroom_created: 'kind-classroom-create',
  classroom_joined: 'kind-classroom-join',
  room_created: 'kind-room-create',
  room_joined: 'kind-room-join',
  room_closed: 'kind-room-close',
};

function formatActivityDay(at: number): string {
  try {
    return new Date(at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

interface ActivityTimelineProps {
  events: ActivityEvent[];
  stats: ActivityUsageStats;
  loading?: boolean;
}

export function ActivityTimeline({ events, stats, loading = false }: ActivityTimelineProps) {
  return (
    <section className="activity-strip" aria-label="Your activity">
      <div className="activity-strip-head">
        <div>
          <p className="activity-eyebrow">Your activity</p>
          <h2>Where you’ve been on GoMUN</h2>
          <p className="muted">
            Rooms and classrooms you’ve hosted or joined — a living trail of your practice.
          </p>
        </div>
        <ul className="activity-usage-chips">
          <li>
            <strong>{stats.roomsHosted}</strong>
            <span>Rooms hosted</span>
          </li>
          <li>
            <strong>{stats.roomsJoined}</strong>
            <span>Rooms joined</span>
          </li>
          <li>
            <strong>{stats.classrooms}</strong>
            <span>Classrooms</span>
          </li>
          <li>
            <strong>{stats.totalEvents}</strong>
            <span>Moments</span>
          </li>
        </ul>
      </div>

      {loading ? (
        <p className="muted">Loading your timeline…</p>
      ) : events.length === 0 ? (
        <p className="muted activity-empty">
          Nothing here yet. Create or join a committee room or classroom and your trail will start
          here.
        </p>
      ) : (
        <div className="activity-timeline-scroll">
          <ol className="activity-timeline">
            {events.map((event) => {
              const body = (
                <>
                  <span className={`activity-dot ${KIND_CLASS[event.kind]}`} aria-hidden="true" />
                  <span className="activity-day">{formatActivityDay(event.at)}</span>
                  <strong className="activity-title">{event.title}</strong>
                  {event.detail ? <span className="activity-detail">{event.detail}</span> : null}
                </>
              );
              return (
                <li key={event.eventId || event.dedupeKey} className="activity-node">
                  {event.href ? (
                    <Link className="activity-node-link" to={event.href}>
                      {body}
                    </Link>
                  ) : (
                    <div className="activity-node-link">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}

export default ActivityTimeline;
