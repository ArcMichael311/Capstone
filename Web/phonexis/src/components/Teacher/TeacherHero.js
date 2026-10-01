import { CountUp, ProgressRing } from './TeacherFx';

// Navy hero banner shown at the top of every teacher page.
// stats: [{ key, icon, label, value, suffix?, ring? }] — ring shows the value as a progress ring.
export default function TeacherHero({ eyebrow, title, subtitle, actions = null, stats = [], tip = null, children = null }) {
  return (
    <header className="tw-hero">
      <span className="tw-hero-glow tw-hero-glow-a" aria-hidden="true" />
      <span className="tw-hero-glow tw-hero-glow-b" aria-hidden="true" />

      <div className="tw-hero-top">
        <div className="tw-hero-copy">
          {eyebrow && <p className="tw-hero-eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {subtitle && <p className="tw-hero-sub">{subtitle}</p>}
        </div>
        {actions && <div className="tw-hero-actions">{actions}</div>}
      </div>

      {children}

      {stats.length > 0 && (
        <div className="tw-hero-stats">
          {stats.map((stat, index) => (
            <div key={stat.key || stat.label} className="tw-hero-stat" style={{ animationDelay: `${120 + index * 80}ms` }}>
              {stat.ring ? (
                <ProgressRing value={stat.value} size={52} stroke={6} className="tw-ring-light" />
              ) : (
                <span className="tw-hero-stat-icon" aria-hidden="true">{stat.icon}</span>
              )}
              <span>
                {!stat.ring && (
                  <span className="tw-hero-stat-value">
                    {stat.loading ? '…' : typeof stat.value === 'number' ? <CountUp value={stat.value} suffix={stat.suffix || ''} /> : stat.value}
                  </span>
                )}
                <span className="tw-hero-stat-label">{stat.label}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {tip && (
        <p className="tw-hero-tip">
          <span aria-hidden="true">💡</span> {tip}
        </p>
      )}
    </header>
  );
}
