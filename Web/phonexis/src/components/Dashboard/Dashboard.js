import './Dashboard.css';
import logo from '../Login/logoB.png';

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

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) {
    return '';
  }
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Dashboard({ onNavigate, onSelectModule, onLogout, onJoinClass, classroom = null, user, overallProgress = 0, alphabetProgress = 0, vowelsProgress = 0, consonantsProgress = 0, cvcProgress = 0, vowelsUnlocked = false, consonantsUnlocked = false, cvcUnlocked = false, studentClassInfo = null, studentMaterials = [] }) {
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
            <img src={logo} alt="Phonics Learning logo" className="dashboard-logo" />
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

      <section className="dashboard-card dashboard-card-class" aria-label="Your class">
        <div className="dashboard-card-copy">
          {studentClassInfo ? (
            <>
              <h3>{studentClassInfo.className}</h3>
              <p>
                Teacher: {[studentClassInfo.teacherFirstName, studentClassInfo.teacherLastName].filter(Boolean).join(' ') || 'Unknown'}
              </p>

              <div className="dashboard-materials-list">
                {studentMaterials.map((material) => (
                  <a
                    key={material.id}
                    className="dashboard-material-item"
                    href={material.downloadUrl || undefined}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{material.title || material.fileName}</span>
                    <span className="dashboard-material-meta">
                      {material.fileSize ? formatFileSize(material.fileSize) : ''}
                    </span>
                  </a>
                ))}
                {studentMaterials.length === 0 && (
                  <p className="dashboard-materials-empty">No materials shared yet.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <h3>No Class Yet</h3>
              <p>Ask your teacher to add you to a class to see your section and materials here.</p>
            </>
          )}
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