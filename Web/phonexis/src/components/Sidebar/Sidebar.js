import './Sidebar.css';
import dashboardIcon from './Sidebar Icons/Dashboard.png';
import profileIcon from './Sidebar Icons/Profile.png';
import settingsIcon from './Sidebar Icons/Settings.png';
import logoutIcon from './Sidebar Icons/Logout.png';
import returnIcon from './Sidebar Icons/Return.png';
import hideSidebarIcon from './Sidebar Icons/Hide sidebar.png';

const moduleSections = {
  alphabet: [
    { key: 'easy', label: 'Easy' },
    { key: 'medium', label: 'Medium' },
    { key: 'hard', label: 'Hard' },
    { key: 'alphaquest', label: 'AlphaQuest' },
  ],
  vowels: [
    { key: 'learning', label: 'Learning Materials' },
    { key: 'lesson', label: 'Lesson' },
    { key: 'pretest', label: 'Pretest' },
    { key: 'vowelrush', label: 'VowelRush' },
  ],
  consonants: [
    { key: 'learning', label: 'Learning Materials' },
    { key: 'explore', label: 'Explore' },
    { key: 'teacher', label: 'Teacher Activity' },
    { key: 'game', label: 'Game' },
    { key: 'wordblast', label: 'WordBlast' },
  ],
  cvc: [
    { key: 'learning', label: 'Learning Materials' },
    { key: 'families', label: 'Word Families' },
    { key: 'selection', label: 'Word Selection' },
    { key: 'building', label: 'Word Building' },
  ],
};

const modules = [
  { key: 'alphabet', label: 'Alphabet Recognition' },
  { key: 'vowels', label: 'Vowels' },
  { key: 'consonants', label: 'Consonants' },
  { key: 'cvc', label: 'CVC Words' },
];

export default function Sidebar({ isOpen = true, onToggle, activeView, activeSection, currentUser, onNavigate, onSelectModule, onLogout, alphabetProgress = 0, vowelsProgress = 0, consonantsProgress = 0, cvcProgress = 0, alphabetScores = {} }) {
  const displayName = [currentUser?.firstname || currentUser?.user_metadata?.firstname, currentUser?.lastname || currentUser?.user_metadata?.lastname]
    .filter(Boolean)
    .join(' ') || currentUser?.email?.split('@')[0] || 'Learner';
  const sections = moduleSections[activeView] || [];
  const progressByModule = { alphabet: alphabetProgress, vowels: vowelsProgress, consonants: consonantsProgress, cvc: cvcProgress };

  return (
    <>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={onToggle}
        aria-label={isOpen ? 'Hide sidebar' : 'Show sidebar'}
        title={isOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        <img className={isOpen ? 'sidebar-toggle-icon' : 'sidebar-toggle-icon sidebar-toggle-icon-reversed'} src={hideSidebarIcon} alt="" />
      </button>
      <aside className={isOpen ? 'app-sidebar' : 'app-sidebar sidebar-hidden'} aria-label="Main navigation">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark" aria-hidden="true">P</span>
        <div>
          <strong>Phonexis</strong>
          <span>{displayName}</span>
        </div>
      </div>

      <nav className="sidebar-navigation">
        <button type="button" className={activeView === 'dashboard' ? 'sidebar-link active' : 'sidebar-link'} onClick={() => onNavigate('dashboard')}>
          <img src={dashboardIcon} alt="" /> Dashboard
        </button>

        <div className="sidebar-section sidebar-module-list">
          {modules.map((module) => (
            <button
              key={module.key}
              type="button"
              className={activeView === module.key ? 'sidebar-sub-link active' : 'sidebar-sub-link'}
              onClick={() => onSelectModule?.(module.key)}
            >
              <span>{module.label}</span>
              <strong className="sidebar-module-progress">{progressByModule[module.key]}%</strong>
            </button>
          ))}
        </div>

        {sections.length > 0 && (
          <div className="sidebar-section">
            <p className="sidebar-section-title">{activeView === 'alphabet' ? 'Alphabet Recognition' : activeView === 'cvc' ? 'CVC Words' : activeView.charAt(0).toUpperCase() + activeView.slice(1)}</p>
            <button type="button" className="sidebar-back-link" onClick={() => onNavigate('dashboard')}>
              <img src={returnIcon} alt="" /> Return to dashboard
            </button>
            {sections.map((section) => {
              const isAlphabetLevel = activeView === 'alphabet' && ['easy', 'medium', 'hard'].includes(section.key);
              const score = alphabetScores[section.key];
              const isPassed = score && score.score === score.total;

              return (
                <button
                  key={section.key}
                  type="button"
                  className={activeSection === section.key ? 'sidebar-sub-link active' : 'sidebar-sub-link'}
                  onClick={() => onNavigate(activeView, section.key)}
                >
                  {isAlphabetLevel ? (
                    <>
                      <span>{section.label}</span>
                      <strong className="sidebar-pretest-check">{isPassed ? '✓' : ''}</strong>
                      <strong className="sidebar-pretest-score">{score ? `${score.score}/${score.total}` : ''}</strong>
                    </>
                  ) : section.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="sidebar-account">
          <button type="button" className={activeView === 'profile' && activeSection !== 'settings' ? 'sidebar-link active' : 'sidebar-link'} onClick={() => onNavigate('profile', 'info')}>
            <img src={profileIcon} alt="" /> Profile
          </button>
          <button type="button" className={activeView === 'profile' && activeSection === 'settings' ? 'sidebar-link active' : 'sidebar-link'} onClick={() => onNavigate('profile', 'settings')}>
            <img src={settingsIcon} alt="" /> Settings
          </button>
        </div>
      </nav>

      <button type="button" className="sidebar-logout" onClick={onLogout}>
        <img src={logoutIcon} alt="" /> Logout
      </button>
      </aside>
    </>
  );
}