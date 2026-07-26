import { Link } from 'react-router-dom';

export default function RoomsPage() {
  return (
    <main className="shell">
      <header className="page-header">
        <div>
          <h1>Live committee rooms</h1>
          <p className="muted">Join or create live committee rooms. Rooms require a GoMUN account (free).</p>
        </div>
      </header>

      <section className="panel">
        <h2>Get started</h2>
        <p className="muted">You can create a room from the dashboard, or ask your teacher to share a room link.</p>
        <Link to="/dashboard" className="btn btn-primary">Open dashboard</Link>
      </section>
    </main>
  );
}
