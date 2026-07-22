import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-atmosphere" aria-hidden="true" />
        <div className="shell hero-content">
          <p className="hero-kicker">Free forever · Students & teachers</p>
          <h1 className="hero-brand">GoMUN</h1>
          <p className="hero-title">Delegate Arena</p>
          <p className="hero-lede">
            Practice Model UN the way conferences actually run — live with your class, or
            solo with AI delegates — without paying a cent.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Create free account
            </Link>
            <Link to="/conferences" className="btn btn-secondary btn-lg">
              Browse conferences
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell split">
          <div>
            <h2>Classroom-private. Conference-real.</h2>
            <p>
              Teachers open a private room with an invite code. Students join their group —
              speeches, motions, and meetings stay inside that circle, like Google Classroom
              for MUN.
            </p>
          </div>
          <ul className="feature-list">
            <li>
              <strong>Live practice</strong> with friends, teammates, and teachers
            </li>
            <li>
              <strong>AI practice</strong> when you want to train alone (Gemini-powered,
              coming next)
            </li>
            <li>
              <strong>Meet / Zoom links</strong> attached to each session
            </li>
            <li>
              <strong>Conference shortcuts</strong> to events already on the web
            </li>
          </ul>
        </div>
      </section>

      <section className="section section-muted">
        <div className="shell">
          <h2>How practice modes work</h2>
          <div className="mode-grid">
            <article>
              <h3>Live floor</h3>
              <p>
                Join your classroom session, take the floor, and debate in real time. Attach
                a Google Meet or Zoom link so the whole committee can see each other.
              </p>
            </article>
            <article>
              <h3>AI arena</h3>
              <p>
                Solo drills with AI delegates and an AI procedure helper — speeches, points,
                and resolutions when nobody else is online.
              </p>
            </article>
            <article>
              <h3>Hybrid</h3>
              <p>
                Humans in the room, AI filling empty seats. Ideal for small clubs that still
                want a full committee feel.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell cta-band">
          <div>
            <h2>Start with a secure account</h2>
            <p>
              Phase one is identity, classrooms, and safety. The full simulator builds on
              that foundation — one careful step at a time.
            </p>
          </div>
          <Link to="/signup" className="btn btn-primary btn-lg">
            Join GoMUN free
          </Link>
        </div>
      </section>
    </main>
  );
}
