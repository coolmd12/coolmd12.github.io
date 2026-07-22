import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function PracticePage() {
  const { user } = useAuth();

  return (
    <main className="shell practice-page">
      <header className="page-header">
        <div>
          <h1>Practice hub</h1>
          <p className="muted">
            Choose how you want to train. Live rooms and AI arena share the same procedure
            engine — built next, on top of accounts and classrooms.
          </p>
        </div>
      </header>

      <div className="mode-grid practice-modes">
        <article>
          <h2>Live with people</h2>
          <p>
            Debate inside your private classroom with classmates and teachers. Attach Meet
            or Zoom for face-to-face committee time.
          </p>
          {user ? (
            <Link className="btn btn-primary" to="/dashboard">
              Open a classroom
            </Link>
          ) : (
            <Link className="btn btn-primary" to="/signup">
              Sign up to join a room
            </Link>
          )}
        </article>

        <article>
          <h2>Solo with AI</h2>
          <p>
            Practice speeches, points of order, and resolutions against Gemini-powered
            delegates and an AI chair. Coming in the next build phase.
          </p>
          <button className="btn btn-secondary" type="button" disabled>
            AI arena — soon
          </button>
        </article>

        <article>
          <h2>Hybrid floor</h2>
          <p>
            Humans take real seats; AI fills the rest so small clubs still feel a full
            dais. Unlocks after live + AI modes ship.
          </p>
          <button className="btn btn-secondary" type="button" disabled>
            Hybrid — soon
          </button>
        </article>
      </div>
    </main>
  );
}
