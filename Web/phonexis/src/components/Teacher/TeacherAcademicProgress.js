import { useEffect, useMemo, useState } from 'react';
import { fetchBackendProgress, fetchClassStudents } from '../../lib/supabaseClient';
import { MODULES, formatDuration, formatTimestamp, getDisplayName, hasMeaningfulProgress, safePercent } from './teacherUtils';

export default function TeacherAcademicProgress({ classes, loading }) {
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [subTab, setSubTab] = useState('students');
  const [selectedModule, setSelectedModule] = useState('alphabet');
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [progressByUserId, setProgressByUserId] = useState({});
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (!selectedClassId) {
      return;
    }

    const loadClassProgress = async () => {
      setRosterLoading(true);
      setError(null);
      const rosterResult = await fetchClassStudents(selectedClassId);
      if (rosterResult.error) {
        setError(rosterResult.error.message || 'Failed to load class roster');
        setRosterLoading(false);
        return;
      }

      const students = Array.isArray(rosterResult.data) ? rosterResult.data : [];
      setRoster(students);

      const progressEntries = await Promise.all(
        students.map(async (student) => {
          const result = await fetchBackendProgress(student.id);
          return [student.id, Array.isArray(result?.data) ? result.data : []];
        })
      );

      setProgressByUserId(Object.fromEntries(progressEntries));
      setRosterLoading(false);
    };

    void loadClassProgress();
  }, [selectedClassId]);

  useEffect(() => {
    if (!roster.length) {
      setSelectedStudentId(null);
      return;
    }

    setSelectedStudentId((current) => (current && roster.some((entry) => entry.id === current) ? current : roster[0].id));
  }, [roster]);

  const leaderboard = useMemo(() => {
    const entries = roster.map((student) => {
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
        hasProgress: hasMeaningfulProgress(moduleProgress),
      };
    }).filter((entry) => entry.hasProgress);

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
  }, [roster, progressByUserId, selectedModule]);

  const selectedModuleTitle = MODULES.find((module) => module.key === selectedModule)?.title || 'Module';

  const selectedStudent = useMemo(
    () => roster.find((entry) => entry.id === selectedStudentId) || null,
    [roster, selectedStudentId]
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

  if (!loading && classes.length === 0) {
    return (
      <section className="teacher-board" aria-label="Academic progress">
        <p className="teacher-empty">Create a class first from the Dashboard, then add students to see their academic progress here.</p>
      </section>
    );
  }

  return (
    <section aria-label="Academic progress">
      <div className="teacher-class-picker" role="group" aria-label="Select class">
        {classes.map((classItem) => (
          <button
            key={classItem.id}
            type="button"
            className={selectedClassId === classItem.id ? 'active' : ''}
            onClick={() => setSelectedClassId(classItem.id)}
          >
            {classItem.name}
          </button>
        ))}
      </div>

      {error && <div className="teacher-error">{error}</div>}

      <section className="teacher-tabs" aria-label="Progress views">
        <button type="button" className={`teacher-tab ${subTab === 'students' ? 'active' : ''}`} onClick={() => setSubTab('students')}>
          Students
        </button>
        <button type="button" className={`teacher-tab ${subTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setSubTab('leaderboard')}>
          Module Leaderboard
        </button>
      </section>

      {subTab === 'leaderboard' && (
        <>
          <div className="teacher-module-tabs" role="group" aria-label="Select module">
            {MODULES.map((module) => (
              <button
                key={module.key}
                type="button"
                className={module.key === selectedModule ? 'active' : ''}
                onClick={() => setSelectedModule(module.key)}
              >
                {module.title}
              </button>
            ))}
          </div>

          <section className="teacher-board" aria-label="Module leaderboard">
            <div className="teacher-board-head">
              <h3>{selectedModuleTitle} Leaderboard</h3>
              <p>{rosterLoading ? 'Loading students...' : `${leaderboard.length} participants in class`}</p>
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

              {!rosterLoading && leaderboard.length === 0 && (
                <p className="teacher-empty">No students with progress yet for this module.</p>
              )}
            </div>
          </section>
        </>
      )}

      {subTab === 'students' && (
        <section className="teacher-analytics-layout" aria-label="Class data analytics">
          <aside className="teacher-analytics-sidebar">
            <div className="teacher-analytics-head">
              <h3>Students</h3>
              <span>{roster.length}</span>
            </div>

            <div className="teacher-participant-list">
              {roster.map((participant) => {
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

              {!rosterLoading && roster.length === 0 && (
                <p className="teacher-empty">No students in this class yet.</p>
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
                    <stop offset="0%" stopColor="#93c5fd" />
                    <stop offset="100%" stopColor="#1d4ed8" />
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
