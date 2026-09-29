import './Sidebar.css';
import './StudentSidebar.css';
import hideSidebarIcon from './Sidebar Icons/Hide sidebar.png';
import { getLevel, getXpInLevel } from '../Dashboard/playerProgress';

const moduleSections = {
  alphabet: [
    { key: 'easy', label: 'Easy', icon: '🟢' },
    { key: 'medium', label: 'Medium', icon: '🟡' },
    { key: 'hard', label: 'Hard', icon: '🔴' },
    { key: 'frywords', label: 'Fry Words', icon: '📖' },
    { key: 'alphaquest', label: 'Game: AlphaQuest', icon: '⚔️', isGame: true },
  ],
  vowels: [
    { key: 'learning', label: 'Learning Video Materials', icon: '🎬' },
    { key: 'lesson', label: 'Basics of Vowels', icon: '📘' },
    { key: 'vowelrush', label: 'Game: VowelRush', icon: '🚀', isGame: true },
  ],
  consonants: [
    { key: 'learning', label: 'Learning Video Materials', icon: '🎬' },
    { key: 'explore', label: 'Explore Consonants', icon: '🔍' },
    { key: 'wordblast', label: 'Game: WordBlast', icon: '💥', isGame: true },
  ],
  cvc: [
    { key: 'learning', label: 'Learning Video Materials', icon: '🎬' },
    { key: 'families', label: 'Simpler CVC Words', icon: '👪' },
    { key: 'selection', label: 'CVC Word Selection', icon: '✅' },
    { key: 'building', label: 'Game:Balloon Pop', icon: '🎈', isGame: true },
  ],
};

const modules = [
  { key: 'alphabet', label: 'Alphabet Recognition', icon: '🔤', color: 'blue' },
  { key: 'vowels', label: 'Vowels', icon: '🗣️', color: 'purple' },
  { key: 'consonants', label: 'Consonants', icon: '🧩', color: 'green' },
  { key: 'cvc', label: 'CVC Words', icon: '🏗️', color: 'orange' },
];

export default function Sidebar({ isOpen = true, onToggle, activeView, activeSection, currentUser, studentClassInfo = null, onNavigate, onSelectModule, onLogout, alphabetProgress = 0, vowelsProgress = 0, consonantsProgress = 0, cvcProgress = 0, alphabetScores = {}, completedAlphabetModes = [] }) {
  const displayName = [currentUser?.firstname || currentUser?.user_metadata?.firstname, currentUser?.lastname || currentUser?.user_metadata?.lastname]
    .filter(Boolean)
    .join(' ') || currentUser?.email?.split('@')[0] || 'Learner';
  const sections = moduleSections[activeView] || [];
  const progressByModule = { alphabet: alphabetProgress, vowels: vowelsProgress, consonants: consonantsProgress, cvc: cvcProgress };
  const overall = Math.round((alphabetProgress + vowelsProgress + consonantsProgress + cvcProgress) / 4);
  const level = getLevel(overall);
  const xpInLevel = getXpInLevel(overall);
  const activeModule = modules.find((module) => module.key === activeView);

  return (
    <>
      <button
        type="button"
        className="sidebar-toggle student-sidebar-toggle"
        onClick={onToggle}
        aria-label={isOpen ? 'Hide sidebar' : 'Show sidebar'}
        title={isOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        <img className={isOpen ? 'sidebar-toggle-icon' : 'sidebar-toggle-icon sidebar-toggle-icon-reversed'} src={hideSidebarIcon} alt="" />
      </button>
      <aside className={isOpen ? 'app-sidebar student-sidebar' : 'app-sidebar student-sidebar sidebar-hidden'} aria-label="Main navigation">
        <div className="ss-brand">
          <span className="ss-brand-mark" aria-hidden="true">P</span>
          <strong>Phonexis</strong>
        </div>

        {/* Player card */}
        <div className="ss-player">
          <div className="ss-player-top">
            <span className="ss-avatar" aria-hidden="true">{displayName.charAt(0).toUpperCase()}</span>
            <div className="ss-player-copy">
              <strong title={displayName}>{displayName}</strong>
              <span>Level {level} Learner</span>
            </div>
          </div>
          <div className="ss-xp" aria-label={`Overall progress ${overall}%`}>
            <div className="ss-xp-track">
              <div className="ss-xp-fill" style={{ '--p': `${xpInLevel}%` }} />
            </div>
            <span>⭐ {overall}%</span>
          </div>
        </div>

        <nav className="ss-nav">
          <button
            type="button"
            className={activeView === 'dashboard' ? 'ss-link active' : 'ss-link'}
            onClick={() => onNavigate('dashboard')}
          >
            <span className="ss-link-icon" aria-hidden="true">🏠</span> Home
          </button>

          <p className="ss-title">🗺️ Worlds</p>
          <div className="ss-worlds">
            {modules.map((module) => {
              const progress = progressByModule[module.key];
              return (
                <button
                  key={module.key}
                  type="button"
                  className={`ss-world ss-${module.color}${activeView === module.key ? ' active' : ''}`}
                  onClick={() => onSelectModule?.(module.key)}
                >
                  <span className="ss-world-icon" aria-hidden="true">{module.icon}</span>
                  <span className="ss-world-copy">
                    <span className="ss-world-name">{module.label}</span>
                    <span className="ss-world-bar"><span style={{ '--p': `${progress}%` }} /></span>
                  </span>
                  <strong className="ss-world-progress">{progress >= 100 ? '✓' : `${progress}%`}</strong>
                </button>
              );
            })}
          </div>

          {sections.length > 0 && (
            <div className={`ss-quests ss-${activeModule?.color || 'blue'}`}>
              <p className="ss-title">{activeModule?.icon} {activeModule?.label} quests</p>
              <button type="button" className="ss-back" onClick={() => onNavigate('dashboard')}>
                ← Back to map
              </button>
              {sections.map((section) => {
                const isAlphabetLevel = activeView === 'alphabet' && ['easy', 'medium', 'hard'].includes(section.key);
                const score = alphabetScores[section.key];
                const isPassed = completedAlphabetModes.includes(section.key) || (score && score.score === score.total);
                const expectedTotals = { easy: 10, medium: 8, hard: 5 };
                const displayScore = score || (isPassed ? { score: expectedTotals[section.key], total: expectedTotals[section.key] } : null);

                return (
                  <button
                    key={section.key}
                    type="button"
                    className={`ss-quest${activeSection === section.key ? ' active' : ''}${section.isGame ? ' game' : ''}`}
                    onClick={() => onNavigate(activeView, section.key)}
                  >
                    <span className="ss-quest-icon" aria-hidden="true">{section.icon}</span>
                    <span className="ss-quest-label">{section.label.replace(/^Game:\s*/, '')}</span>
                    {section.isGame ? <span className="ss-game-tag">GAME</span> : null}
                    {isAlphabetLevel ? (
                      <span className={`ss-quest-score${isPassed ? ' passed' : ''}`}>
                        {isPassed ? '✓ ' : ''}{displayScore ? `${displayScore.score}/${displayScore.total}` : ''}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          {studentClassInfo?.classId && (
            <>
              <p className="ss-title">🏫 Class</p>
              <button
                type="button"
                className={activeView === 'class' ? 'ss-link active' : 'ss-link'}
                onClick={() => onNavigate('class', 'materials')}
              >
                <span className="ss-link-icon" aria-hidden="true">📚</span>
                <span className="ss-class-name">{studentClassInfo.className || studentClassInfo.name || 'My Class'}</span>
              </button>
            </>
          )}

          <p className="ss-title">⚙️ Account</p>
          <button
            type="button"
            className={activeView === 'profile' && activeSection !== 'settings' ? 'ss-link active' : 'ss-link'}
            onClick={() => onNavigate('profile', 'info')}
          >
            <span className="ss-link-icon" aria-hidden="true">🧑</span> Profile
          </button>
          <button
            type="button"
            className={activeView === 'profile' && activeSection === 'settings' ? 'ss-link active' : 'ss-link'}
            onClick={() => onNavigate('profile', 'settings')}
          >
            <span className="ss-link-icon" aria-hidden="true">🛠️</span> Settings
          </button>
        </nav>

        <button type="button" className="ss-logout" onClick={onLogout}>
          <span aria-hidden="true">🚪</span> Logout
        </button>
      </aside>
    </>
  );
}
