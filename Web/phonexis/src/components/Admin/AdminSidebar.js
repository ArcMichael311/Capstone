import '../Sidebar/Sidebar.css';
import './AdminSidebar.css';
import dashboardIcon from '../Sidebar/Sidebar Icons/Dashboard.png';
import profileIcon from '../Sidebar/Sidebar Icons/Profile.png';
import settingsIcon from '../Sidebar/Sidebar Icons/Settings.png';
import logoutIcon from '../Sidebar/Sidebar Icons/Logout.png';
import hideSidebarIcon from '../Sidebar/Sidebar Icons/Hide sidebar.png';
import { GraduationIcon, ChalkboardIcon } from './AdminIcons';

export default function AdminSidebar({ isOpen = true, onToggle, activeView, activeSection, currentUser, onNavigate, onLogout }) {
  const displayName = [
    currentUser?.firstname || currentUser?.user_metadata?.firstname,
    currentUser?.lastname || currentUser?.user_metadata?.lastname,
  ]
    .filter(Boolean)
    .join(' ') || currentUser?.email?.split('@')[0] || 'Administrator';

  const isDashboard = activeView === 'admin' && !activeSection;
  const isStudents = activeView === 'admin' && activeSection === 'students';
  const isTeachers = activeView === 'admin' && activeSection === 'teachers';
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
      <aside className={isOpen ? 'app-sidebar admin-sidebar' : 'app-sidebar admin-sidebar sidebar-hidden'} aria-label="Admin navigation">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark" aria-hidden="true">P</span>
          <div>
            <strong>Phonexis</strong>
            <span>{displayName}</span>
          </div>
        </div>
        <span className="admin-sidebar-tag">Administrator</span>

        <nav className="sidebar-navigation">
          <p className="sidebar-section-title admin-nav-label">Overview</p>
          <button type="button" className={isDashboard ? 'sidebar-link active' : 'sidebar-link'} onClick={() => onNavigate('admin')}>
            <img src={dashboardIcon} alt="" /> Dashboard
          </button>

          <p className="sidebar-section-title admin-nav-label">Management</p>
          <button type="button" className={isStudents ? 'sidebar-link active' : 'sidebar-link'} onClick={() => onNavigate('admin', 'students')}>
            <GraduationIcon /> Student
          </button>

          <button type="button" className={isTeachers ? 'sidebar-link active' : 'sidebar-link'} onClick={() => onNavigate('admin', 'teachers')}>
            <ChalkboardIcon /> Teacher
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
