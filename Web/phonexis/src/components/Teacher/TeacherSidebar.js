import '../Sidebar/Sidebar.css';
import '../Admin/AdminSidebar.css';
import dashboardIcon from '../Sidebar/Sidebar Icons/Dashboard.png';
import profileIcon from '../Sidebar/Sidebar Icons/Profile.png';
import settingsIcon from '../Sidebar/Sidebar Icons/Settings.png';
import logoutIcon from '../Sidebar/Sidebar Icons/Logout.png';
import hideSidebarIcon from '../Sidebar/Sidebar Icons/Hide sidebar.png';
import { BookIcon, ChartIcon } from './TeacherIcons';

export default function TeacherSidebar({ isOpen = true, onToggle, activeView, activeSection, currentUser, onNavigate, onLogout }) {
  const displayName = [
    currentUser?.firstname || currentUser?.user_metadata?.firstname,
    currentUser?.lastname || currentUser?.user_metadata?.lastname,
  ]
    .filter(Boolean)
    .join(' ') || currentUser?.email?.split('@')[0] || 'Teacher';

  const section = activeSection || 'dashboard';
  const isDashboard = activeView === 'teacher' && section === 'dashboard';
  const isMaterials = activeView === 'teacher' && section === 'materials';
  const isProgress = activeView === 'teacher' && section === 'progress';
  const isProfile = activeView === 'profile' && activeSection !== 'settings';
  const isSettings = activeView === 'profile' && activeSection === 'settings';

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
      <aside className={isOpen ? 'app-sidebar admin-sidebar' : 'app-sidebar admin-sidebar sidebar-hidden'} aria-label="Teacher navigation">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark" aria-hidden="true">P</span>
          <div>
            <strong>Phonexis</strong>
            <span>{displayName}</span>
          </div>
        </div>
        <span className="admin-sidebar-tag">Teacher</span>

        <nav className="sidebar-navigation">
          <button type="button" className={isDashboard ? 'sidebar-link active' : 'sidebar-link'} onClick={() => onNavigate('teacher', 'dashboard')}>
            <img src={dashboardIcon} alt="" /> Dashboard
          </button>

          <button type="button" className={isMaterials ? 'sidebar-link active' : 'sidebar-link'} onClick={() => onNavigate('teacher', 'materials')}>
            <BookIcon /> Learning Materials
          </button>

          <button type="button" className={isProgress ? 'sidebar-link active' : 'sidebar-link'} onClick={() => onNavigate('teacher', 'progress')}>
            <ChartIcon /> Academic Progress
          </button>

          <div className="sidebar-account">
            <p className="sidebar-section-title admin-nav-label">Account</p>
            <button type="button" className={isProfile ? 'sidebar-link active' : 'sidebar-link'} onClick={() => onNavigate('profile', 'info')}>
              <img src={profileIcon} alt="" /> Profile
            </button>
            <button type="button" className={isSettings ? 'sidebar-link active' : 'sidebar-link'} onClick={() => onNavigate('profile', 'settings')}>
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
