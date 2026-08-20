import React, { useEffect, useState } from 'react';
import './Admin.css';
import { deleteBackendUser, fetchBackendUsers, updateBackendUser } from '../../lib/supabaseClient';

export default function Admin({ onLogout, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promotingUserId, setPromotingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBackendUsers();
      if (result.error) {
        setError(result.error.message || 'Failed to load users');
      } else {
        setUsers(Array.isArray(result.data) ? result.data : []);
      }
    } catch (e) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const promoteToTeacher = async (userId) => {
    setPromotingUserId(userId);
    setError(null);
    setNotice(null);
    try {
      const res = await updateBackendUser(userId, { role: 'teacher' });
      if (res.error) {
        setError(res.error.message || 'Failed to update user');
      } else {
        setNotice('User role updated to teacher successfully.');
        await loadUsers();
      }
    } catch (e) {
      setError('Failed to update user');
    } finally {
      setPromotingUserId(null);
    }
  };

  const deleteAccount = async (userId) => {
    const confirmDelete = window.confirm('Delete this account? This cannot be undone.');
    if (!confirmDelete) {
      return;
    }

    setDeletingUserId(userId);
    setError(null);
    setNotice(null);

    try {
      const res = await deleteBackendUser(userId);
      if (res.error) {
        setError(res.error.message || 'Failed to delete user');
      } else {
        setNotice('User deleted successfully.');
        await loadUsers();
      }
    } catch (e) {
      setError('Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const toFullName = (user) => {
    const firstName = user.user_metadata?.firstName || user.firstName || user.user_metadata?.firstname || user.firstname || '';
    const lastName = user.user_metadata?.lastName || user.lastName || user.user_metadata?.lastname || user.lastname || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown user';
  };

  const totalUsers = users.length;
  const totalStudents = users.filter((u) => String(u.role || '').toLowerCase() === 'student').length;
  const totalTeachers = users.filter((u) => String(u.role || '').toLowerCase() === 'teacher').length;
  const totalAdmins = users.filter((u) => String(u.role || '').toLowerCase() === 'admin').length;

  return (
    <section className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-title-wrap">
          <p className="admin-kicker">Control Center</p>
          <h2>Admin User Management</h2>
          <p className="admin-subtitle">Manage accounts and promote student users into teacher roles.</p>
        </div>
        <div className="admin-top-actions">
          <button type="button" className="admin-refresh-button" onClick={loadUsers} disabled={loading || !!promotingUserId}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button type="button" className="admin-logout-button" onClick={onLogout}>
            ↪ Logout
          </button>
        </div>
      </header>

      <section className="admin-stats" aria-label="User summary">
        <article className="admin-stat-card">
          <span>Total Accounts</span>
          <strong>{totalUsers}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Students</span>
          <strong>{totalStudents}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Teachers</span>
          <strong>{totalTeachers}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Admins</span>
          <strong>{totalAdmins}</strong>
        </article>
      </section>

      <div className="admin-content">
        <div className="admin-content-head">
          <h3>Accounts and Roles</h3>
          <span className="admin-management-badge">Admin Management</span>
        </div>

        {loading && <p className="admin-loading">Loading accounts...</p>}
        {notice && <div className="admin-notice">{notice}</div>}
        {error && <div className="admin-error">{error}</div>}

        <table className="admin-table" aria-label="User accounts">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th className="admin-actions-column">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isCurrentAdmin = String(u.email || '').trim().toLowerCase() === String(currentUser?.email || '').trim().toLowerCase();

              return (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{toFullName(u)}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`admin-role-badge admin-role-${String(u.role || '').toLowerCase()}`}>
                    {String(u.role || 'student').toUpperCase()}
                  </span>
                </td>
                <td>
                  {isCurrentAdmin ? (
                    <span className="admin-small">Current admin</span>
                  ) : String(u.role || '').toLowerCase() === 'student' ? (
                    <button
                      type="button"
                      className="admin-promote-button"
                      onClick={() => promoteToTeacher(u.id)}
                      disabled={loading || !!promotingUserId || !!deletingUserId}
                    >
                      {promotingUserId === u.id ? 'Updating...' : 'Promote to Teacher'}
                    </button>
                  ) : (
                    <span className="admin-small">—</span>
                  )}
                  {!isCurrentAdmin && (
                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={() => deleteAccount(u.id)}
                      disabled={loading || !!promotingUserId || !!deletingUserId}
                    >
                      {deletingUserId === u.id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </td>
              </tr>
              );
            })}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan="5" className="admin-empty">No accounts found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
