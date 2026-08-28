import './Dashboard.css';

const moduleCards = [
  {
    key: 'alphabet',
    icon: '📘',
    title: 'Alphabet Recognition',
    description: 'Alphabet Familiarization with fun visuals',
    accent: 'blue',
    progress: 0, // Will be overridden with alphabetProgress
  },
  {
    key: 'vowels',
    icon: '🔉',
    title: 'Vowels',
    description: 'Discover vowel sounds with audio guides',
    accent: 'purple',
    progress: 0,
  },
  {
    key: 'consonants',
    icon: '🔊',
    title: 'Consonants',
    description: 'Explore consonant sounds visually',
    accent: 'green',
    progress: 0,
  },
  {
    key: 'cvc',
    icon: '💡',
    title: 'CVC Words',
    description: 'Build simple words and practice phonics',
    accent: 'pink',
    progress: 9,
  },
];

export default function Dashboard({ onNavigate, onSelectModule, onLogout, onJoinClass, classroom = null, user, overallProgress = 0, alphabetProgress = 0, vowelsProgress = 0, consonantsProgress = 0, cvcProgress = 0, vowelsUnlocked = false, consonantsUnlocked = false, cvcUnlocked = false }) {
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
  return (
    <section className="dashboard-shell">
      <header className="dashboard-topbar">
        <div className="dashboard-user">
          <div className="dashboard-avatar" aria-hidden="true">
            <span>🎓</span>
          </div>
          <div>
            <h2>Welcome, {displayName}!</h2>
            <p>Let&apos;s learn together</p>
          </div>
        </div>

        <div className="dashboard-topbar-actions">
          {user?.role === 'admin' && (
            <button type="button" className="dashboard-admin" onClick={() => onNavigate('admin')}>
              ⚙️ ADMIN
            </button>
          )}
          {user?.role === 'teacher' && (
            <button type="button" className="dashboard-teacher" onClick={() => onNavigate('teacher')}>
              🧑‍🏫 TEACHER
            </button>
          )}
        </div>
      </header>

      <section className="dashboard-progress-card" aria-label="Overall progress">
        <div className="dashboard-progress-head">
          <span className="dashboard-progress-icon" aria-hidden="true">
            🏅
          </span>
          <h3>Overall Progress</h3>
        </div>

        <div className="dashboard-progress-meter">
          <div className="dashboard-progress-track">
            <div className="dashboard-progress-fill" style={{ width: `${overallProgress}%` }} />
          </div>
          <strong>{overallProgress}%</strong>
        </div>
      </section>

      <section className="dashboard-cards" aria-label="Game modules">
        {moduleCards.map((card) => {
          const isLocked = (card.key === 'vowels' && !vowelsUnlocked) || (card.key === 'consonants' && !consonantsUnlocked) || (card.key === 'cvc' && !cvcUnlocked);
          const cardProgressMap = {
            alphabet: alphabetProgress,
            vowels: vowelsProgress,
            consonants: consonantsProgress,
            cvc: cvcProgress,
          };
          const cardProgress = cardProgressMap[card.key] ?? card.progress;
          return (
            <button
              key={card.key}
              type="button"
              className={`dashboard-card dashboard-card-${card.accent}${isLocked ? ' locked' : ''}`}
              onClick={() => openGame(card.key)}
              disabled={isLocked}
            >
              <div className="dashboard-card-icon" aria-hidden="true">
                <span>{card.icon}</span>
              </div>

              <div className="dashboard-card-copy">
                <h3>{card.title}</h3>
                <p>{card.description}</p>

                <div className="dashboard-card-progress">
                  <span>Progress</span>
                  <strong>{isLocked ? 'Locked' : `${cardProgress}%`}</strong>
                </div>

              <div className="dashboard-card-button">
                {isLocked ? 'Locked' : 'START LEARNING ✨'}
              </div>
            </div>
            </button>
          );
        })}
      </section>
    </section>
  );
}