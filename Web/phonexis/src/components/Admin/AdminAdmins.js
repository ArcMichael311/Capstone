import React, { useEffect, useMemo, useState } from 'react';
import './Admin.css';
import { deleteBackendUser, fetchBackendUsers } from '../../lib/supabaseClient';
import { toFullName, formatDate, getInitials } from './adminHelpers';
import { ShieldIcon, SearchIcon, CloseIcon } from './AdminIcons';
import { TrashIcon } from '../Teacher/TeacherIcons';
import AdminRoleSelect from './AdminRoleSelect';

export default function AdminAdmins({ currentUserId }) {
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
        setError(result.error.message || 'Failed to load admins');
      } else {
        setUsers(Array.isArray(result.data) ? result.data : []);
      }
    } catch (e) {
      setError('Failed to load admins');
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
    const confirmDelete = window.confirm('Delete this admin account? This cannot be undone.');
    if (!confirmDelete) {
      return;
    }

    setDeletingUserId(userId);
    setError(null);
    setNotice(null);

    try {
      const res = await deleteBackendUser(userId);
      if (res.error) {
        setError(res.error.message || 'Failed to delete admin');
      } else {
        setNotice('Admin account deleted successfully.');
        await loadUsers();
      }
    } catch (e) {
      setError('Failed to delete admin');
    } finally {
      setDeletingUserId(null);
    }
  };

  const admins = useMemo(() => users.filter((u) => String(u.role || '').toLowerCase() === 'admin'), [users]);

  const filteredAdmins = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return admins;
    }

    return admins.filter((admin) => {
      const name = toFullName(admin).toLowerCase();
      const email = String(admin.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [admins, searchTerm]);

  return (
    <section className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-title-wrap">
          <p className="admin-kicker">Admin Management</p>
          <h2>Admins</h2>
          <p className="admin-subtitle">Admins can manage every account and its role. At least one admin must always remain.</p>
        </div>
      </header>

      <section className="admin-stats" aria-label="Admin summary">
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon-gold"><ShieldIcon /></span>
          <div className="admin-stat-body">
            <span className="admin-stat-label">Total Admins</span>
            <strong className="admin-stat-value">{admins.length}</strong>
          </div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon-slate"><SearchIcon /></span>
          <div className="admin-stat-body">
            <span className="admin-stat-label">Matching Search</span>
            <strong className="admin-stat-value">{filteredAdmins.length}</strong>
          </div>
        </article>
      </section>

      <div className="admin-content">
        <div className="admin-content-head">
          <h3>Admin Accounts</h3>
          <button type="button" className="admin-management-badge admin-refresh-button" onClick={() => void loadUsers()} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="admin-search-bar">
          <span className="admin-search-icon"><SearchIcon /></span>
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search admins by name or email..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search admins"
          />
          {searchTerm && (
            <button type="button" className="admin-search-clear" onClick={() => setSearchTerm('')} aria-label="Clear search">
              <CloseIcon />
            </button>
          )}
        </div>

        {loading && <p className="admin-loading">Loading admins...</p>}
        {notice && <div className="admin-notice">{notice}</div>}
        {error && <div className="admin-error">{error}</div>}

        <table className="admin-table" aria-label="Admin accounts">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Joined</th>
              <th className="admin-actions-column">Role &amp; Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((admin) => {
              const name = toFullName(admin);
              const isSelf = currentUserId != null && String(currentUserId) === String(admin.id);
              return (
                <tr key={admin.id}>
                  <td>
                    <div className="admin-person">
                      <span className="admin-avatar">{getInitials(name)}</span>
                      <span className="admin-person-name">{name}{isSelf ? ' (You)' : ''}</span>
                    </div>
                  </td>
                  <td>{admin.email}</td>
                  <td>{formatDate(admin.createdAt)}</td>
                  <td className="admin-actions-cell">
                    <AdminRoleSelect
                      user={admin}
                      currentUserId={currentUserId}
                      disabled={loading || !!deletingUserId}
                      onChanged={handleRoleChanged}
                      onError={handleRoleError}
                    />
                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={() => deleteAccount(admin.id)}
                      disabled={loading || !!deletingUserId || isSelf}
                      title={isSelf ? "You can't delete your own account" : 'Delete admin'}
                      aria-label={deletingUserId === admin.id ? 'Deleting admin' : 'Delete admin'}
                    >
                      {deletingUserId === admin.id ? 'Deleting...' : <TrashIcon />}
                    </button>
                  </td>
                </tr>
              );
            })}

            {!loading && filteredAdmins.length === 0 && (
              <tr>
                <td colSpan="4" className="admin-empty">
                  {searchTerm ? 'No admins match your search.' : 'No admin accounts found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
