import { useEffect, useMemo, useState } from 'react';
import { addClassStudents, createTeacherClass, deleteTeacherClass, fetchBackendProgress, fetchBackendUsers, fetchClassStudents, fetchLearningMaterials, removeClassStudent } from '../../lib/supabaseClient';
import { MODULES, formatDate, getDisplayName, safePercent } from './teacherUtils';
import { BookIcon, ChartIcon, CloseIcon, PlusIcon, SearchIcon, TrashIcon, UsersIcon } from './TeacherIcons';
import useConfirm from './useConfirm';

const computeAverageProgress = (progressRows) => {
  const rows = Array.isArray(progressRows) ? progressRows : [];
  const byModule = new Map(rows.map((entry) => [String(entry?.moduleName || '').toLowerCase(), entry]));
  const total = MODULES.reduce((sum, module) => sum + safePercent(byModule.get(module.key)?.completionPercentage || 0), 0);
  return Math.round(total / MODULES.length);
};

export default function TeacherDashboard({ backendUserId, classes, loading, error, onClassesChanged }) {
  const [confirmDialog, confirm] = useConfirm();
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState(null);
  const [studentProgress, setStudentProgress] = useState({});
  const [materialsCount, setMaterialsCount] = useState(0);

  const [allStudents, setAllStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pendingEmails, setPendingEmails] = useState([]);
  const [addingStudents, setAddingStudents] = useState(false);
  const [addFeedback, setAddFeedback] = useState(null);

  const selectedClass = useMemo(
    () => classes.find((entry) => entry.id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  useEffect(() => {
    fetchBackendUsers().then((result) => {
      if (!result.error && Array.isArray(result.data)) {
        setAllStudents(result.data.filter((entry) => String(entry?.role || '').toLowerCase() === 'student'));
      }
    });
  }, []);

  const loadRoster = async (classId) => {
    setRosterLoading(true);
    setRosterError(null);
    const result = await fetchClassStudents(classId);
    const students = result.error ? [] : (Array.isArray(result.data) ? result.data : []);
    if (result.error) {
      setRosterError(result.error.message || 'Failed to load class roster');
    } else {
      setRoster(students);
    }
    setRosterLoading(false);

    const progressEntries = await Promise.all(
      students.map(async (student) => {
        const progressResult = await fetchBackendProgress(student.id);
        return [student.id, computeAverageProgress(progressResult?.data)];
      })
    );
    setStudentProgress(Object.fromEntries(progressEntries));
  };

  const loadMaterialsCount = async (classId) => {
    const result = await fetchLearningMaterials(classId);
    setMaterialsCount(!result.error && Array.isArray(result.data) ? result.data.length : 0);
  };

  useEffect(() => {
    if (selectedClassId) {
      void loadRoster(selectedClassId);
      void loadMaterialsCount(selectedClassId);
      setSearchQuery('');
      setSearchResults([]);
      setPendingEmails([]);
      setAddFeedback(null);
    }
  }, [selectedClassId]);

  const averageClassProgress = useMemo(() => {
    const values = Object.values(studentProgress);
    if (!values.length) {
      return 0;
    }
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [studentProgress]);

  const handleOpenClass = (classId) => {
    setSelectedClassId(classId);
  };

  const handleBack = () => {
    setSelectedClassId(null);
  };

  const handleCreateClass = async () => {
    const name = newClassName.trim();
    if (!name) {
      setCreateError('Please enter a name for the section.');
      return;
    }

    if (!backendUserId) {
      setCreateError('Teacher account id is missing. Please log out and log in again.');
      return;
    }

    setCreating(true);
    setCreateError(null);
    const result = await createTeacherClass(backendUserId, name);
    setCreating(false);

    if (result.error) {
      setCreateError(result.error.message || 'Failed to create class');
      return;
    }

    setNewClassName('');
    setIsCreateOpen(false);
    await onClassesChanged();
    setSelectedClassId(result.data.id);
  };

  const handleDeleteClass = async (classId, event) => {
    event.stopPropagation();
    if (!backendUserId) {
      return;
    }
    const confirmed = await confirm('Students will be removed from its roster. This action can\'t be undone.', {
      title: 'Delete this class?',
      confirmLabel: 'Delete Class',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }

    const result = await deleteTeacherClass(classId, backendUserId);
    if (!result.error) {
      if (selectedClassId === classId) {
        setSelectedClassId(null);
      }
      await onClassesChanged();
    }
  };

  const enrolledEmails = useMemo(() => new Set(roster.map((student) => String(student.email || '').toLowerCase())), [roster]);

  const handleSearch = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      return;
    }

    const matches = allStudents.filter((student) => {
      const email = String(student.email || '').toLowerCase();
      return email.includes(query) && !enrolledEmails.has(email) && !pendingEmails.includes(email);
    });
    setSearchResults(matches.slice(0, 8));
  };

  const handleAddToPending = (email) => {
    setPendingEmails((current) => (current.includes(email) ? current : [...current, email]));
    setSearchResults((current) => current.filter((student) => String(student.email || '').toLowerCase() !== email));
  };

  const handleRemoveFromPending = (email) => {
    setPendingEmails((current) => current.filter((entry) => entry !== email));
  };

  const handleAddStudents = async () => {
    if (!selectedClassId || !backendUserId || pendingEmails.length === 0) {
      return;
    }

    setAddingStudents(true);
    setAddFeedback(null);
    const result = await addClassStudents(selectedClassId, backendUserId, pendingEmails);
    setAddingStudents(false);

    if (result.error) {
      setAddFeedback({ type: 'error', message: result.error.message || 'Failed to add students' });
      return;
    }

    const { added = [], alreadyEnrolled = [], notFound = [], notStudent = [] } = result.data || {};
    const messages = [];
    if (added.length) messages.push(`Added: ${added.join(', ')}`);
    if (alreadyEnrolled.length) messages.push(`Already in class: ${alreadyEnrolled.join(', ')}`);
    if (notStudent.length) messages.push(`Not a student account: ${notStudent.join(', ')}`);
    if (notFound.length) messages.push(`No account found: ${notFound.join(', ')}`);

    setAddFeedback({ type: notFound.length || notStudent.length ? 'warning' : 'success', message: messages.join(' • ') });
    setPendingEmails([]);
    await loadRoster(selectedClassId);
    await onClassesChanged();
  };

  const handleRemoveStudent = async (studentId) => {
    if (!selectedClassId || !backendUserId) {
      return;
    }
    const confirmed = await confirm('They will lose access to this class\'s materials and progress tracking.', {
      title: 'Remove this student?',
      confirmLabel: 'Remove Student',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }

    const result = await removeClassStudent(selectedClassId, backendUserId, studentId);
    if (!result.error) {
      await loadRoster(selectedClassId);
      await onClassesChanged();
    }
  };

  if (selectedClass) {
    return (
      <>
      {confirmDialog}
      <section className="teacher-board" aria-label="Class detail">
        <button type="button" className="teacher-back-link" onClick={handleBack}>&larr; Back to classes</button>

        <div className="teacher-board-head">
          <h3>{selectedClass.name}</h3>
          <p>Created {formatDate(selectedClass.createdAt)} • {roster.length} student{roster.length === 1 ? '' : 's'}</p>
        </div>

        {rosterError && <div className="teacher-error">{rosterError}</div>}

        <div className="teacher-class-stats">
          <div className="teacher-class-stat-card">
            <span className="teacher-class-stat-icon"><UsersIcon /></span>
            <span className="teacher-class-stat-copy">
              <span>Students</span>
              <strong>{roster.length}</strong>
            </span>
          </div>
          <div className="teacher-class-stat-card">
            <span className="teacher-class-stat-icon"><BookIcon /></span>
            <span className="teacher-class-stat-copy">
              <span>Materials</span>
              <strong>{materialsCount}</strong>
            </span>
          </div>
          <div className="teacher-class-stat-card">
            <span className="teacher-class-stat-icon"><ChartIcon /></span>
            <span className="teacher-class-stat-copy">
              <span>Avg. Progress</span>
              <strong>{averageClassProgress}%</strong>
            </span>
          </div>
        </div>

        <div className="teacher-class-detail-grid">
          <div className="teacher-roster-panel">
            <h4>Roster</h4>
            <div className="teacher-roster-list">
              {roster.map((student) => {
                const progress = studentProgress[student.id] ?? 0;
                return (
                  <article key={student.id} className="teacher-roster-item">
                    <div className="teacher-roster-item-main">
                      <strong>{getDisplayName(student)}</strong>
                      <span>{student.email}</span>
                    </div>
                    <div className="teacher-roster-progress">
                      <div className="teacher-roster-progress-track">
                        <div className="teacher-roster-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <span>{progress}%</span>
                    </div>
                    <button type="button" className="teacher-icon-button danger" onClick={() => handleRemoveStudent(student.id)} title="Remove student" aria-label="Remove student">
                      <TrashIcon />
                    </button>
                  </article>
                );
              })}
              {!rosterLoading && roster.length === 0 && <p className="teacher-empty">No students added yet. Search for students below.</p>}
            </div>
          </div>

          <div className="teacher-add-students-panel">
            <h4>Add students</h4>
            <div className="teacher-search-row">
              <input
                type="email"
                placeholder="Search by student email"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
              />
              <button type="button" className="teacher-icon-button" onClick={handleSearch} aria-label="Search">
                <SearchIcon /> Search
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="teacher-search-results">
                {searchResults.map((student) => (
                  <button key={student.id} type="button" className="teacher-search-result" onClick={() => handleAddToPending(String(student.email).toLowerCase())}>
                    <span>
                      <strong>{getDisplayName(student)}</strong>
                      <em>{student.email}</em>
                    </span>
                    <PlusIcon />
                  </button>
                ))}
              </div>
            )}

            {pendingEmails.length > 0 && (
              <div className="teacher-pending-chips">
                {pendingEmails.map((email) => (
                  <span key={email} className="teacher-chip">
                    {email}
                    <button type="button" onClick={() => handleRemoveFromPending(email)} aria-label={`Remove ${email}`}>
                      <CloseIcon />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {addFeedback && <div className={`teacher-inline-feedback ${addFeedback.type}`}>{addFeedback.message}</div>}

            <button
              type="button"
              className="teacher-primary-button teacher-create-activity"
              onClick={handleAddStudents}
              disabled={pendingEmails.length === 0 || addingStudents}
            >
              {addingStudents ? 'Adding...' : `Add ${pendingEmails.length || ''} Student${pendingEmails.length === 1 ? '' : 's'}`.replace('  ', ' ')}
            </button>
          </div>
        </div>
      </section>
      </>
    );
  }

  return (
    <section aria-label="Classes dashboard">
      {confirmDialog}
      <div className="teacher-board-head teacher-dashboard-head">
        <div>
          <h3>Your Classes</h3>
          <p>{loading ? 'Loading classes...' : `${classes.length} class${classes.length === 1 ? '' : 'es'}`}</p>
        </div>
        <button type="button" className="teacher-primary-button" onClick={() => setIsCreateOpen(true)}>
          <PlusIcon /> Create Class
        </button>
      </div>

      {error && <div className="teacher-error">{error}</div>}

      <div className="teacher-class-grid">
        {classes.map((classItem) => (
          <article key={classItem.id} className="teacher-class-card" onClick={() => handleOpenClass(classItem.id)}>
            <button type="button" className="teacher-icon-button danger teacher-class-delete" onClick={(event) => handleDeleteClass(classItem.id, event)} title="Delete class" aria-label="Delete class">
              <TrashIcon />
            </button>
            <div className="teacher-class-card-icon"><UsersIcon /></div>
            <h4>{classItem.name}</h4>
            <p>Created {formatDate(classItem.createdAt)}</p>
            <div className="teacher-class-card-progress">
              <span>Students</span>
              <strong>{classItem.studentCount}</strong>
            </div>
            <button
              type="button"
              className="teacher-class-card-button"
              onClick={(event) => {
                event.stopPropagation();
                handleOpenClass(classItem.id);
              }}
            >
              View Class
            </button>
          </article>
        ))}

        {!loading && classes.length === 0 && (
          <p className="teacher-empty">You haven&apos;t created any classes yet. Click &quot;Create Class&quot; to get started.</p>
        )}
      </div>

      {isCreateOpen && (
        <div className="teacher-modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="teacher-modal" onClick={(event) => event.stopPropagation()}>
            <div className="teacher-modal-head">
              <h3>Create Class</h3>
              <button type="button" className="teacher-icon-button" onClick={() => setIsCreateOpen(false)} aria-label="Close">
                <CloseIcon />
              </button>
            </div>

            <label className="teacher-activity-field">
              <span>Name of the section</span>
              <input
                type="text"
                value={newClassName}
                onChange={(event) => setNewClassName(event.target.value)}
                placeholder="e.g. Grade 2 - Sampaguita"
                autoFocus
              />
            </label>

            <label className="teacher-activity-field">
              <span>Date created</span>
              <input type="text" value={formatDate(new Date())} disabled />
            </label>

            {createError && <div className="teacher-error">{createError}</div>}

            <button type="button" className="teacher-primary-button teacher-create-activity" onClick={handleCreateClass} disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
