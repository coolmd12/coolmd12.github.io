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
        <h2 className="activity-heading">Your Activity</h2>
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
              const name = event.detail?.trim();
              const body = (
                <>
                  <span className={`activity-dot ${KIND_CLASS[event.kind]}`} aria-hidden="true" />
                  {name ? (
                    <span className="activity-hover-card" role="tooltip">
                      {name}
                    </span>
                  ) : null}
                  <span className="activity-day">{formatActivityDay(event.at)}</span>
                  <span className="activity-detail">{event.title}</span>
                </>
              );
              return (
                <li key={event.eventId || event.dedupeKey} className="activity-node">
                  {event.href ? (
                    <Link
                      className="activity-node-link"
                      to={event.href}
                      aria-label={`${event.title}${name ? ` — ${name}` : ''}`}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div
                      className="activity-node-link"
                      tabIndex={0}
                      aria-label={`${event.title}${name ? ` — ${name}` : ''}`}
                    >
                      {body}
                    </div>
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
