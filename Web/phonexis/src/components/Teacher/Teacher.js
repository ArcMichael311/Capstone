import React, { useEffect, useMemo, useState } from 'react';
import './Teacher.css';
import '../Dashboard/Dashboard.css';
import { createTeacherActivity, fetchBackendProgress, fetchBackendUsers, fetchTeacherActivities } from '../../lib/supabaseClient';

const MODULES = [
  { key: 'alphabet', title: 'Alphabet Recognition', subtitle: 'Letter mastery leaderboard', icon: '📘', accent: 'blue' },
  { key: 'vowels', title: 'Vowels', subtitle: 'Vowel completion ranking', icon: '🔉', accent: 'purple' },
  { key: 'consonants', title: 'Consonants', subtitle: 'Consonant completion ranking', icon: '🔊', accent: 'green' },
  { key: 'cvc', title: 'CVC Words', subtitle: 'Word-building leaderboard', icon: '💡', accent: 'pink' },
];

const safePercent = (value) => {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(number)));
};

const normalizeClassKey = (value) => String(value || '').trim().toLowerCase();

const getDisplayName = (user) => {
  const firstName = user?.firstName || user?.firstname || user?.user_metadata?.firstName || user?.user_metadata?.firstname || '';
  const lastName = user?.lastName || user?.lastname || user?.user_metadata?.lastName || user?.user_metadata?.lastname || '';
  return `${firstName} ${lastName}`.trim() || user?.email || 'Student';
};

const formatDuration = (durationMs) => {
  if (durationMs == null || Number.isNaN(durationMs) || durationMs < 0) {
    return 'N/A';
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};

const formatTimestamp = (value) => {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  return parsed.toLocaleString();
};

const hasMeaningfulProgress = (progress) => {
  if (!progress) {
    return false;
  }

  const updatedAt = progress.updatedAt ? new Date(progress.updatedAt) : null;
  const createdAt = progress.createdAt ? new Date(progress.createdAt) : null;
  const timestampChanged = updatedAt && createdAt && !Number.isNaN(updatedAt.getTime()) && !Number.isNaN(createdAt.getTime()) && updatedAt.getTime() > createdAt.getTime();
  const watchedVideos = Array.isArray(progress.videosWatched)
    ? progress.videosWatched.length > 0
    : String(progress.videosWatched || '').trim() !== '[]' && String(progress.videosWatched || '').trim() !== '';

  return Boolean(
    timestampChanged
    || safePercent(progress.completionPercentage) > 0
    || progress.lessonUnlocked
    || progress.pretestUnlocked
    || progress.pretestCompleted
    || progress.easyModeCompleted
    || progress.mediumModeCompleted
    || progress.hardModeCompleted
    || watchedVideos
  );
};

export default function Teacher({ user, backendUserId }) {
  const [activeTab, setActiveTab] = useState('modules');
  const [selectedModule, setSelectedModule] = useState('alphabet');
  const [activityModule, setActivityModule] = useState('vowels');
  const [activityTitle, setActivityTitle] = useState('Vowel team word sort');
  const [activityFocus, setActivityFocus] = useState('A, E, I, O, U');
  const [activityInstructions, setActivityInstructions] = useState('Ask students to sort picture cards by vowel sound and read each word aloud.');
  const [activities, setActivities] = useState({ vowels: [], consonants: [] });
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [users, setUsers] = useState([]);
  const [progressByUserId, setProgressByUserId] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const teacherName = getDisplayName(user);
  const teacherClassKey = normalizeClassKey(user?.classroom || user?.user_metadata?.classroom || user?.user_metadata?.className);

  useEffect(() => {
    if (!backendUserId) {
      return;
    }

    const loadActivities = async () => {
      const result = await fetchTeacherActivities(backendUserId);
      if (result.error) {
        setError(result.error.message || 'Failed to load teacher activities');
        return;
      }

      const nextActivities = { vowels: [], consonants: [] };
      (Array.isArray(result.data) ? result.data : []).forEach((activity) => {
        if (nextActivities[activity.moduleKey]) {
          nextActivities[activity.moduleKey].push(activity);
        }
      });
      setActivities(nextActivities);
    };

    void loadActivities();
  }, [backendUserId]);

  useEffect(() => {
    const loadClassData = async () => {
      setLoading(true);
      setError(null);
      try {
        const usersResult = await fetchBackendUsers();
        if (usersResult.error) {
          setError(usersResult.error.message || 'Failed to load class participants');
          return;
        }

        const allUsers = Array.isArray(usersResult.data) ? usersResult.data : [];
        setUsers(allUsers);

        const students = allUsers.filter((entry) => String(entry?.role || '').toLowerCase() === 'student');
        const progressEntries = await Promise.all(
          students.map(async (student) => {
            const result = await fetchBackendProgress(student.id);
            return [student.id, Array.isArray(result?.data) ? result.data : []];
          })
        );

        setProgressByUserId(Object.fromEntries(progressEntries));
      } catch (e) {
        setError('Failed to load class participants');
      } finally {
        setLoading(false);
      }
    };

    void loadClassData();
  }, []);

  const classStudents = useMemo(() => {
    const students = users.filter((entry) => String(entry?.role || '').toLowerCase() === 'student');

    if (!teacherClassKey) {
      return [];
    }

    return students.filter((student) => {
      const studentClassKey = normalizeClassKey(student?.classroom || student?.user_metadata?.classroom || student?.user_metadata?.className);
      return studentClassKey === teacherClassKey;
    });
  }, [users, teacherClassKey]);

  useEffect(() => {
    if (!classStudents.length) {
      setSelectedStudentId(null);
      return;
    }

    setSelectedStudentId((current) => {
      if (current && classStudents.some((entry) => entry.id === current)) {
        return current;
      }

      return classStudents[0].id;
    });
  }, [classStudents]);

  const leaderboard = useMemo(() => {
    const entries = classStudents.map((student) => {
      const progressRows = progressByUserId[student.id] || [];
      const moduleProgress = progressRows.find((progress) => String(progress?.moduleName || '').toLowerCase() === selectedModule) || null;

      const completion = safePercent(moduleProgress?.completionPercentage);
      const completed = completion >= 100;
      const createdAt = moduleProgress?.createdAt ? new Date(moduleProgress.createdAt) : null;
      const updatedAt = moduleProgress?.updatedAt ? new Date(moduleProgress.updatedAt) : null;
      const durationMs = completed && createdAt && updatedAt && !Number.isNaN(createdAt.getTime()) && !Number.isNaN(updatedAt.getTime())
        ? Math.max(0, updatedAt.getTime() - createdAt.getTime())
        : null;

      return {
        id: student.id,
        name: getDisplayName(student),
        completion,
        completed,
        durationMs,
        updatedAtRaw: moduleProgress?.updatedAt || null,
      };
    }).filter((entry) => {
      const progressRows = progressByUserId[entry.id] || [];
      const moduleProgress = progressRows.find((progress) => String(progress?.moduleName || '').toLowerCase() === selectedModule) || null;
      return hasMeaningfulProgress(moduleProgress);
    });

    return entries.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? -1 : 1;
      }

      if (a.completed && b.completed) {
        if (a.durationMs != null && b.durationMs != null && a.durationMs !== b.durationMs) {
          return a.durationMs - b.durationMs;
        }

        const timeA = a.updatedAtRaw ? new Date(a.updatedAtRaw).getTime() : Number.MAX_SAFE_INTEGER;
        const timeB = b.updatedAtRaw ? new Date(b.updatedAtRaw).getTime() : Number.MAX_SAFE_INTEGER;
        if (timeA !== timeB) {
          return timeA - timeB;
        }
      }

      if (a.completion !== b.completion) {
        return b.completion - a.completion;
      }

      return a.name.localeCompare(b.name);
    });
  }, [classStudents, progressByUserId, selectedModule]);

  const selectedModuleTitle = MODULES.find((module) => module.key === selectedModule)?.title || 'Module';

  const selectedStudent = useMemo(
    () => classStudents.find((entry) => entry.id === selectedStudentId) || null,
    [classStudents, selectedStudentId]
  );

  const selectedStudentProgress = useMemo(() => {
    const rows = progressByUserId[selectedStudentId] || [];
    const mapByModule = new Map(rows.map((entry) => [String(entry?.moduleName || '').toLowerCase(), entry]));

    return MODULES.map((module) => {
      const found = mapByModule.get(module.key);
      return {
        moduleName: module.title,
        completionPercentage: safePercent(found?.completionPercentage || 0),
        pretestCompleted: !!found?.pretestCompleted,
        updatedAt: found?.updatedAt || null,
      };
    });
  }, [progressByUserId, selectedStudentId]);

  const studentAverage = useMemo(() => {
    if (!selectedStudentProgress.length) {
      return 0;
    }

    const total = selectedStudentProgress.reduce((sum, entry) => sum + entry.completionPercentage, 0);
    return Math.round(total / selectedStudentProgress.length);
  }, [selectedStudentProgress]);

  const studentCompletedModules = selectedStudentProgress.filter((entry) => entry.completionPercentage >= 100).length;
  const studentCompletedPretests = selectedStudentProgress.filter((entry) => entry.pretestCompleted).length;

  const studentTrendPoints = useMemo(() => {
    if (!selectedStudentProgress.length) {
      return '0,90 100,90';
    }

    const step = selectedStudentProgress.length > 1 ? 100 / (selectedStudentProgress.length - 1) : 100;
    return selectedStudentProgress
      .map((entry, index) => {
        const x = Math.round(step * index);
        const y = 90 - Math.round((entry.completionPercentage / 100) * 80);
        return `${x},${y}`;
      })
      .join(' ');
  }, [selectedStudentProgress]);

  const handleActivityModuleChange = (nextModule) => {
    setActivityModule(nextModule);
    if (nextModule === 'vowels') {
      setActivityTitle('Vowel team word sort');
      setActivityFocus('A, E, I, O, U');
      setActivityInstructions('Ask students to sort picture cards by vowel sound and read each word aloud.');
      return;
    }

    setActivityTitle('Beginning consonant sorting');
    setActivityFocus('B, C, D, F');
    setActivityInstructions('Give students picture cards and ask them to group cards by beginning consonant sound.');
  };

  const handleCreateActivity = () => {
    const title = activityTitle.trim();
    const focus = activityFocus.trim();
    const instructions = activityInstructions.trim();
    if (!title || !focus || !instructions) {
      setError('Complete the activity title, focus, and instructions first.');
      return;
    }

    if (!backendUserId) {
      setError('Teacher backend account id is missing. Please log out and log in again.');
      return;
    }

    const saveActivity = async () => {
      const result = await createTeacherActivity(backendUserId, {
        moduleKey: activityModule,
        title,
        focus,
        instructions,
      });
      if (result.error) {
        setError(result.error.message || 'Failed to save teacher activity');
        return;
      }

      setActivities((current) => ({
        ...current,
        [activityModule]: [result.data, ...(current[activityModule] || [])],
      }));
      setError(null);
    };

    void saveActivity();
  };

  return (
    <section className="teacher-shell">
      <header className="teacher-topbar">
        <div>
          <p className="teacher-kicker">Teacher Workspace</p>
          <h2>{teacherName}&apos;s Class Leaderboards</h2>
          <p className="teacher-subtitle">Each module shows who finished first and fastest in your class.</p>
        </div>
      </header>

      {!teacherClassKey && (
        <div className="teacher-error">
          This teacher account has no class assigned yet. Add a class value (for example `classroom`) to this teacher and matching students.
        </div>
      )}

      {error && <div className="teacher-error">{error}</div>}

      <section className="teacher-tabs" aria-label="Teacher views">
        <button
          type="button"
          className={`teacher-tab ${activeTab === 'modules' ? 'active' : ''}`}
          onClick={() => setActiveTab('modules')}
        >
          Module
        </button>
        <button
          type="button"
          className={`teacher-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Data Analytics
        </button>
        <button
          type="button"
          className={`teacher-tab ${activeTab === 'activities' ? 'active' : ''}`}
          onClick={() => setActiveTab('activities')}
        >
          Teacher Activities
        </button>
      </section>

      {activeTab === 'modules' && (
        <>
          <section className="dashboard-cards teacher-modules" aria-label="Module selector">
            {MODULES.map((module) => {
              const isActive = module.key === selectedModule;
              return (
                <button
                  key={module.key}
                  type="button"
                  className={`dashboard-card dashboard-card-${module.accent}${isActive ? ' teacher-module-active' : ''}`}
                  onClick={() => setSelectedModule(module.key)}
                >
                  <div className="dashboard-card-icon" aria-hidden="true">
                    <span>{module.icon}</span>
                  </div>

                  <div className="dashboard-card-copy">
                    <h3>{module.title}</h3>
                    <p>{module.subtitle}</p>

                    <div className="dashboard-card-progress">
                      <span>Mode</span>
                      <strong>{isActive ? 'Selected' : 'Leaderboard'}</strong>
                    </div>

                    <div className="dashboard-card-button">
                      VIEW LEADERBOARD
                    </div>
                  </div>
                </button>
              );
            })}
          </section>

          <section className="teacher-board" aria-label="Module leaderboard">
            <div className="teacher-board-head">
              <h3>{selectedModuleTitle} Leaderboard</h3>
              <p>{loading ? 'Loading students...' : `${leaderboard.length} participants in class`}</p>
            </div>

            <div className="teacher-board-list">
              {leaderboard.map((entry, index) => (
                <article key={entry.id} className="teacher-board-item">
                  <div className="teacher-board-rank">{index + 1}</div>
                  <div className="teacher-board-main">
                    <strong>{entry.name}</strong>
                    <p>
                      {entry.completed
                        ? `${formatDuration(entry.durationMs)} (${formatTimestamp(entry.updatedAtRaw)})`
                        : `${entry.completion}% completed`}
                    </p>
                  </div>
                  <div className={`teacher-status ${entry.completed ? 'done' : 'ongoing'}`}>
                    {entry.completed ? 'Done' : 'In Progress'}
                  </div>
                </article>
              ))}

              {!loading && leaderboard.length === 0 && (
                <p className="teacher-empty">No students found in this teacher&apos;s class for leaderboard display.</p>
              )}
            </div>
          </section>
        </>
      )}

      {activeTab === 'activities' && (
        <section className="teacher-activities-layout" aria-label="Teacher activities">
          <div className="teacher-activity-editor">
            <div className="teacher-board-head">
              <h3>Create Activity</h3>
              <p>Prepare activities for students in your class.</p>
            </div>

            <div className="teacher-activity-module-picker" role="group" aria-label="Activity module">
              <button type="button" className={activityModule === 'vowels' ? 'active' : ''} onClick={() => handleActivityModuleChange('vowels')}>Vowels</button>
              <button type="button" className={activityModule === 'consonants' ? 'active' : ''} onClick={() => handleActivityModuleChange('consonants')}>Consonants</button>
            </div>

            <label className="teacher-activity-field">
              <span>Activity title</span>
              <input value={activityTitle} onChange={(event) => setActivityTitle(event.target.value)} />
            </label>
            <label className="teacher-activity-field">
              <span>Focus</span>
              <input value={activityFocus} onChange={(event) => setActivityFocus(event.target.value)} />
            </label>
            <label className="teacher-activity-field">
              <span>Student instructions</span>
              <textarea rows={5} value={activityInstructions} onChange={(event) => setActivityInstructions(event.target.value)} />
            </label>
            <button type="button" className="teacher-generate-code teacher-create-activity" onClick={handleCreateActivity}>
              + Add Activity
            </button>
          </div>

          <div className="teacher-activity-list-panel">
            <div className="teacher-board-head">
              <h3>{activityModule === 'vowels' ? 'Vowel' : 'Consonant'} Activities</h3>
              <p>Activities prepared by this teacher.</p>
            </div>
            <div className="teacher-created-activities">
              {(activities[activityModule] || []).map((activity) => (
                <article key={activity.id} className="teacher-created-activity">
                  <h4>{activity.title}</h4>
                  <strong>Focus: {activity.focus}</strong>
                  <p>{activity.instructions}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'analytics' && (
        <section className="teacher-analytics-layout" aria-label="Class data analytics">
          <aside className="teacher-analytics-sidebar">
            <div className="teacher-analytics-head">
              <h3>Participants</h3>
              <span>{classStudents.length}</span>
            </div>

            <div className="teacher-participant-list">
              {classStudents.map((participant) => {
                const active = participant.id === selectedStudentId;
                return (
                  <button
                    key={participant.id}
                    type="button"
                    className={`teacher-participant-item ${active ? 'active' : ''}`}
                    onClick={() => setSelectedStudentId(participant.id)}
                  >
                    <strong>{getDisplayName(participant)}</strong>
                    <span>{participant.email}</span>
                  </button>
                );
              })}

              {!loading && classStudents.length === 0 && (
                <p className="teacher-empty">No students found in this teacher&apos;s class.</p>
              )}
            </div>
          </aside>

          <div className="teacher-analytics-main">
            <div className="teacher-board-head">
              <h3>{selectedStudent ? `${getDisplayName(selectedStudent)} Progress Analytics` : 'Student Progress Analytics'}</h3>
              <p>{selectedStudent ? 'Selected participant metrics and progress graph' : 'Select a participant to view analytics'}</p>
            </div>

            <div className="teacher-stats-grid">
              <article className="teacher-stat-card">
                <span>Overall Progress</span>
                <strong>{studentAverage}%</strong>
              </article>
              <article className="teacher-stat-card">
                <span>Completed Modules</span>
                <strong>{studentCompletedModules} / 4</strong>
              </article>
              <article className="teacher-stat-card">
                <span>Completed Pretests</span>
                <strong>{studentCompletedPretests} / 4</strong>
              </article>
            </div>

            <div className="teacher-chart-card">
              <h4>Progress Trend</h4>
              <svg viewBox="0 0 100 100" className="teacher-sparkline" role="img" aria-label="Selected student progress trend">
                <polyline points={studentTrendPoints} fill="none" stroke="url(#studentProgressGradient)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
                <defs>
                  <linearGradient id="studentProgressGradient" x1="0" x2="100" y1="0" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4D96FF" />
                    <stop offset="50%" stopColor="#FF6B6B" />
                    <stop offset="100%" stopColor="#FFD700" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="teacher-bars-card">
              <h4>Module Completion</h4>
              <div className="teacher-bars">
                {selectedStudentProgress.map((entry) => (
                  <div key={entry.moduleName} className="teacher-bar-row">
                    <div className="teacher-bar-label-wrap">
                      <span className="teacher-bar-label">{entry.moduleName}</span>
                      <strong>{entry.completionPercentage}%</strong>
                    </div>
                    <div className="teacher-bar-track">
                      <div className="teacher-bar-fill" style={{ width: `${entry.completionPercentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
