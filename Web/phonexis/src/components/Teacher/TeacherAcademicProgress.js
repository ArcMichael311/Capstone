import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchBackendGameScores, fetchBackendProgress, fetchClassStudents, fetchStudentPretests } from '../../lib/supabaseClient';
import { MODULES, formatDuration, formatTimestamp, getDisplayName, getInitials, hasMeaningfulProgress, safePercent } from './teacherUtils';
import { GAMES, GameRadarChart, PASSING_PERCENT, PassPieChart, PretestBarChart, attemptPercent } from './TeacherProgressCharts';
import TeacherModal from './TeacherModal';
import TeacherHero from './TeacherHero';
import { ProgressRing, getClassColor } from './TeacherFx';
import './TeacherProgressCharts.css';

const getModuleRows = (progressRows = []) => {
  const byModule = new Map(progressRows.map((entry) => [String(entry?.moduleName || '').toLowerCase(), entry]));
  return MODULES.map((module) => {
    const found = byModule.get(module.key);
    return {
      key: module.key,
      title: module.title,
      icon: module.icon,
      completion: safePercent(found?.completionPercentage || 0),
      updatedAt: found?.updatedAt || null,
    };
  });
};

function StudentDetailModal({ student, summary, moduleRows, pretests, gameScores, classTopScores, onClose }) {
  const [tab, setTab] = useState('modules');
  const name = getDisplayName(student);

  return (
    <TeacherModal title={name} subtitle={student.email} size="lg" onClose={onClose}>
      <div className="tw-student-summary">
        <div className="tw-mini-stat tw-mini-stat-ring">
          <ProgressRing value={summary.overall} size={56} stroke={6} />
          <span>Overall progress</span>
        </div>
        <div className="tw-mini-stat">
          <span>Modules completed</span>
          <strong>{summary.modulesDone} / {MODULES.length}</strong>
        </div>
        <div className="tw-mini-stat">
          <span>Pretests passed</span>
          <strong>{summary.pretestsPassed} / {summary.pretestsTaken}</strong>
        </div>
        <div className="tw-mini-stat">
          <span>Games played</span>
          <strong>{summary.gamesPlayed} / {GAMES.length}</strong>
        </div>
      </div>

      <div className="tw-tabs" role="tablist" aria-label="Student reports">
        {[
          { key: 'modules', label: '📚 Module Completion' },
          { key: 'pretests', label: '📊 Pretest Scores' },
          { key: 'games', label: '🎮 Game Scores' },
        ].map((entry) => (
          <button
            key={entry.key}
            type="button"
            role="tab"
            aria-selected={tab === entry.key}
            className={tab === entry.key ? 'active' : ''}
            onClick={() => setTab(entry.key)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === 'modules' && (
        <div className="tw-module-rows" role="tabpanel">
          {moduleRows.map((row) => (
            <div key={row.key} className="tw-module-row">
              <span className="tw-module-icon" aria-hidden="true">{row.icon}</span>
              <div>
                <div className="tw-module-row-top">
                  <strong>{row.title}</strong>
                  <span>
                    {row.completion >= 100 ? '✓ Completed' : row.completion > 0 ? 'In progress' : 'Not started'}
                  </span>
                </div>
                <div className="tw-progress">
                  <div className="tw-progress-track"><div className="tw-progress-fill" style={{ width: `${row.completion}%` }} /></div>
                  <strong>{row.completion}%</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'pretests' && (
        <div role="tabpanel">
          <p className="tpc-sub">Latest attempt on each pretest · passing score is {PASSING_PERCENT}%</p>
          <PretestBarChart pretests={pretests} />
        </div>
      )}

      {tab === 'games' && (
        <div role="tabpanel">
          <p className="tpc-sub">Each point is this student&apos;s best score compared with the top score in the class.</p>
          <GameRadarChart studentScores={gameScores} classTopScores={classTopScores} />
        </div>
      )}
    </TeacherModal>
  );
}

function ClassPretestModal({ classLabel, classPretests, roster, pretestsByUserId, onClose }) {
  const [pretestId, setPretestId] = useState(classPretests[0]?.id ?? null);

  const results = useMemo(() => roster.map((student) => {
    const pretest = (pretestsByUserId[student.id] || []).find((entry) => entry.id === pretestId);
    const percent = attemptPercent(pretest?.latestAttempt);
    return {
      student,
      percent,
      attempt: pretest?.latestAttempt || null,
      status: percent == null ? 'notTaken' : percent >= PASSING_PERCENT ? 'passed' : 'failed',
    };
  }), [roster, pretestsByUserId, pretestId]);

  const counts = useMemo(() => results.reduce((acc, row) => {
    acc[row.status] += 1;
    return acc;
  }, { passed: 0, failed: 0, notTaken: 0 }), [results]);

  return (
    <TeacherModal title="Class Pretest Results" subtitle={`${classLabel} · passing score is ${PASSING_PERCENT}%`} size="lg" onClose={onClose}>
      {classPretests.length === 0 ? (
        <div className="tw-empty">
          <span className="tw-empty-icon" aria-hidden="true">📝</span>
          <strong>No pretests yet</strong>
          <p>Create a pretest for this class from the Pretest page first.</p>
        </div>
      ) : (
        <>
          <label className="tw-field" style={{ maxWidth: '24rem' }}>
            <span>Pretest</span>
            <select className="tw-select" value={pretestId ?? ''} onChange={(event) => setPretestId(Number(event.target.value))}>
              {classPretests.map((pretest) => (
                <option key={pretest.id} value={pretest.id}>{pretest.title}</option>
              ))}
            </select>
          </label>

          <PassPieChart key={pretestId} counts={counts} />

          <div className="tw-table-wrap" style={{ marginTop: '1.5rem' }}>
            <table className="tw-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th className="tw-num">Score</th>
                  <th className="tw-num">Result</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => {
                  const name = getDisplayName(row.student);
                  return (
                    <tr key={row.student.id}>
                      <td>
                        <div className="tw-person">
                          <span className="tw-avatar" aria-hidden="true">{getInitials(name)}</span>
                          <span><strong>{name}</strong></span>
                        </div>
                      </td>
                      <td className="tw-num">
                        {row.attempt ? `${row.attempt.score}/${row.attempt.totalQuestions} (${row.percent}%)` : '—'}
                      </td>
                      <td className="tw-num">
                        <span className={`tw-badge ${row.status === 'passed' ? 'info' : row.status === 'failed' ? 'warning' : ''}`}>
                          {row.status === 'passed' ? '✓ Passed' : row.status === 'failed' ? '✗ Below 75%' : 'Not taken'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </TeacherModal>
  );
}

export default function TeacherAcademicProgress({ classes, loading }) {
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [view, setView] = useState('students');
  const [selectedModule, setSelectedModule] = useState('alphabet');
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [progressByUserId, setProgressByUserId] = useState({});
  const [pretestsByUserId, setPretestsByUserId] = useState({});
  const [gameScoresByUserId, setGameScoresByUserId] = useState({});
  const [openStudentId, setOpenStudentId] = useState(null);
  const [isClassResultsOpen, setIsClassResultsOpen] = useState(false);
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

    setOpenStudentId(null);
    void loadClassProgress();
  }, [selectedClassId]);

  const studentRows = useMemo(() => roster.map((student) => {
    const moduleRows = getModuleRows(progressByUserId[student.id] || []);
    const pretests = pretestsByUserId[student.id] || [];
    const games = gameScoresByUserId[student.id] || {};
    const percents = pretests.map((pretest) => attemptPercent(pretest.latestAttempt)).filter((value) => value != null);
    return {
      student,
      name: getDisplayName(student),
      moduleRows,
      summary: {
        overall: Math.round(moduleRows.reduce((sum, row) => sum + row.completion, 0) / MODULES.length),
        modulesDone: moduleRows.filter((row) => row.completion >= 100).length,
        pretestsTaken: percents.length,
        pretestsPassed: percents.filter((value) => value >= PASSING_PERCENT).length,
        gamesPlayed: GAMES.filter((game) => games[game.key]).length,
        totalPlays: Object.values(games).reduce((sum, row) => sum + (Number(row?.timesPlayed) || 0), 0),
      },
    };
  }), [roster, progressByUserId, pretestsByUserId, gameScoresByUserId]);

  const classStats = useMemo(() => {
    const count = studentRows.length;
    const taken = studentRows.reduce((sum, row) => sum + row.summary.pretestsTaken, 0);
    const passed = studentRows.reduce((sum, row) => sum + row.summary.pretestsPassed, 0);
    return {
      averageProgress: count ? Math.round(studentRows.reduce((sum, row) => sum + row.summary.overall, 0) / count) : 0,
      passRate: taken ? Math.round((passed / taken) * 100) : null,
      totalPlays: studentRows.reduce((sum, row) => sum + row.summary.totalPlays, 0),
    };
  }, [studentRows]);

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

  const closeStudent = useCallback(() => setOpenStudentId(null), []);
  const closeClassResults = useCallback(() => setIsClassResultsOpen(false), []);

  const openRow = studentRows.find((row) => row.student.id === openStudentId) || null;
  const selectedClassName = classes.find((classItem) => classItem.id === selectedClassId)?.name || 'Class';

  if (!loading && classes.length === 0) {
    return (
      <>
        <TeacherHero eyebrow="📈 Reports" title="Academic Progress" subtitle="See how each student is doing." />
        <section className="tw-card" aria-label="Academic progress">
          <div className="tw-empty">
            <span className="tw-empty-icon" aria-hidden="true">📈</span>
            <strong>No classes yet</strong>
            <p>Create a class on My Classes and add students to see their academic progress here.</p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <TeacherHero
        eyebrow="📈 Reports"
        title="Academic Progress"
        subtitle="Click a student to see their modules, pretest scores and games."
        actions={(
          <button type="button" className="tw-btn tw-btn-primary" onClick={() => setIsClassResultsOpen(true)} disabled={rosterLoading}>
            🥧 Class Pretest Results
          </button>
        )}
        stats={[
          { key: 'students', icon: '🎒', label: 'Students', value: roster.length, loading: rosterLoading },
          { key: 'avg', label: 'Average progress', value: classStats.averageProgress, ring: true },
          { key: 'pass', icon: '📝', label: 'Pretest pass rate', value: classStats.passRate == null ? '—' : classStats.passRate, suffix: '%', loading: rosterLoading },
          { key: 'games', icon: '🎮', label: 'Games finished', value: classStats.totalPlays, loading: rosterLoading },
        ]}
      >
        <div>
          <span className="tw-toolbar-label">Class </span>
          <div className="tw-segment" role="group" aria-label="Select class">
            {classes.map((classItem) => (
              <button
                key={classItem.id}
                type="button"
                className={selectedClassId === classItem.id ? 'active' : ''}
                aria-pressed={selectedClassId === classItem.id}
                onClick={() => setSelectedClassId(classItem.id)}
              >
                {classItem.name}
              </button>
            ))}
          </div>
        </div>
      </TeacherHero>

      {error && <div className="tw-alert error">{error}</div>}

      <section className={`tw-card tw-c-${getClassColor(Math.max(0, classes.findIndex((classItem) => classItem.id === selectedClassId)))}`} aria-label="Class report">
        <div className="tw-tabs" role="tablist" aria-label="Report views">
          <button type="button" role="tab" aria-selected={view === 'students'} className={view === 'students' ? 'active' : ''} onClick={() => setView('students')}>
            Students
          </button>
          <button type="button" role="tab" aria-selected={view === 'leaderboard'} className={view === 'leaderboard' ? 'active' : ''} onClick={() => setView('leaderboard')}>
            Module Leaderboard
          </button>
        </div>

        {view === 'students' && (
          <>
            {rosterLoading && <p className="tw-muted">Loading students…</p>}
            {!rosterLoading && studentRows.length === 0 && (
              <div className="tw-empty">
                <span className="tw-empty-icon" aria-hidden="true">👥</span>
                <strong>No students in this class</strong>
                <p>Add students from My Classes to see their progress.</p>
              </div>
            )}
            {!rosterLoading && studentRows.length > 0 && (
              <div className="tw-table-wrap">
                <table className="tw-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Overall progress</th>
                      <th className="tw-num tw-hide-sm">Modules</th>
                      <th className="tw-num tw-hide-sm">Pretests passed</th>
                      <th className="tw-num tw-hide-sm">Games played</th>
                      <th className="tw-num"><span className="sr-only">Open</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentRows.map((row, index) => (
                      <tr
                        key={row.student.id}
                        className="tw-clickable"
                        style={{ animationDelay: `${index * 40}ms` }}
                        onClick={() => setOpenStudentId(row.student.id)}
                      >
                        <td>
                          <div className="tw-person">
                            <span className="tw-avatar" aria-hidden="true">{getInitials(row.name)}</span>
                            <span>
                              <strong>{row.name}</strong>
                              <span>{row.student.email}</span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="tw-progress">
                            <div className="tw-progress-track"><div className="tw-progress-fill" style={{ width: `${row.summary.overall}%` }} /></div>
                            <strong>{row.summary.overall}%</strong>
                          </div>
                        </td>
                        <td className="tw-num tw-hide-sm">{row.summary.modulesDone} / {MODULES.length}</td>
                        <td className="tw-num tw-hide-sm">
                          {row.summary.pretestsTaken ? `${row.summary.pretestsPassed} / ${row.summary.pretestsTaken}` : <span className="tw-muted">None taken</span>}
                        </td>
                        <td className="tw-num tw-hide-sm">{row.summary.gamesPlayed} / {GAMES.length}</td>
                        <td className="tw-num">
                          <button
                            type="button"
                            className="tw-btn tw-btn-ghost tw-btn-sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenStudentId(row.student.id);
                            }}
                          >
                            View report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {view === 'leaderboard' && (
          <>
            <div className="tw-segment" role="group" aria-label="Select module" style={{ marginBottom: '1rem' }}>
              {MODULES.map((module) => (
                <button
                  key={module.key}
                  type="button"
                  className={module.key === selectedModule ? 'active' : ''}
                  aria-pressed={module.key === selectedModule}
                  onClick={() => setSelectedModule(module.key)}
                >
                  {module.icon} {module.title}
                </button>
              ))}
            </div>

            {!rosterLoading && leaderboard.length === 0 ? (
              <div className="tw-empty">
                <span className="tw-empty-icon" aria-hidden="true">🏁</span>
                <strong>No progress yet</strong>
                <p>Students appear here once they start this module.</p>
              </div>
            ) : (
              <div className="tw-table-wrap">
                <table className="tw-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Completion</th>
                      <th className="tw-hide-sm">Finished in</th>
                      <th className="tw-num">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <tr key={entry.id} style={{ animationDelay: `${index * 40}ms` }}>
                        <td><strong>{index + 1}</strong></td>
                        <td>
                          <div className="tw-person">
                            <span className="tw-avatar" aria-hidden="true">{getInitials(entry.name)}</span>
                            <span><strong>{entry.name}</strong></span>
                          </div>
                        </td>
                        <td>
                          <div className="tw-progress">
                            <div className="tw-progress-track"><div className="tw-progress-fill" style={{ width: `${entry.completion}%` }} /></div>
                            <strong>{entry.completion}%</strong>
                          </div>
                        </td>
                        <td className="tw-hide-sm">
                          {entry.completed ? `${formatDuration(entry.durationMs)} · ${formatTimestamp(entry.updatedAtRaw)}` : '—'}
                        </td>
                        <td className="tw-num">
                          <span className={`tw-badge ${entry.completed ? 'success' : 'info'}`}>{entry.completed ? 'Done' : 'In progress'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {openRow && (
        <StudentDetailModal
          student={openRow.student}
          summary={openRow.summary}
          moduleRows={openRow.moduleRows}
          pretests={pretestsByUserId[openRow.student.id] || []}
          gameScores={gameScoresByUserId[openRow.student.id] || {}}
          classTopScores={classTopScores}
          onClose={closeStudent}
        />
      )}

      {isClassResultsOpen && (
        <ClassPretestModal
          classLabel={selectedClassName}
          classPretests={classPretests}
          roster={roster}
          pretestsByUserId={pretestsByUserId}
          onClose={closeClassResults}
        />
      )}
    </>
  );
}
