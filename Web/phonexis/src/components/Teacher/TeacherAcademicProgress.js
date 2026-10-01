import { useEffect, useMemo, useState } from 'react';
import { fetchBackendGameScores, fetchBackendProgress, fetchClassStudents, fetchStudentPretests } from '../../lib/supabaseClient';
import { MODULES, formatDuration, formatTimestamp, getDisplayName, hasMeaningfulProgress, safePercent } from './teacherUtils';
import { GAMES, GameRadarChart, PASSING_PERCENT, PassPieChart, PretestBarChart, attemptPercent } from './TeacherProgressCharts';
import './TeacherProgressCharts.css';

export default function TeacherAcademicProgress({ classes, loading }) {
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [subTab, setSubTab] = useState('students');
  const [selectedModule, setSelectedModule] = useState('alphabet');
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [progressByUserId, setProgressByUserId] = useState({});
  const [pretestsByUserId, setPretestsByUserId] = useState({});
  const [gameScoresByUserId, setGameScoresByUserId] = useState({});
  const [piePretestId, setPiePretestId] = useState(null);
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

      const studentEntries = await Promise.all(
        students.map(async (student) => {
          const [progressResult, pretestResult, gameResult] = await Promise.all([
            fetchBackendProgress(student.id),
            fetchStudentPretests(selectedClassId, student.id),
            fetchBackendGameScores(student.id),
          ]);
          const gameRows = Array.isArray(gameResult?.data) ? gameResult.data : [];
          return {
            id: student.id,
            progress: Array.isArray(progressResult?.data) ? progressResult.data : [],
            pretests: Array.isArray(pretestResult?.data) ? pretestResult.data : [],
            games: Object.fromEntries(gameRows.map((row) => [String(row.gameName || '').toLowerCase(), row])),
          };
        })
      );

      setProgressByUserId(Object.fromEntries(studentEntries.map((entry) => [entry.id, entry.progress])));
      setPretestsByUserId(Object.fromEntries(studentEntries.map((entry) => [entry.id, entry.pretests])));
      setGameScoresByUserId(Object.fromEntries(studentEntries.map((entry) => [entry.id, entry.games])));
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
  const selectedStudentPretests = useMemo(
    () => pretestsByUserId[selectedStudentId] || [],
    [pretestsByUserId, selectedStudentId]
  );
  const studentPretestsTaken = selectedStudentPretests.filter((pretest) => attemptPercent(pretest.latestAttempt) != null).length;
  const studentPretestsPassed = selectedStudentPretests.filter((pretest) => (attemptPercent(pretest.latestAttempt) ?? -1) >= PASSING_PERCENT).length;

  const classTopScores = useMemo(() => {
    const tops = {};
    GAMES.forEach((game) => {
      tops[game.key] = Math.max(0, ...roster.map((student) => gameScoresByUserId[student.id]?.[game.key]?.bestScore || 0));
    });
    return tops;
  }, [roster, gameScoresByUserId]);

  // Every student in the class gets the same pretest list, so take it from whoever has one.
  const classPretests = useMemo(() => {
    const withList = roster.map((student) => pretestsByUserId[student.id] || []).find((list) => list.length > 0);
    return withList || [];
  }, [roster, pretestsByUserId]);

  useEffect(() => {
    setPiePretestId((current) => (classPretests.some((pretest) => pretest.id === current) ? current : classPretests[0]?.id ?? null));
  }, [classPretests]);

  const pieCounts = useMemo(() => {
    const counts = { passed: 0, failed: 0, notTaken: 0 };
    roster.forEach((student) => {
      const pretest = (pretestsByUserId[student.id] || []).find((entry) => entry.id === piePretestId);
      const percent = attemptPercent(pretest?.latestAttempt);
      if (percent == null) {
        counts.notTaken += 1;
      } else if (percent >= PASSING_PERCENT) {
        counts.passed += 1;
      } else {
        counts.failed += 1;
      }
    });
    return counts;
  }, [roster, pretestsByUserId, piePretestId]);

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
                <span>Pretests Passed</span>
                <strong>{studentPretestsPassed} / {studentPretestsTaken} taken</strong>
              </article>
            </div>

            <div className="tpc-grid">
              <div className="teacher-chart-card tpc-card">
                <h4>📊 Pretest Scores</h4>
                <p className="tpc-sub">Latest attempt on each pretest · passing is {PASSING_PERCENT}%</p>
                {rosterLoading ? <p className="tpc-empty">Loading…</p> : <PretestBarChart key={selectedStudentId} pretests={selectedStudentPretests} />}
              </div>

              <div className="teacher-chart-card tpc-card">
                <h4>🎮 Game Scores</h4>
                <p className="tpc-sub">Best score as a share of the class&apos;s top score in each game</p>
                {rosterLoading ? <p className="tpc-empty">Loading…</p> : (
                  <GameRadarChart
                    key={selectedStudentId}
                    studentScores={gameScoresByUserId[selectedStudentId] || {}}
                    classTopScores={classTopScores}
                  />
                )}
              </div>
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

            <div className="teacher-chart-card tpc-card">
              <div className="tpc-card-head">
                <div>
                  <h4>🥧 Class Pretest Results</h4>
                  <p className="tpc-sub">How many students in this class passed ({PASSING_PERCENT}% or higher)</p>
                </div>
                {classPretests.length > 0 && (
                  <select
                    className="tpc-select"
                    value={piePretestId ?? ''}
                    onChange={(event) => setPiePretestId(Number(event.target.value))}
                    aria-label="Choose pretest"
                  >
                    {classPretests.map((pretest) => (
                      <option key={pretest.id} value={pretest.id}>{pretest.title}</option>
                    ))}
                  </select>
                )}
              </div>
              {rosterLoading ? <p className="tpc-empty">Loading…</p>
                : classPretests.length === 0 ? <p className="tpc-empty">No pretests have been created for this class yet.</p>
                  : <PassPieChart key={piePretestId} counts={pieCounts} />}
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
