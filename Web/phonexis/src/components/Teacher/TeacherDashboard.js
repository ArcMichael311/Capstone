import { useCallback, useEffect, useMemo, useState } from 'react';
import { addClassStudents, createTeacherClass, deleteTeacherClass, fetchAvailableStudents, fetchBackendProgress, fetchClassStudents, fetchLearningMaterials, removeClassStudent } from '../../lib/supabaseClient';
import { MODULES, formatDate, getDisplayName, getInitials, safePercent } from './teacherUtils';
import { CloseIcon, PlusIcon, SearchIcon, TrashIcon } from './TeacherIcons';
import useConfirm from './useConfirm';
import TeacherModal from './TeacherModal';
import TeacherHero from './TeacherHero';
import { ProgressRing, celebrate, formatToday, getClassColor, getDailyTip, getGreeting } from './TeacherFx';

const computeAverageProgress = (progressRows) => {
  const rows = Array.isArray(progressRows) ? progressRows : [];
  const byModule = new Map(rows.map((entry) => [String(entry?.moduleName || '').toLowerCase(), entry]));
  const total = MODULES.reduce((sum, module) => sum + safePercent(byModule.get(module.key)?.completionPercentage || 0), 0);
  return Math.round(total / MODULES.length);
};

export default function TeacherDashboard({ teacherName = 'Teacher', backendUserId, classes, loading, error, onClassesChanged }) {
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
  // Per-class average progress + first few students, for the class cards.
  const [classOverview, setClassOverview] = useState({});

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

  useEffect(() => {
    let cancelled = false;
    const loadOverview = async () => {
      const entries = await Promise.all(classes.map(async (classItem) => {
        const rosterResult = await fetchClassStudents(classItem.id);
        const students = !rosterResult.error && Array.isArray(rosterResult.data) ? rosterResult.data : [];
        const averages = await Promise.all(students.map(async (student) => {
          const progressResult = await fetchBackendProgress(student.id);
          return computeAverageProgress(progressResult?.data);
        }));
        const average = averages.length ? Math.round(averages.reduce((sum, value) => sum + value, 0) / averages.length) : 0;
        return [classItem.id, { students, average }];
      }));
      if (!cancelled) {
        setClassOverview(Object.fromEntries(entries));
      }
    };
    if (classes.length) {
      void loadOverview();
    }
    return () => {
      cancelled = true;
    };
  }, [classes]);

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

  const closeCreate = useCallback(() => {
    setIsCreateOpen(false);
    setCreateError(null);
  }, []);

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
    celebrate();
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
    if (added.length) {
      celebrate();
    }
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

  const totalStudents = classes.reduce((sum, classItem) => sum + (Number(classItem.studentCount) || 0), 0);

  const createModal = isCreateOpen ? (
    <TeacherModal
      title="Create a class"
      subtitle="Give the section a name your students will recognize."
      size="sm"
      onClose={closeCreate}
      footer={(
        <>
          <button type="button" className="tw-btn tw-btn-ghost" onClick={closeCreate}>Cancel</button>
          <button type="submit" form="tw-create-class" className="tw-btn tw-btn-primary" disabled={creating}>
            {creating ? 'Creating…' : 'Create class'}
          </button>
        </>
      )}
    >
      <form
        id="tw-create-class"
        onSubmit={(event) => {
          event.preventDefault();
          void handleCreateClass();
        }}
      >
        <label className="tw-field">
          <span>Section name</span>
          <input
            className="tw-input"
            type="text"
            value={newClassName}
            onChange={(event) => setNewClassName(event.target.value)}
            placeholder="e.g. Grade 2 - Sampaguita"
            autoFocus
          />
        </label>
        <label className="tw-field">
          <span>Date created</span>
          <input className="tw-input" type="text" value={formatDate(new Date())} disabled />
        </label>
        {createError && <div className="tw-alert error">{createError}</div>}
      </form>
    </TeacherModal>
  ) : null;

  if (selectedClass) {
    return (
      <>
        {confirmDialog}
        <TeacherHero
          eyebrow={(
            <span className="tw-hero-crumb">
              <button type="button" onClick={handleBack}>← My Classes</button>
              <span aria-hidden="true">/</span>
              <span>Class workspace</span>
            </span>
          )}
          title={selectedClass.name}
          subtitle={`Created ${formatDate(selectedClass.createdAt)} · manage students and track how they are doing.`}
          stats={[
            { key: 'students', icon: '🎒', label: 'Students', value: roster.length, loading: rosterLoading },
            { key: 'materials', icon: '📚', label: 'Materials shared', value: materialsCount },
            { key: 'avg', label: 'Average progress', value: averageClassProgress, ring: true },
          ]}
        />

        {rosterError && <div className="tw-alert error">{rosterError}</div>}

        <div className={`tw-grid-2 tw-c-${getClassColor(Math.max(0, classes.findIndex((entry) => entry.id === selectedClass.id)))}`}>
          <section className="tw-card" aria-label="Student roster">
            <div className="tw-card-head">
              <div>
                <h2>Students</h2>
                <p>Everyone enrolled in {selectedClass.name}.</p>
              </div>
              <span className="tw-badge info">{roster.length} enrolled</span>
            </div>

            {rosterLoading && <p className="tw-muted">Loading students…</p>}

            {!rosterLoading && roster.length === 0 && (
              <div className="tw-empty">
                <span className="tw-empty-icon" aria-hidden="true">👥</span>
                <strong>No students yet</strong>
                <p>Use the “Add students” panel to enroll learners in this class.</p>
              </div>
            )}

            {roster.length > 0 && (
              <div className="tw-table-wrap">
                <table className="tw-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Progress</th>
                      <th className="tw-hide-sm">Status</th>
                      <th className="tw-num"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((student, index) => {
                      const progress = studentProgress[student.id] ?? 0;
                      const studentName = getDisplayName(student);
                      return (
                        <tr key={student.id} style={{ animationDelay: `${index * 40}ms` }}>
                          <td>
                            <div className="tw-person">
                              <span className="tw-avatar" aria-hidden="true">{getInitials(studentName)}</span>
                              <span>
                                <strong>{studentName}</strong>
                                <span>{student.email}</span>
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="tw-progress">
                              <div className="tw-progress-track"><div className="tw-progress-fill" style={{ width: `${progress}%` }} /></div>
                              <strong>{progress}%</strong>
                            </div>
                          </td>
                          <td className="tw-hide-sm">
                            <span className={`tw-badge ${progress >= 80 ? 'success' : progress > 0 ? 'info' : ''}`}>
                              {progress >= 80 ? 'On track' : progress > 0 ? 'In progress' : 'Not started'}
                            </span>
                          </td>
                          <td className="tw-num">
                            <button type="button" className="tw-icon-btn danger" onClick={() => handleRemoveStudent(student.id)} title="Remove from class" aria-label={`Remove ${studentName} from class`}>
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="tw-card" aria-label="Add students">
            <div className="tw-card-head">
              <div>
                <h2>Add students</h2>
                <p>Pick students who are not in a class yet.</p>
              </div>
            </div>

            <div className="tw-search">
              <SearchIcon />
              <input
                className="tw-input"
                type="text"
                placeholder="Search by name or email"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Search students"
              />
            </div>

            <div className="tw-list" style={{ marginTop: '0.85rem' }}>
              {availableStudentsLoading && <p className="tw-muted">Loading students…</p>}
              {!availableStudentsLoading && visibleAvailableStudents.map((student) => {
                const name = getDisplayName(student);
                return (
                  <button key={student.id} type="button" className="tw-list-item" onClick={() => handleAddToPending(String(student.email).toLowerCase())}>
                    <span className="tw-person">
                      <span className="tw-avatar" aria-hidden="true">{getInitials(name)}</span>
                      <span>
                        <strong>{name}</strong>
                        <span>{student.email}</span>
                      </span>
                    </span>
                    <PlusIcon />
                  </button>
                );
              })}
              {!availableStudentsLoading && visibleAvailableStudents.length === 0 && (
                <p className="tw-muted">
                  {searchQuery.trim() ? 'No available students match your search.' : 'No unassigned students right now.'}
                </p>
              )}
            </div>

            {pendingEmails.length > 0 && (
              <div className="tw-chips" aria-label="Students to add">
                {pendingEmails.map((email) => (
                  <span key={email} className="tw-chip">
                    {email}
                    <button type="button" onClick={() => handleRemoveFromPending(email)} aria-label={`Remove ${email}`}>
                      <CloseIcon />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {addFeedback && <div className={`tw-alert ${addFeedback.type}`} style={{ marginTop: '1rem' }}>{addFeedback.message}</div>}

            <button
              type="button"
              className="tw-btn tw-btn-primary tw-btn-block"
              style={{ marginTop: pendingEmails.length ? 0 : '1rem' }}
              onClick={handleAddStudents}
              disabled={pendingEmails.length === 0 || addingStudents}
            >
              <PlusIcon />
              {addingStudents
                ? 'Adding…'
                : pendingEmails.length
                  ? `Add ${pendingEmails.length} student${pendingEmails.length === 1 ? '' : 's'}`
                  : 'Select students to add'}
            </button>
          </section>
        </div>
      </>
    );
  }

  const overviewValues = Object.values(classOverview);
  const overallAverage = overviewValues.length
    ? Math.round(overviewValues.reduce((sum, entry) => sum + entry.average * entry.students.length, 0)
      / Math.max(1, overviewValues.reduce((sum, entry) => sum + entry.students.length, 0)))
    : 0;
  const firstName = String(teacherName).split(' ')[0] || teacherName;

  return (
    <>
      {confirmDialog}
      {createModal}

      <TeacherHero
        eyebrow={`${getGreeting()}, ${firstName}! 👋 · ${formatToday()}`}
        title="My Classes"
        subtitle="Open a class to manage its students, or create a new one."
        actions={(
          <button type="button" className="tw-btn tw-btn-primary" onClick={() => setIsCreateOpen(true)}>
            <PlusIcon /> Create class
          </button>
        )}
        stats={[
          { key: 'classes', icon: '🏫', label: 'Classes', value: classes.length, loading },
          { key: 'students', icon: '🎒', label: 'Students enrolled', value: totalStudents, loading },
          { key: 'avg', label: 'Average progress (all classes)', value: overallAverage, ring: true },
        ]}
        tip={getDailyTip()}
      />

      {error && <div className="tw-alert error">{error}</div>}

      <section className="tw-card" aria-label="Your classes">
        <div className="tw-card-head">
          <div>
            <h2>Your classes</h2>
            <p>{loading ? 'Loading classes…' : `${classes.length} class${classes.length === 1 ? '' : 'es'} · click a card to open it`}</p>
          </div>
        </div>

        <div className="tw-class-grid">
          {classes.map((classItem, index) => {
            const overview = classOverview[classItem.id];
            const students = overview?.students || [];
            const shown = students.slice(0, 4);
            const extra = Math.max(0, (Number(classItem.studentCount) || students.length) - shown.length);
            return (
              <article
                key={classItem.id}
                className={`tw-card tw-class-card tw-c-${getClassColor(index)}`}
                style={{ animationDelay: `${index * 60}ms` }}
                onClick={() => handleOpenClass(classItem.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && event.target === event.currentTarget) handleOpenClass(classItem.id);
                }}
                tabIndex={0}
                role="button"
                aria-label={`Open ${classItem.name}`}
              >
                <div className="tw-class-card-top">
                  <span className="tw-class-mark" aria-hidden="true">{getInitials(classItem.name)}</span>
                  <button
                    type="button"
                    className="tw-icon-btn danger"
                    onClick={(event) => handleDeleteClass(classItem.id, event)}
                    title="Delete class"
                    aria-label={`Delete ${classItem.name}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
                <div className="tw-class-card-body">
                  <div>
                    <h3>{classItem.name}</h3>
                    <p>Created {formatDate(classItem.createdAt)}</p>
                    <small>Average progress</small>
                  </div>
                  <ProgressRing value={overview ? overview.average : 0} size={68} stroke={7} />
                </div>
                <div className="tw-class-card-foot">
                  <span className="tw-avatar-stack" aria-label={`${classItem.studentCount ?? 0} students`}>
                    {shown.map((student) => (
                      <span key={student.id} className="tw-avatar" title={getDisplayName(student)}>{getInitials(getDisplayName(student))}</span>
                    ))}
                    {extra > 0 && <span className="tw-avatar tw-avatar-more">+{extra}</span>}
                    {shown.length === 0 && <span className="tw-muted" style={{ fontSize: '0.9rem' }}>No students yet</span>}
                  </span>
                  <b>Open →</b>
                </div>
              </article>
            );
          })}

          {!loading && (
            <button type="button" className="tw-class-add" onClick={() => setIsCreateOpen(true)}>
              <span aria-hidden="true"><PlusIcon /></span>
              {classes.length === 0 ? 'Create your first class' : 'New class'}
            </button>
          )}
        </div>
      </section>
    </>
  );
}
