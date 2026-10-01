// Charts for the teacher's Academic Progress view: pretest bar chart, game radar chart,
// and class pass/fail pie chart. Plain SVG/HTML so no chart library is needed.

export const PASSING_PERCENT = 75;

export const GAMES = [
  { key: 'alphaquest', title: 'AlphaQuest', module: 'Alphabet' },
  { key: 'vowelrush', title: 'VowelRush', module: 'Vowels' },
  { key: 'wordblast', title: 'WordBlast', module: 'Consonants' },
  { key: 'balloonpop', title: 'Balloon Pop', module: 'CVC Words' },
];

export const attemptPercent = (attempt) => {
  if (!attempt || !attempt.totalQuestions) {
    return null;
  }
  return Math.round((Number(attempt.score) / Number(attempt.totalQuestions)) * 100);
};

const truncate = (text, max = 14) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

export function PretestBarChart({ pretests }) {
  if (!pretests.length) {
    return <p className="tpc-empty">No pretests have been created for this class yet.</p>;
  }

  return (
    <div className="tpc-bar-chart" role="img" aria-label="Pretest scores for the selected student">
      <div className="tpc-bar-plot">
        {[100, 75, 50, 25, 0].map((tick) => (
          <div key={tick} className={`tpc-gridline ${tick === PASSING_PERCENT ? 'pass' : ''}`} style={{ bottom: `${tick}%` }}>
            <span>{tick === PASSING_PERCENT ? `${tick}% pass` : `${tick}%`}</span>
          </div>
        ))}
        <div className="tpc-bars">
          {pretests.map((pretest, index) => {
            const percent = attemptPercent(pretest.latestAttempt);
            const taken = percent != null;
            const tip = taken
              ? `${pretest.title}: ${pretest.latestAttempt.score}/${pretest.latestAttempt.totalQuestions} (${percent}%) — ${percent >= PASSING_PERCENT ? 'Passed' : 'Below passing'}`
              : `${pretest.title}: not taken yet`;
            return (
              <div key={pretest.id} className="tpc-bar-col" title={tip}>
                <span className="tpc-bar-value">{taken ? `${percent}%` : '—'}</span>
                <div
                  className={`tpc-bar ${!taken ? 'empty' : percent < PASSING_PERCENT ? 'fail' : ''}`}
                  style={{ height: `${taken ? Math.max(percent, 2) : 2}%`, '--d': `${index * 80}ms` }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="tpc-bar-labels">
        {pretests.map((pretest) => {
          const percent = attemptPercent(pretest.latestAttempt);
          return (
            <div key={pretest.id} className="tpc-bar-label">
              <strong>{truncate(pretest.title)}</strong>
              <span className={percent == null ? 'muted' : percent >= PASSING_PERCENT ? 'pass' : 'fail'}>
                {percent == null ? 'Not taken' : percent >= PASSING_PERCENT ? '✓ Passed' : '✗ Below 75%'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const polar = (cx, cy, radius, index, count) => {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
};

// Each axis is the student's best score as a % of the class's top score in that game,
// so games with very different point scales can share one chart.
export function GameRadarChart({ studentScores, classTopScores }) {
  const cx = 160;
  const cy = 130;
  const radius = 92;
  const count = GAMES.length;

  const points = GAMES.map((game, index) => {
    const entry = studentScores[game.key];
    const best = entry?.bestScore || 0;
    const top = classTopScores[game.key] || 0;
    const value = top > 0 ? Math.round((best / top) * 100) : 0;
    const [x, y] = polar(cx, cy, (radius * value) / 100, index, count);
    return { game, entry, best, top, value, x, y };
  });
  const anyPlayed = points.some((point) => point.entry);

  return (
    <div className="tpc-radar-wrap">
      <svg viewBox="0 0 320 260" className="tpc-radar" role="img" aria-label="Game scores radar chart">
        {[25, 50, 75, 100].map((ring) => (
          <polygon
            key={ring}
            className="tpc-radar-ring"
            points={GAMES.map((_, index) => polar(cx, cy, (radius * ring) / 100, index, count).join(',')).join(' ')}
          />
        ))}
        {GAMES.map((game, index) => {
          const [x, y] = polar(cx, cy, radius, index, count);
          const [lx, ly] = polar(cx, cy, radius + 22, index, count);
          return (
            <g key={game.key}>
              <line className="tpc-radar-axis" x1={cx} y1={cy} x2={x} y2={y} />
              <text className="tpc-radar-label" x={lx} y={ly} textAnchor={Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end'} dominantBaseline="middle">
                {game.title}
              </text>
            </g>
          );
        })}
        {anyPlayed && (
          <polygon className="tpc-radar-shape" points={points.map((point) => `${point.x},${point.y}`).join(' ')} />
        )}
        {anyPlayed && points.map((point) => (
          <g key={point.game.key} className="tpc-radar-point">
            <circle className="tpc-radar-hit" cx={point.x} cy={point.y} r="14" />
            <circle className="tpc-radar-dot" cx={point.x} cy={point.y} r="4.5" />
            <title>
              {point.entry
                ? `${point.game.title}: best ${point.best} pts (class top ${point.top}), played ${point.entry.timesPlayed}×`
                : `${point.game.title}: not played yet`}
            </title>
          </g>
        ))}
      </svg>

      <ul className="tpc-game-list">
        {points.map((point) => (
          <li key={point.game.key}>
            <span className="tpc-game-name">{point.game.title}</span>
            {point.entry ? (
              <span className="tpc-game-stats">
                <strong>{point.best} pts</strong> best · last {point.entry.lastScore} · {point.entry.timesPlayed}× played
              </span>
            ) : (
              <span className="tpc-game-stats muted">Not played yet</span>
            )}
          </li>
        ))}
      </ul>
      {!anyPlayed && <p className="tpc-empty">This student hasn&apos;t finished a game yet. Scores appear here after a game ends.</p>}
    </div>
  );
}

const PIE_SLICES = [
  { key: 'passed', label: 'Passed', icon: '✓', className: 'passed' },
  { key: 'failed', label: 'Below 75%', icon: '✗', className: 'failed' },
  { key: 'notTaken', label: 'Not taken', icon: '–', className: 'not-taken' },
];

const arcPath = (cx, cy, r, start, end) => {
  if (end - start >= Math.PI * 2 - 0.0001) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  }
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
};

export function PassPieChart({ counts }) {
  const total = PIE_SLICES.reduce((sum, slice) => sum + (counts[slice.key] || 0), 0);
  if (!total) {
    return <p className="tpc-empty">No students in this class yet.</p>;
  }

  let angle = -Math.PI / 2;
  const slices = PIE_SLICES.map((slice) => {
    const value = counts[slice.key] || 0;
    const sweep = (value / total) * Math.PI * 2;
    const path = value > 0 ? arcPath(100, 100, 88, angle, angle + sweep) : null;
    angle += sweep;
    return { ...slice, value, percent: Math.round((value / total) * 100), path };
  });

  return (
    <div className="tpc-pie-wrap">
      <svg viewBox="0 0 200 200" className="tpc-pie" role="img" aria-label="Class pretest pass rate pie chart">
        {slices.filter((slice) => slice.path).map((slice, index) => (
          <path key={slice.key} d={slice.path} className={`tpc-pie-slice ${slice.className}`} style={{ '--d': `${index * 120}ms` }}>
            <title>{`${slice.label}: ${slice.value} student${slice.value === 1 ? '' : 's'} (${slice.percent}%)`}</title>
          </path>
        ))}
      </svg>
      <ul className="tpc-legend">
        {slices.map((slice) => (
          <li key={slice.key}>
            <span className={`tpc-swatch ${slice.className}`} aria-hidden="true" />
            <span className="tpc-legend-label">{slice.icon} {slice.label}</span>
            <strong>{slice.value}</strong>
            <span className="tpc-legend-percent">{slice.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
