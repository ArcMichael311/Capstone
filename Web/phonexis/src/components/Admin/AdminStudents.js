import React, { useEffect, useMemo, useState } from 'react';
import './Admin.css';
import { deleteBackendUser, fetchBackendUsers, updateBackendUser } from '../../lib/supabaseClient';
import { toFullName, formatDate, getInitials } from './adminHelpers';
import { GraduationIcon, SearchIcon, CloseIcon } from './AdminIcons';

export default function AdminStudents() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promotingUserId, setPromotingUserId] = useState(null);
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
        setError(result.error.message || 'Failed to load students');
      } else {
        setUsers(Array.isArray(result.data) ? result.data : []);
      }
    } catch (e) {
      setError('Failed to load students');
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
        setError(res.error.message || 'Failed to promote student');
      } else {
        setNotice('Student promoted to teacher successfully.');
        await loadUsers();
      }
    } catch (e) {
      setError('Failed to promote student');
    } finally {
      setPromotingUserId(null);
    }
  };

  const deleteAccount = async (userId) => {
    const confirmDelete = window.confirm('Delete this student account? This cannot be undone.');
    if (!confirmDelete) {
      return;
    }

    setDeletingUserId(userId);
    setError(null);
    setNotice(null);

    try {
      const res = await deleteBackendUser(userId);
      if (res.error) {
        setError(res.error.message || 'Failed to delete student');
      } else {
        setNotice('Student account deleted successfully.');
        await loadUsers();
      }
    } catch (e) {
      setError('Failed to delete student');
    } finally {
      setDeletingUserId(null);
    }
  };

  const students = useMemo(() => users.filter((u) => String(u.role || '').toLowerCase() === 'student'), [users]);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return students;
    }

    return students.filter((student) => {
      const name = toFullName(student).toLowerCase();
      const email = String(student.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [students, searchTerm]);

  return (
    <section className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-title-wrap">
          <p className="admin-kicker">Student Management</p>
          <h2>Students</h2>
          <p className="admin-subtitle">Review student accounts and promote learners into teacher roles.</p>
        </div>
      </header>

      <section className="admin-stats" aria-label="Student summary">
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon-blue"><GraduationIcon /></span>
          <div className="admin-stat-body">
            <span className="admin-stat-label">Total Students</span>
            <strong className="admin-stat-value">{students.length}</strong>
          </div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon admin-stat-icon-slate"><SearchIcon /></span>
          <div className="admin-stat-body">
            <span className="admin-stat-label">Matching Search</span>
            <strong className="admin-stat-value">{filteredStudents.length}</strong>
          </div>
        </article>
      </section>

      <div className="admin-content">
        <div className="admin-content-head">
          <h3>Student Accounts</h3>
          <span className="admin-management-badge">Promote to Teacher</span>
        </div>

        <div className="admin-search-bar">
          <span className="admin-search-icon"><SearchIcon /></span>
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search students"
          />
          {searchTerm && (
            <button type="button" className="admin-search-clear" onClick={() => setSearchTerm('')} aria-label="Clear search">
              <CloseIcon />
            </button>
          )}
        </div>

        {loading && <p className="admin-loading">Loading students...</p>}
        {notice && <div className="admin-notice">{notice}</div>}
        {error && <div className="admin-error">{error}</div>}

        <table className="admin-table" aria-label="Student accounts">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Joined</th>
              <th className="admin-actions-column">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => {
              const name = toFullName(student);
              return (
                <tr key={student.id}>
                  <td>
                    <div className="admin-person">
                      <span className="admin-avatar admin-avatar-blue">{getInitials(name)}</span>
                      <span className="admin-person-name">{name}</span>
                    </div>
                  </td>
                  <td>{student.email}</td>
                  <td>{formatDate(student.createdAt)}</td>
                  <td className="admin-actions-cell">
                    <button
                      type="button"
                      className="admin-promote-button"
                      onClick={() => promoteToTeacher(student.id)}
                      disabled={loading || !!promotingUserId || !!deletingUserId}
                    >
                      {promotingUserId === student.id ? 'Promoting...' : 'Promote to Teacher'}
                    </button>
                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={() => deleteAccount(student.id)}
                      disabled={loading || !!promotingUserId || !!deletingUserId}
                    >
                      {deletingUserId === student.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              );
            })}

            {!loading && filteredStudents.length === 0 && (
              <tr>
                <td colSpan="4" className="admin-empty">
                  {searchTerm ? 'No students match your search.' : 'No student accounts found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
