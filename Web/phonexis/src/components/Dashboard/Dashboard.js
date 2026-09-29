import './Dashboard.css';
import './StudentHome.css';
import logo from '../Login/logoB.png';
import { getLevel, getNextRank, getRank, getStars, getXpInLevel } from './playerProgress';

const moduleCards = [
  {
    key: 'alphabet',
    icon: '🔤',
    title: 'Alphabet Recognition',
    world: 'Letter Land',
    description: 'Meet every letter with fun visuals',
    accent: 'blue',
  },
  {
    key: 'vowels',
    icon: '🗣️',
    title: 'Vowels',
    world: 'Vowel Valley',
    description: 'Discover vowel sounds with audio guides',
    accent: 'purple',
  },
  {
    key: 'consonants',
    icon: '🧩',
    title: 'Consonants',
    world: 'Consonant Canyon',
    description: 'Explore consonant sounds visually',
    accent: 'green',
  },
  {
    key: 'cvc',
    icon: '🏗️',
    title: 'CVC Words',
    world: 'Word Kingdom',
    description: 'Build simple words and practice phonics',
    accent: 'orange',
  },
];

const floatingLetters = ['A', 'b', 'C', 'e', 'M', 'o', 'S', 'u'];

function ProgressRing({ value, size = 76, stroke = 8, label }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="sd-ring" style={{ width: size, height: size }} aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="sd-ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          className="sd-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          style={{
            '--circ': circumference,
            '--offset': circumference * (1 - clamped / 100),
          }}
        />
      </svg>
      <strong>{clamped}%</strong>
    </div>
  );
}

export default function Dashboard({ onNavigate, onSelectModule, user, overallProgress = 0, alphabetProgress = 0, vowelsProgress = 0, consonantsProgress = 0, cvcProgress = 0, vowelsUnlocked = false, consonantsUnlocked = false, cvcUnlocked = false, studentClassInfo = null, studentMaterials = [] }) {
  const openGame = (moduleKey) => {
    if (moduleKey === 'vowels' && !vowelsUnlocked) {
      return;
    }

    if (moduleKey === 'consonants' && !consonantsUnlocked) {
      return;
    }

    if (moduleKey === 'cvc' && !cvcUnlocked) {
      return;
    }

    onSelectModule(moduleKey);
    onNavigate(moduleKey);
  };

  const emailName = user?.email ? user.email.split('@')[0] : '';
  const displayName = [user?.firstname || user?.user_metadata?.firstname, user?.lastname || user?.user_metadata?.lastname]
    .filter(Boolean)
    .join(' ')
    || user?.user_metadata?.name
    || emailName
    || 'Learner';
  const firstName = displayName.split(' ')[0];

  const progressByModule = {
    alphabet: alphabetProgress,
    vowels: vowelsProgress,
    consonants: consonantsProgress,
    cvc: cvcProgress,
  };
  const lockedByModule = {
    alphabet: false,
    vowels: !vowelsUnlocked,
    consonants: !consonantsUnlocked,
    cvc: !cvcUnlocked,
  };

  const rank = getRank(overallProgress);
  const nextRank = getNextRank(overallProgress);
  const level = getLevel(overallProgress);
  const xpInLevel = getXpInLevel(overallProgress);
  const worldsCleared = moduleCards.filter((card) => progressByModule[card.key] >= 100).length;
  const totalStars = moduleCards.reduce((sum, card) => sum + getStars(progressByModule[card.key]), 0);
  const currentWorldKey = moduleCards.find((card) => !lockedByModule[card.key] && progressByModule[card.key] < 100)?.key;

  const badges = [
    { key: 'start', icon: '🚀', title: 'First Steps', detail: 'Start your adventure', earned: overallProgress > 0 },
    { key: 'alphabet', icon: '🔤', title: 'Alphabet Ace', detail: 'Finish Letter Land', earned: alphabetProgress >= 100 },
    { key: 'vowels', icon: '🎵', title: 'Vowel Voyager', detail: 'Finish Vowel Valley', earned: vowelsProgress >= 100 },
    { key: 'half', icon: '⚡', title: 'Halfway Hero', detail: 'Reach 50% overall', earned: overallProgress >= 50 },
    { key: 'consonants', icon: '🧩', title: 'Consonant Crusher', detail: 'Finish Consonant Canyon', earned: consonantsProgress >= 100 },
    { key: 'cvc', icon: '🏆', title: 'Word Wizard', detail: 'Finish Word Kingdom', earned: cvcProgress >= 100 },
  ];
  const badgesEarned = badges.filter((badge) => badge.earned).length;

  return (
    <section className="sd-home" aria-label="Student dashboard">
      <div className="sd-backdrop" aria-hidden="true">
        {floatingLetters.map((letter, i) => (
          <span key={letter} className="sd-float-letter" style={{ '--i': i }}>{letter}</span>
        ))}
      </div>

      {/* Player card */}
      <header className="sd-hero">
        <div className="sd-player">
          <div className="sd-avatar">
            <img src={logo} alt="" />
            <span className="sd-level-badge" aria-label={`Level ${level}`}>Lv {level}</span>
          </div>
          <div className="sd-player-copy">
            <p className="sd-greeting">Welcome back, adventurer! 👋</p>
            <h1>Hi, {firstName}!</h1>
            <div className="sd-rank">
              <span aria-hidden="true">{rank.icon}</span>
              <strong>{rank.title}</strong>
            </div>
            <div className="sd-xp">
              <div className="sd-xp-track">
                <div className="sd-xp-fill" style={{ '--xp': `${xpInLevel}%` }} />
              </div>
              <span>
                {nextRank ? `${nextRank.min - overallProgress}% more to become ${nextRank.icon} ${nextRank.title}` : 'Max rank reached! 🎉'}
              </span>
            </div>
          </div>
        </div>

        <div className="sd-hero-side">
          <ProgressRing value={overallProgress} size={128} stroke={12} label={`Overall progress ${overallProgress}%`} />
          <span className="sd-hero-side-label">Overall Progress</span>
        </div>

        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <div className="sd-role-actions">
            {user?.role === 'admin' && (
              <button type="button" className="sd-chip-btn" onClick={() => onNavigate('admin')}>⚙️ Admin</button>
            )}
            {user?.role === 'teacher' && (
              <button type="button" className="sd-chip-btn" onClick={() => onNavigate('teacher')}>🧑‍🏫 Teacher</button>
            )}
          </div>
        )}
      </header>

      {/* Quick stats */}
      <section className="sd-stats" aria-label="Your stats">
        <div className="sd-stat sd-stat-yellow">
          <span className="sd-stat-icon" aria-hidden="true">⭐</span>
          <div><strong>{totalStars}<small>/12</small></strong><span>Stars collected</span></div>
        </div>
        <div className="sd-stat sd-stat-green">
          <span className="sd-stat-icon" aria-hidden="true">🗺️</span>
          <div><strong>{worldsCleared}<small>/4</small></strong><span>Worlds cleared</span></div>
        </div>
        <div className="sd-stat sd-stat-purple">
          <span className="sd-stat-icon" aria-hidden="true">🏅</span>
          <div><strong>{badgesEarned}<small>/{badges.length}</small></strong><span>Badges earned</span></div>
        </div>
      </section>

      {/* Adventure map */}
      <section className="sd-section" aria-label="Learning worlds">
        <div className="sd-section-head">
          <h2>🗺️ Adventure Map</h2>
          <p>Clear each world to unlock the next one!</p>
        </div>

        <div className={`sd-map${studentClassInfo ? ' sd-map-with-class' : ''}`}>
          {moduleCards.map((card, index) => {
            const isLocked = lockedByModule[card.key];
            const progress = progressByModule[card.key];
            const isComplete = progress >= 100;
            const isCurrent = card.key === currentWorldKey;
            const stars = getStars(progress);

            return (
              <button
                key={card.key}
                type="button"
                className={[
                  'sd-world',
                  `sd-world-${card.accent}`,
                  isLocked ? 'locked' : '',
                  isComplete ? 'complete' : '',
                  isCurrent ? 'current' : '',
                ].join(' ')}
                style={{ '--i': index }}
                onClick={() => openGame(card.key)}
                disabled={isLocked}
                aria-label={`${card.title}${isLocked ? ', locked' : `, ${progress}% complete`}`}
              >
                {isCurrent ? <span className="sd-here" aria-hidden="true">📍 You are here</span> : null}
                <span className="sd-world-number" aria-hidden="true">{isComplete ? '✓' : index + 1}</span>

                <div className="sd-world-art" aria-hidden="true">
                  <span className="sd-world-icon">{isLocked ? '🔒' : card.icon}</span>
                  {isComplete ? <span className="sd-world-crown">👑</span> : null}
                </div>

                <div className="sd-world-copy">
                  <span className="sd-world-name">{card.world}</span>
                  <h3>{card.title}</h3>
                  <p>{isLocked ? 'Finish the previous world to unlock.' : card.description}</p>
                </div>

                <div className="sd-world-footer">
                  <div className="sd-stars" aria-label={`${stars} of 3 stars`}>
                    {[1, 2, 3].map((value) => (
                      <span key={value} className={value <= stars ? 'earned' : ''}>★</span>
                    ))}
                  </div>
                  <div className="sd-world-progress">
                    <div className="sd-world-track">
                      <div className="sd-world-fill" style={{ '--p': `${isLocked ? 0 : progress}%` }} />
                    </div>
                    <strong>{isLocked ? 'Locked' : `${progress}%`}</strong>
                  </div>
                  <span className="sd-play">
                    {isLocked ? '🔒 Locked' : isComplete ? '↻ Play again' : progress > 0 ? '▶ Continue' : '▶ Start'}
                  </span>
                </div>
              </button>
            );
          })}

          {studentClassInfo ? (
            <button
              type="button"
              className="sd-world sd-world-pink sd-world-class"
              style={{ '--i': moduleCards.length }}
              onClick={() => onNavigate('class', 'materials')}
              aria-label={`Open your class ${studentClassInfo.className || ''}`}
            >
              <span className="sd-here sd-new-tag" aria-hidden="true">🎉 New class!</span>
              <span className="sd-world-number" aria-hidden="true">🏫</span>

              <div className="sd-world-art" aria-hidden="true">
                <span className="sd-world-icon">🏫</span>
              </div>

              <div className="sd-world-copy">
                <span className="sd-world-name">Class Camp</span>
                <h3>{studentClassInfo.className || 'My Class'}</h3>
                <p>
                  Teacher: {[studentClassInfo.teacherFirstName, studentClassInfo.teacherLastName].filter(Boolean).join(' ') || 'Your teacher'}
                </p>
              </div>

              <div className="sd-world-footer">
                <div className="sd-class-chips">
                  <span>📚 {studentMaterials.length} material{studentMaterials.length === 1 ? '' : 's'}</span>
                  <span>📝 Pretests</span>
                </div>
                <span className="sd-play">▶ Enter Class</span>
              </div>
            </button>
          ) : null}
        </div>
      </section>

      {/* Badges */}
      <section className="sd-section" aria-label="Badges">
        <div className="sd-section-head">
          <h2>🏅 Badge Collection</h2>
          <p>{badgesEarned === badges.length ? 'You collected every badge! Amazing!' : 'Keep learning to collect them all!'}</p>
        </div>

        <div className="sd-badges">
          {badges.map((badge, i) => (
            <div key={badge.key} className={`sd-badge ${badge.earned ? 'earned' : ''}`} style={{ '--i': i }}>
              <span className="sd-badge-icon" aria-hidden="true">{badge.earned ? badge.icon : '🔒'}</span>
              <strong>{badge.title}</strong>
              <span>{badge.detail}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
