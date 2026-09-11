import React, { useEffect, useMemo, useState } from 'react';
import './Admin.css';
import { fetchBackendUsers } from '../../lib/supabaseClient';
import { toFullName, formatDate, getInitials } from './adminHelpers';
import { UsersIcon, GraduationIcon, ChalkboardIcon, ShieldIcon, ArrowRightIcon } from './AdminIcons';

export default function AdminDashboard({ onNavigate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBackendUsers();
      if (result.error) {
        setError(result.error.message || 'Failed to load monitoring data');
      } else {
        setUsers(Array.isArray(result.data) ? result.data : []);
      }
    } catch (e) {
      setError('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const students = useMemo(() => users.filter((u) => String(u.role || '').toLowerCase() === 'student'), [users]);
  const teachers = useMemo(() => users.filter((u) => String(u.role || '').toLowerCase() === 'teacher'), [users]);
  const admins = useMemo(() => users.filter((u) => String(u.role || '').toLowerCase() === 'admin'), [users]);
  const totalUsers = users.length;

  const studentShare = totalUsers ? Math.round((students.length / totalUsers) * 100) : 0;
  const teacherShare = totalUsers ? Math.round((teachers.length / totalUsers) * 100) : 0;
  const adminShare = totalUsers ? Math.max(0, 100 - studentShare - teacherShare) : 0;

  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 6);
  }, [users]);

  return (
    <section className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-title-wrap">
          <p className="admin-kicker">Control Center</p>
          <h2>Admin Dashboard</h2>
          <p className="admin-subtitle">A monitoring overview of active students and teachers across Phonexis.</p>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-stats" aria-label="User summary">
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon-slate"><UsersIcon /></span>
          <div className="admin-stat-body">
            <span className="admin-stat-label">Total Accounts</span>
            <strong className="admin-stat-value">{totalUsers}</strong>
          </div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon-blue"><GraduationIcon /></span>
          <div className="admin-stat-body">
            <span className="admin-stat-label">Active Students</span>
            <strong className="admin-stat-value">{students.length}</strong>
          </div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon-green"><ChalkboardIcon /></span>
          <div className="admin-stat-body">
            <span className="admin-stat-label">Active Teachers</span>
            <strong className="admin-stat-value">{teachers.length}</strong>
          </div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon-gold"><ShieldIcon /></span>
          <div className="admin-stat-body">
            <span className="admin-stat-label">Administrators</span>
            <strong className="admin-stat-value">{admins.length}</strong>
          </div>
        </article>
      </section>

      <div className="admin-monitor-grid">
        <div className="admin-content admin-distribution-card">
          <div className="admin-content-head">
            <h3>Role Distribution</h3>
            <span className="admin-management-badge">Live</span>
          </div>

          <div className="admin-distribution-bar" role="img" aria-label={`${studentShare}% students, ${teacherShare}% teachers, ${adminShare}% admins`}>
            <span className="admin-distribution-segment admin-distribution-students" style={{ width: `${studentShare}%` }} />
            <span className="admin-distribution-segment admin-distribution-teachers" style={{ width: `${teacherShare}%` }} />
            <span className="admin-distribution-segment admin-distribution-admins" style={{ width: `${adminShare}%` }} />
          </div>

          <ul className="admin-distribution-legend">
            <li><span className="admin-legend-dot admin-legend-students" />Students <strong>{studentShare}%</strong></li>
            <li><span className="admin-legend-dot admin-legend-teachers" />Teachers <strong>{teacherShare}%</strong></li>
            <li><span className="admin-legend-dot admin-legend-admins" />Admins <strong>{adminShare}%</strong></li>
          </ul>

          <div className="admin-quick-links">
            <button type="button" className="admin-quick-link" onClick={() => onNavigate?.('admin', 'students')}>
              Manage Students <ArrowRightIcon />
            </button>
            <button type="button" className="admin-quick-link" onClick={() => onNavigate?.('admin', 'teachers')}>
              Manage Teachers <ArrowRightIcon />
            </button>
          </div>
        </div>

        <div className="admin-content admin-recent-card">
          <div className="admin-content-head">
            <h3>Recently Joined</h3>
            <span className="admin-management-badge">Latest 6</span>
          </div>

          {loading && <p className="admin-loading">Loading accounts...</p>}

          <ul className="admin-recent-list">
            {recentUsers.map((user) => {
              const name = toFullName(user);
              const role = String(user.role || 'student').toLowerCase();
              return (
                <li key={user.id} className="admin-recent-item">
                  <div className="admin-recent-identity">
                    <span className={`admin-avatar ${role === 'teacher' ? 'admin-avatar-green' : role === 'student' ? 'admin-avatar-blue' : ''}`}>
                      {getInitials(name)}
                    </span>
                    <div className="admin-recent-name-wrap">
                      <strong>{name}</strong>
                      <span>{user.email}</span>
                    </div>
                  </div>
                  <div className="admin-recent-meta">
                    <span className={`admin-role-badge admin-role-${role}`}>
                      {role.toUpperCase()}
                    </span>
                    <span className="admin-recent-date">{formatDate(user.createdAt)}</span>
                  </div>
                </li>
              );
            })}

            {!loading && recentUsers.length === 0 && (
              <li className="admin-empty">No accounts found.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
