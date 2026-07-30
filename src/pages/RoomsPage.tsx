import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RoomsPage() {
  const { user } = useAuth();

  return (
    <main className="shell">
      <header className="page-header">
        <div>
          <h1>Live committee rooms</h1>
          <p className="muted">
            Open procedure floors for any GoMUN account — create a room, share the link, pick chair
            or delegate when you join. In-app calling comes later; use Meet/Zoom beside the floor for
            now if you need voice/video.
          </p>
        </div>
      </header>

      <section className="panel">
        <h2>Get started</h2>
        <p className="muted">
          Create a room from the dashboard, open it, then share the link so others can join.
        </p>
        <Link to={user ? '/dashboard' : '/signup'} className="btn btn-primary">
          {user ? 'Open dashboard' : 'Create a free account'}
        </Link>
      </section>
    </main>
  );
}
