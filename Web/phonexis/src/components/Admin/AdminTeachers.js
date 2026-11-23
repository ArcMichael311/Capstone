import React, { useEffect, useMemo, useState } from 'react';
import './Admin.css';
import { deleteBackendUser, fetchBackendUsers } from '../../lib/supabaseClient';
import { toFullName, formatDate, getInitials } from './adminHelpers';
import { ChalkboardIcon, SearchIcon, CloseIcon } from './AdminIcons';
import { TrashIcon } from '../Teacher/TeacherIcons';
import AdminRoleSelect from './AdminRoleSelect';

export default function AdminTeachers({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBackendUsers();
      if (result.error) {
        setError(result.error.message || 'Failed to load teachers');
      } else {
        setUsers(Array.isArray(result.data) ? result.data : []);
      }
    } catch (e) {
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    const refreshOnFocus = () => void loadUsers();
    window.addEventListener('focus', refreshOnFocus);
    return () => window.removeEventListener('focus', refreshOnFocus);
  }, []);

  const handleRoleChanged = async (message) => {
    setError(null);
    setNotice(message);
    await loadUsers();
  };

  const handleRoleError = (message) => {
    setNotice(null);
    setError(message);
  };

  const deleteAccount = async (userId) => {
    const confirmDelete = window.confirm('Delete this teacher account? This cannot be undone.');
    if (!confirmDelete) {
      return;
    }

    setDeletingUserId(userId);
    setError(null);
    setNotice(null);

    try {
      const res = await deleteBackendUser(userId);
      if (res.error) {
        setError(res.error.message || 'Failed to delete teacher');
      } else {
        setNotice('Teacher account deleted successfully.');
        await loadUsers();
      }
    } catch (e) {
      setError('Failed to delete teacher');
    } finally {
      setDeletingUserId(null);
    }
  };

  const teachers = useMemo(() => users.filter((u) => String(u.role || '').toLowerCase() === 'teacher'), [users]);

  const filteredTeachers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return teachers;
    }

    return teachers.filter((teacher) => {
      const name = toFullName(teacher).toLowerCase();
      const email = String(teacher.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [teachers, searchTerm]);

  return (
    <section className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-title-wrap">
          <p className="admin-kicker">Teacher Management</p>
          <h2>Teachers</h2>
          <p className="admin-subtitle">Review teacher accounts and change their role to Student (Normal) or Admin.</p>
        </div>
      </header>

      <section className="admin-stats" aria-label="Teacher summary">
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon-green"><ChalkboardIcon /></span>
          <div className="admin-stat-body">
            <span className="admin-stat-label">Total Teachers</span>
            <strong className="admin-stat-value">{teachers.length}</strong>
          </div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon-slate"><SearchIcon /></span>
          <div className="admin-stat-body">
            <span className="admin-stat-label">Matching Search</span>
            <strong className="admin-stat-value">{filteredTeachers.length}</strong>
          </div>
        </article>
      </section>

      <div className="admin-content">
        <div className="admin-content-head">
          <h3>Teacher Accounts</h3>
          <button type="button" className="admin-management-badge admin-refresh-button" onClick={() => void loadUsers()} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="admin-search-bar">
          <span className="admin-search-icon"><SearchIcon /></span>
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search teachers by name or email..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search teachers"
          />
          {searchTerm && (
            <button type="button" className="admin-search-clear" onClick={() => setSearchTerm('')} aria-label="Clear search">
              <CloseIcon />
            </button>
          )}
        </div>

        {loading && <p className="admin-loading">Loading teachers...</p>}
        {notice && <div className="admin-notice">{notice}</div>}
        {error && <div className="admin-error">{error}</div>}

        <table className="admin-table" aria-label="Teacher accounts">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Class Code</th>
              <th>Joined</th>
              <th className="admin-actions-column">Role &amp; Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.map((teacher) => {
              const name = toFullName(teacher);
              return (
                <tr key={teacher.id}>
                  <td>
                    <div className="admin-person">
                      <span className="admin-avatar admin-avatar-green">{getInitials(name)}</span>
                      <span className="admin-person-name">{name}</span>
                    </div>
                  </td>
                  <td>{teacher.email}</td>
                  <td>{teacher.classCode || teacher.user_metadata?.classCode || '—'}</td>
                  <td>{formatDate(teacher.createdAt)}</td>
                  <td className="admin-actions-cell">
                    <AdminRoleSelect
                      user={teacher}
                      currentUserId={currentUserId}
                      disabled={loading || !!deletingUserId}
                      onChanged={handleRoleChanged}
                      onError={handleRoleError}
                    />
                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={() => deleteAccount(teacher.id)}
                      disabled={loading || !!deletingUserId}
                      title={deletingUserId === teacher.id ? 'Deleting...' : 'Delete teacher'}
                      aria-label={deletingUserId === teacher.id ? 'Deleting teacher' : 'Delete teacher'}
                    >
                      {deletingUserId === teacher.id ? 'Deleting...' : <TrashIcon />}
                    </button>
                  </td>
                </tr>
              );
            })}

            {!loading && filteredTeachers.length === 0 && (
              <tr>
                <td colSpan="5" className="admin-empty">
                  {searchTerm ? 'No teachers match your search.' : 'No teacher accounts found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
