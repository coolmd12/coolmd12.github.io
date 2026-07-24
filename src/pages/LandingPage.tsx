import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LandingPage() {
  const { user, profile } = useAuth();
  const signedIn = Boolean(user);

  return (
    <main className="landing">
      <div className="landing-parallax" aria-hidden="true" />

      <section className="hero">
        <div className="hero-atmosphere" aria-hidden="true" />
        <div className="shell hero-content">
          <p className="hero-kicker">Free forever · Students & teachers</p>
          <h1 className="hero-brand">GoMUN</h1>
          <p className="hero-title">Delegate Arena</p>
          <p className="hero-lede">
            Our vision is for you to practice Model United Nations like an expert, find and
            compete in more and more conferences, and become the powerful delegate you were
            meant to be — without paying a cent.
          </p>
          <div className="hero-cta">
            {signedIn ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                {profile?.role === 'teacher' ? 'Open dashboard' : 'Go to my classrooms'}
              </Link>
            ) : (
              <Link to="/signup" className="btn btn-primary btn-lg">
                Sign up
              </Link>
            )}
            <Link to="/conferences" className="btn btn-secondary btn-lg">
              Browse conferences
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-glass">
        <div className="shell about-mun">
          <p className="eyebrow">What is Model UN?</p>
          <h2>Debate like a diplomat. Grow like a leader.</h2>
          <p className="about-lede">
            Model United Nations is a simulation of the real UN. Students represent countries,
            research world issues, draft resolutions, speak on the floor, and negotiate with
            other delegates — all under formal parliamentary procedure.
          </p>
          <div className="about-points">
            <div>
              <h3>Public speaking that sticks</h3>
              <p>
                You learn to stand up, make a clear argument, and think on your feet — skills
                that show up in interviews, presentations, and college seminars.
              </p>
            </div>
            <div>
              <h3>Research &amp; writing</h3>
              <p>
                Position papers, resolutions, and policy research build the same habits
                colleges look for: evidence, structure, and persuasion.
              </p>
            </div>
            <div>
              <h3>College-ready soft skills</h3>
              <p>
                Negotiation, teamwork, and confidence under pressure. Many applicants highlight
                MUN awards and leadership on resumes and activity lists.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-glass">
        <div className="shell split">
          <div>
            <h2>Classroom-private. Conference-real.</h2>
            <p>
              GoMUN allows teachers to open a private room with an invite code. Students join
              their group — speeches, motions, and meetings stay inside that circle, like Google
              Classroom for MUN.
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

      <section className="section section-glass-deep">
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

      <section className="section section-glass">
        <div className="shell founder">
          <div className="founder-copy">
            <p className="eyebrow">Meet the founder</p>
            <h2>Dhyanvi Mehta</h2>
            <p>
              Hi! I’m Dhyanvi Mehta — founder of GoMUN Delegate Arena. I started Model United
              Nations (MUN) when I was in 8th grade, and I remember that I really loved it! And
              I thought…no one should be deprived of MUN’s amazing experiences, from meeting new
              people to strengthening communication to getting recognized for hard work that you
              put in. So, I wanted to bring this opportunity to each and every one of you, in
              hopes that this completely FREE website (no hidden charges) will make you become a
              symbol of confidence who has truly found their potential. Honorary delegates,
              ladies, and gentlemen, get ready for the next committee session. It’s time to
              GoMUN!
            </p>
          </div>
          <div className="founder-collage" aria-label="Photos of founder Dhyanvi Mehta">
            <div className="founder-shot-main-wrap">
              <img
                className="founder-shot founder-shot-main"
                src="/founder-dhyanvi-solo.jpg"
                alt="Dhyanvi Mehta at a Model UN event holding an award certificate"
              />
            </div>
            <img
              className="founder-shot founder-shot-party"
              src="/founder-dhyanvi-1.png"
              alt="Dhyanvi Mehta"
            />
            <img
              className="founder-shot founder-shot-award"
              src="/founder-award.jpg"
              alt="Best Delegate certificate and gavel from MINIMUN 2024"
            />
          </div>
        </div>
      </section>

      <section className="section section-glass">
        <div className="shell cta-band">
          {signedIn ? (
            <>
              <div>
                <h2>
                  {profile?.role === 'teacher'
                    ? 'Ready for your next committee?'
                    : 'Ready to practice?'}
                </h2>
                <p>
                  {profile?.role === 'teacher'
                    ? 'Open your dashboard to create a classroom, share an invite code, or jump back into an existing room.'
                    : 'Open your dashboard to join with an invite code or enter a classroom you’re already in.'}
                </p>
              </div>
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Go to dashboard
              </Link>
            </>
          ) : (
            <>
              <div>
                <h2>Start with a secure account</h2>
                <p>
                  Create a teacher or student account, open a private classroom, and start
                  practicing. Core practice stays $0 — no paid tiers planned.
                </p>
              </div>
              <Link to="/signup" className="btn btn-primary btn-lg">
                Sign up
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
