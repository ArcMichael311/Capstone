import { useEffect, useMemo, useState } from 'react';
import { addClassStudents, createTeacherClass, deleteTeacherClass, fetchAvailableStudents, fetchBackendProgress, fetchClassStudents, fetchLearningMaterials, removeClassStudent } from '../../lib/supabaseClient';
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

  const [availableStudents, setAvailableStudents] = useState([]);
  const [availableStudentsLoading, setAvailableStudentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingEmails, setPendingEmails] = useState([]);
  const [addingStudents, setAddingStudents] = useState(false);
  const [addFeedback, setAddFeedback] = useState(null);

  const selectedClass = useMemo(
    () => classes.find((entry) => entry.id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const loadAvailableStudents = async () => {
    setAvailableStudentsLoading(true);
    const result = await fetchAvailableStudents();
    setAvailableStudents(!result.error && Array.isArray(result.data) ? result.data : []);
    setAvailableStudentsLoading(false);
  };

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
      void loadAvailableStudents();
      setSearchQuery('');
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

  // Students not yet enrolled in ANY class (from any teacher) and not already staged to add.
  const visibleAvailableStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return availableStudents
      .filter((student) => !pendingEmails.includes(String(student.email || '').toLowerCase()))
      .filter((student) => {
        if (!query) {
          return true;
        }
        const name = getDisplayName(student).toLowerCase();
        const email = String(student.email || '').toLowerCase();
        return name.includes(query) || email.includes(query);
      });
  }, [availableStudents, pendingEmails, searchQuery]);

  const handleAddToPending = (email) => {
    setPendingEmails((current) => (current.includes(email) ? current : [...current, email]));
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

    const { added = [], alreadyEnrolled = [], enrolledElsewhere = [], notFound = [], notStudent = [] } = result.data || {};
    const messages = [];
    if (added.length) messages.push(`Added: ${added.join(', ')}`);
    if (alreadyEnrolled.length) messages.push(`Already in this class: ${alreadyEnrolled.join(', ')}`);
    if (enrolledElsewhere.length) messages.push(`Already in another teacher's class: ${enrolledElsewhere.join(', ')}`);
    if (notStudent.length) messages.push(`Not a student account: ${notStudent.join(', ')}`);
    if (notFound.length) messages.push(`No account found: ${notFound.join(', ')}`);

    setAddFeedback({ type: notFound.length || notStudent.length || enrolledElsewhere.length ? 'warning' : 'success', message: messages.join(' • ') });
    setPendingEmails([]);
    await loadRoster(selectedClassId);
    await loadAvailableStudents();
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
      await loadAvailableStudents();
      await onClassesChanged();
    }
  };

  if (selectedClass) {
    return (
      <>
      {confirmDialog}
      <section className="teacher-board" aria-label="Class detail">
        <button type="button" className="teacher-back-link" onClick={handleBack}>&larr; All classes</button>

        <div className="teacher-class-hero">
          <div className="teacher-class-hero-mark"><UsersIcon /></div>
          <div className="teacher-class-hero-copy">
            <span className="teacher-class-eyebrow">Class workspace</span>
            <h3>{selectedClass.name}</h3>
            <p>Created {formatDate(selectedClass.createdAt)} <span aria-hidden="true">•</span> Manage your students, materials, and progress in one place.</p>
          </div>
          <div className="teacher-class-hero-meta">
            <span>Roster size</span>
            <strong>{roster.length}</strong>
            <small>active students</small>
          </div>
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
            <div className="teacher-panel-heading">
              <div>
                <span className="teacher-section-eyebrow">People</span>
                <h4>Student roster</h4>
              </div>
              <span className="teacher-panel-count">{roster.length}</span>
            </div>
            <p className="teacher-panel-description">Monitor each learner&apos;s progress and manage class access.</p>
            <div className="teacher-roster-list">
              {roster.map((student) => {
                const progress = studentProgress[student.id] ?? 0;
                const studentName = getDisplayName(student);
                const initials = studentName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
                return (
                  <article key={student.id} className="teacher-roster-item">
                    <div className="teacher-student-avatar" aria-hidden="true">{initials || '?'}</div>
                    <div className="teacher-roster-item-main">
                      <strong>{studentName}</strong>
                      <span>{student.email}</span>
                    </div>
                    <div className="teacher-roster-progress">
                      <div className="teacher-roster-progress-track">
                        <div className="teacher-roster-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <span>{progress}% complete</span>
                    </div>
                    <span className={`teacher-progress-status ${progress >= 80 ? 'complete' : progress > 0 ? 'active' : 'new'}`}>
                      {progress >= 80 ? 'On track' : progress > 0 ? 'In progress' : 'Not started'}
                    </span>
                    <button type="button" className="teacher-icon-button danger" onClick={() => handleRemoveStudent(student.id)} title="Remove student" aria-label="Remove student">
                      <TrashIcon />
                    </button>
                  </article>
                );
              })}
              {rosterLoading && <div className="teacher-roster-loading">Loading student roster...</div>}
              {!rosterLoading && roster.length === 0 && (
                <div className="teacher-roster-empty">
                  <span className="teacher-roster-empty-icon"><UsersIcon /></span>
                  <strong>Your roster is empty</strong>
                  <p>Add students from the panel to start tracking their learning progress.</p>
                </div>
              )}
            </div>
          </div>

          <div className="teacher-add-students-panel">
            <div className="teacher-panel-heading">
              <div>
                <span className="teacher-section-eyebrow">Enrollment</span>
                <h4>Add students</h4>
              </div>
              <span className="teacher-add-badge"><PlusIcon /></span>
            </div>
            <p className="teacher-panel-description">Invite unassigned student accounts to join this class.</p>
            <p className="teacher-panel-hint">Students already assigned to a class will not appear in the list.</p>
            <div className="teacher-search-row">
              <input
                type="text"
                placeholder="Search by name or email"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <span className="teacher-icon-button" aria-hidden="true">
                <SearchIcon />
              </span>
            </div>

            <div className="teacher-search-results">
              {availableStudentsLoading && <p className="teacher-empty">Loading available students...</p>}
              {!availableStudentsLoading && visibleAvailableStudents.map((student) => (
                <button key={student.id} type="button" className="teacher-search-result" onClick={() => handleAddToPending(String(student.email).toLowerCase())}>
                  <span>
                    <strong>{getDisplayName(student)}</strong>
                    <em>{student.email}</em>
                  </span>
                  <PlusIcon />
                </button>
              ))}
              {!availableStudentsLoading && visibleAvailableStudents.length === 0 && (
                <p className="teacher-empty">
                  {searchQuery.trim() ? 'No available students match your search.' : 'No unassigned students right now.'}
                </p>
              )}
            </div>

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
