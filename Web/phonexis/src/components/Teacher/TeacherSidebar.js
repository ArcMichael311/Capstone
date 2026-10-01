import '../Sidebar/Sidebar.css';
import '../Admin/AdminSidebar.css';
import './TeacherModern.css';
import logoutIcon from '../Sidebar/Sidebar Icons/Logout.png';
import hideSidebarIcon from '../Sidebar/Sidebar Icons/Hide sidebar.png';
import { BookIcon, ChartIcon, ClipboardCheckIcon, GearIcon, HomeIcon, UserIcon } from './TeacherIcons';

export default function TeacherSidebar({ isOpen = true, onToggle, activeView, activeSection, currentUser, onNavigate, onLogout }) {
  const displayName = [
    currentUser?.firstname || currentUser?.user_metadata?.firstname,
    currentUser?.lastname || currentUser?.user_metadata?.lastname,
  ]
    .filter(Boolean)
    .join(' ') || currentUser?.email?.split('@')[0] || 'Teacher';

  const section = activeSection || 'dashboard';
  const isTeacherView = activeView === 'teacher';
  const isProfile = activeView === 'profile' && activeSection !== 'settings';
  const isSettings = activeView === 'profile' && activeSection === 'settings';

  const mainLinks = [
    { key: 'dashboard', label: 'My Classes', icon: <HomeIcon />, color: 'blue' },
    { key: 'materials', label: 'Learning Materials', icon: <BookIcon />, color: 'teal' },
    { key: 'pretest', label: 'Pretest', icon: <ClipboardCheckIcon />, color: 'orange' },
    { key: 'progress', label: 'Academic Progress', icon: <ChartIcon />, color: 'violet' },
  ];

  const renderLink = ({ key, label, icon, color, active, onClick }) => (
    <button
      key={key}
      type="button"
      className={`sidebar-link tw-nav-link tw-nav-${color} ${active ? 'active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      <span className="tw-nav-icon" aria-hidden="true">{icon}</span>
      {label}
    </button>
  );

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
      <aside className={isOpen ? 'app-sidebar admin-sidebar teacher-sidebar' : 'app-sidebar admin-sidebar teacher-sidebar sidebar-hidden'} aria-label="Teacher navigation">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark" aria-hidden="true">P</span>
          <div>
            <strong>Phonexis</strong>
            <span>{displayName}</span>
          </div>
        </div>
        <span className="admin-sidebar-tag">Teacher</span>

        <nav className="sidebar-navigation">
          {mainLinks.map((link) => renderLink({
            ...link,
            active: isTeacherView && section === link.key,
            onClick: () => onNavigate('teacher', link.key),
          }))}

          <div className="sidebar-account">
            <p className="sidebar-section-title admin-nav-label">Account</p>
            {renderLink({ key: 'profile', label: 'Profile', icon: <UserIcon />, color: 'pink', active: isProfile, onClick: () => onNavigate('profile', 'info') })}
            {renderLink({ key: 'settings', label: 'Settings', icon: <GearIcon />, color: 'slate', active: isSettings, onClick: () => onNavigate('profile', 'settings') })}
          </div>
        </nav>

        <button type="button" className="sidebar-logout" onClick={onLogout}>
          <img src={logoutIcon} alt="" /> Logout
        </button>
      </aside>
    </>
  );
}
