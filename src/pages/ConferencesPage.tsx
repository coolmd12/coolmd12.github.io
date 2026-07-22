import { useMemo, useState } from 'react';
import { CONFERENCES } from '../data/conferences';
import { formatDateRange } from '../lib/utils';

export function ConferencesPage() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('All');

  const regions = useMemo(
    () => ['All', ...Array.from(new Set(CONFERENCES.map((c) => c.region))).sort()],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CONFERENCES.filter((c) => {
      const regionOk = region === 'All' || c.region === region;
      const text = `${c.name} ${c.shortName} ${c.location} ${c.level}`.toLowerCase();
      const queryOk = !q || text.includes(q);
      return regionOk && queryOk;
    }).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [query, region]);

  return (
    <main className="shell conferences-page">
      <header className="page-header">
        <div>
          <h1>Conference directory</h1>
          <p className="muted">
            A living shortcut list to conferences already posted on the web. We link out to
            each organizer — GoMUN does not run these events.
          </p>
        </div>
      </header>

      <div className="filters">
        <label>
          Search
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="NMUN, Chicago, high school…"
          />
        </label>
        <label>
          Region
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="conference-list">
        {filtered.map((c) => (
          <li key={c.id}>
            <div>
              <p className="eyebrow">
                {c.shortName} · {c.level} · {c.region}
              </p>
              <h2>{c.name}</h2>
              <p>
                {c.location} · {formatDateRange(c.startDate, c.endDate)}
              </p>
              <p className="muted">Source: {c.source}</p>
            </div>
            <a
              className="btn btn-secondary"
              href={c.website}
              target="_blank"
              rel="noreferrer"
            >
              Visit site
            </a>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="muted">No conferences match that filter.</p>
      ) : null}
    </main>
  );
}
