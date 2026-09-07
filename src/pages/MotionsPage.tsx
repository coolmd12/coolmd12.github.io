import { Link } from 'react-router-dom';
import {
  GOMUN_FLOOR_ACTIONS,
  GOMUN_FLOOR_MOTIONS,
  MOTION_SCRIPT_DISCLAIMER,
  REFERENCE_ONLY_POINTS,
  type MotionScriptEntry,
} from '../data/motionScripts';

function ScriptTable({ entries, caption }: { entries: MotionScriptEntry[]; caption: string }) {
  return (
    <div className="script-table-wrap">
      <table className="script-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Motion / point</th>
            <th scope="col">Who</th>
            <th scope="col">Vote</th>
            <th scope="col">Typical phrasing</th>
            <th scope="col">GoMUN tip</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((row) => (
            <tr key={row.id}>
              <th scope="row">
                {row.name}
                {row.kind === 'reference_only' ? (
                  <span className="script-badge">Not in room yet</span>
                ) : (
                  <span className="script-badge script-badge-live">In GoMUN room</span>
                )}
              </th>
              <td>{row.who}</td>
              <td>{row.vote}</td>
              <td>
                <em>{row.phrasing}</em>
              </td>
              <td>{row.gomunTip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MotionsPage() {
  return (
    <main className="shell motions-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Phase 5.1 · Practice aid</p>
          <h1>Procedure</h1>
          <p className="muted">
            Scripts of Motions for GoMUN practice — aligned with the live committee floor.
            Reference only; does not run motions for you.
          </p>
        </div>
        <div className="page-header-actions">
          <Link className="btn btn-secondary" to="/rooms">
            Open rooms
          </Link>
          <button className="btn btn-ghost" type="button" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </header>

      <section className="banner integrity-banner" role="note">
        <p>{MOTION_SCRIPT_DISCLAIMER}</p>
        <p className="integrity-banner-links">
          <Link to="/terms-and-conditions">Terms and Conditions</Link>
          {' · '}
          Academic honesty and conference AI policies are your responsibility.
        </p>
      </section>

      <section className="panel">
        <h2 className="stats-section-title">GoMUN Practice Script</h2>
        <p className="muted">
          These motions can be proposed in a live GoMUN room today. Procedural votes are yes/no
          with chair-only tallies until the vote closes.
        </p>
        <ScriptTable entries={GOMUN_FLOOR_MOTIONS} caption="Motions available in GoMUN rooms" />
      </section>

      <section className="panel">
        <h2 className="stats-section-title">Floor actions (not motions)</h2>
        <ul className="script-action-list">
          {GOMUN_FLOOR_ACTIONS.map((a) => (
            <li key={a.id}>
              <strong>{a.name}.</strong> {a.detail}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2 className="stats-section-title">Common points (reference only)</h2>
        <p className="muted">
          Many conferences recognize points of order or parliamentary inquiry. GoMUN does{' '}
          <strong>not</strong> offer these as in-room controls yet — listed so you can learn the
          vocabulary for practice and real events (always check that conference&apos;s RoP).
        </p>
        <ScriptTable entries={REFERENCE_ONLY_POINTS} caption="Reference-only points" />
      </section>

      <p className="panel-footer-link">
        <Link to="/practice">Practice hub</Link>
        {' · '}
        <Link to="/terms-and-conditions">Terms and Conditions</Link>
      </p>
    </main>
  );
}
