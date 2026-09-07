import { Link } from 'react-router-dom';

const EFFECTIVE = 'September 6, 2026';

/**
 * Product Terms and Conditions — expectation-setting draft for users.
 * Not a substitute for advice from a licensed attorney.
 */
export function TermsPage() {
  return (
    <main className="shell legal-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Legal</p>
          <h1>Terms and Conditions</h1>
          <p className="muted">
            Effective {EFFECTIVE}. These Terms and Conditions explain how GoMUN Delegate Arena
            (&quot;GoMUN,&quot; &quot;we,&quot; &quot;us&quot;) may be used. By creating an account or
            using the site, you agree to these Terms and Conditions.
          </p>
        </div>
      </header>

      <article className="panel legal-panel">
        <h2>1. What GoMUN is</h2>
        <p>
          GoMUN is a <strong>free practice platform</strong> for Model UN (and related club
          practice): private classrooms, open committee procedure rooms (speakers, timers,
          motions, voting, chat), a conference <em>directory</em> of outbound links, parent
          progress views, and educational references such as procedure cheat sheets.
        </p>
        <p>
          GoMUN does <strong>not</strong> host official Model UN conferences, does not replace
          an organizer&apos;s Rules of Procedure (RoP), and does not grade or award delegates at
          third-party events.
        </p>

        <h2>2. Practice vs real conferences</h2>
        <p>
          Features on this site are designed for <strong>club and classroom practice</strong>.
          When you attend a real conference, that conference&apos;s RoP, secretariat decisions,
          codes of conduct, and academic-honesty policies control — not GoMUN&apos;s practice
          defaults.
        </p>
        <p>
          Procedure guides, Scripts of Motions, and similar materials are{' '}
          <strong>educational references and practice aids</strong>. They may differ from
          UNA-USA, THIMUN, or any specific conference. Do not treat them as official RoP or
          legal advice.
        </p>

        <h2>3. Academic honesty, plagiarism, and AI</h2>
        <p>You are responsible for following:</p>
        <ul>
          <li>Your school or club honor code;</li>
          <li>
            Your conference&apos;s policies on plagiarism, pre-writing, outside assistance, and{' '}
            <strong>generative AI</strong> (policies vary by conference — many prohibit AI use
            during committee weekend and/or AI-written position papers or other submissions;
            some allow limited research use with disclosure).
          </li>
        </ul>
        <p>
          <strong>GoMUN does not authorize cheating.</strong> You may not use GoMUN to
          plagiarize, to ghostwrite work that a conference or school requires you to produce
          yourself, or to bypass a conference&apos;s ban on generative AI or similar tools.
        </p>
        <p>
          If GoMUN later offers AI features (for example prep Q&amp;A or resource finding), those
          features — if any — are intended as <strong>learning and prep help</strong>, not as a
          way to submit AI-written speeches, resolutions, position papers, or notes as your own
          at graded or conference events. Always check your conference&apos;s current AI policy
          before using any AI tool in connection with that event.
        </p>
        <p>
          Educational resources that explain procedure (such as motion scripts) are not the same
          as AI drafting tools; even so, you must still obey any conference rules about what you
          may open or use on devices during committee.
        </p>

        <h2>4. Accounts and acceptable use</h2>
        <ul>
          <li>Provide accurate account information and keep your login secure.</li>
          <li>
            Do not harass others, attempt unauthorized access, scrape the service abusively, or
            use GoMUN for unlawful purposes.
          </li>
          <li>
            Classroom and room content you post should be appropriate for a high-school
            educational setting.
          </li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate these Terms and Conditions or
          create safety or abuse risks.
        </p>

        <h2>5. Parent / guardian features</h2>
        <p>
          Parent portal features are limited (for example activity summaries). Parents must be
          adults as required by the product (date of birth). Do not misuse family codes or link
          accounts without appropriate permission in your household or school context.
        </p>

        <h2>6. Third-party services and conference links</h2>
        <p>
          Sign-in may use Google / Firebase. Conference directory links go to third-party sites
          we do not control. Optional Meet/Zoom links are your responsibility. Their terms and
          privacy policies apply to those services.
        </p>

        <h2>7. No warranties</h2>
        <p>
          GoMUN is provided <strong>&quot;as is&quot;</strong> for educational practice. We do
          not warrant uninterrupted availability, error-free procedure content, or fitness for a
          particular conference. Feature availability may change; core practice is intended to
          remain free, but we do not guarantee any particular roadmap item will ship.
        </p>

        <h2>8. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, GoMUN and its founder are not liable for
          indirect, incidental, special, consequential, or punitive damages, or for losses
          related to conference awards, school discipline, or third-party policy enforcement
          arising from your use of the site. Our total liability for any claim relating to the
          service is limited to the greater of (a) amounts you paid us for the service in the
          twelve months before the claim (currently expected to be $0 for core practice) or (b)
          USD $50.
        </p>

        <h2>9. Changes</h2>
        <p>
          We may update these Terms and Conditions by posting a new version on this page with an
          updated effective date. Continued use after changes means you accept the revised Terms
          and Conditions.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions about these Terms and Conditions: contact the founder via the project site
          or the email associated with the GoMUN Firebase / GitHub project as published by
          Dhyanvi Mehta.
        </p>

        <p className="muted legal-counsel-note">
          This page is a product Terms and Conditions draft for user expectations. It is not
          legal advice. Have counsel review it before relying on it in a formal dispute.
        </p>

        <p className="panel-footer-link">
          <Link to="/motions">Procedure / Scripts of Motions</Link>
          {' · '}
          <Link to="/">Home</Link>
        </p>
      </article>
    </main>
  );
}
