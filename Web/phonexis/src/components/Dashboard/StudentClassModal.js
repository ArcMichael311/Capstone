import { useEffect, useRef, useState } from 'react';
import { fetchPretestForStudent, fetchStudentPretests, submitPretestAttempt } from '../../lib/supabaseClient';

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) {
    return '';
  }
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const shuffle = (values) => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export default function StudentClassModal({ studentClassInfo, studentMaterials = [], studentId, activeSection = 'materials', onNavigate }) {
  const [tab, setTab] = useState(activeSection === 'pretests' ? 'pretests' : 'materials');

  const [pretests, setPretests] = useState([]);
  const [pretestsLoading, setPretestsLoading] = useState(false);
  const [pretestsError, setPretestsError] = useState(null);

  const [mode, setMode] = useState('browse');
  const [takeData, setTakeData] = useState(null);
  const [takeLoading, setTakeLoading] = useState(false);
  const [takeError, setTakeError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [matching, setMatching] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const audioRef = useRef(null);

  useEffect(() => {
    setTab(activeSection === 'pretests' ? 'pretests' : 'materials');
  }, [activeSection]);

  const loadPretests = async () => {
    if (!studentClassInfo?.classId || !studentId) {
      return;
    }
    setPretestsLoading(true);
    setPretestsError(null);
    const result = await fetchStudentPretests(studentClassInfo.classId, studentId);
    setPretestsLoading(false);
    if (result.error) {
      setPretestsError(result.error.message || 'Failed to load pretests');
    } else {
      setPretests(Array.isArray(result.data) ? result.data : []);
    }
  };

  useEffect(() => {
    if (tab === 'pretests') {
      void loadPretests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => () => {
    audioRef.current?.pause();
  }, []);

  const playAudio = (url) => {
    if (!url) {
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  const currentQuestion = takeData?.questions?.[currentIndex] || null;

  const handleStartPretest = async (pretestId) => {
    setTakeError(null);
    setTakeLoading(true);
    const result = await fetchPretestForStudent(pretestId, studentId);
    setTakeLoading(false);

    if (result.error || !result.data) {
      setTakeError(result.error?.message || 'Failed to load pretest');
      return;
    }

    const data = result.data;
    const initialMatching = {};
    data.questions.forEach((question) => {
      if (question.questionType === 'MATCHING') {
        initialMatching[question.id] = {
          selected: null,
          pairs: {},
          rightPool: shuffle(question.options.map((option) => option.matchValue)),
        };
      }
    });

    setTakeData(data);
    setMatching(initialMatching);
    setAnswers({});
    setCurrentIndex(0);
    setSubmitResult(null);
    setMode('taking');
  };

  const handleOptionSelect = (question, option) => {
    playAudio(option.audioUrl);
    setAnswers((prev) => ({ ...prev, [question.id]: String(option.id) }));
  };

  const handleMatchLeftTap = (question, option) => {
    playAudio(option.audioUrl);
    setMatching((prev) => {
      const state = prev[question.id] || { selected: null, pairs: {}, rightPool: [] };
      if (state.pairs[option.id] != null) {
        const restPairs = { ...state.pairs };
        const releasedValue = restPairs[option.id];
        delete restPairs[option.id];
        return {
          ...prev,
          [question.id]: { ...state, selected: null, pairs: restPairs, rightPool: [...state.rightPool, releasedValue] },
        };
      }
      return { ...prev, [question.id]: { ...state, selected: option.id } };
    });
  };

  const handleMatchRightTap = (question, value) => {
    setMatching((prev) => {
      const state = prev[question.id];
      if (!state || state.selected == null) {
        return prev;
      }
      return {
        ...prev,
        [question.id]: {
          ...state,
          pairs: { ...state.pairs, [state.selected]: value },
          rightPool: state.rightPool.filter((item) => item !== value),
          selected: null,
        },
      };
    });
  };

  const handleTextAnswer = (question, value) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const isCurrentAnswered = () => {
    if (!currentQuestion) {
      return false;
    }
    if (currentQuestion.questionType === 'MATCHING') {
      const state = matching[currentQuestion.id];
      return Boolean(state) && Object.keys(state.pairs).length === currentQuestion.options.length;
    }
    if (currentQuestion.questionType === 'IDENTIFICATION' || currentQuestion.questionType === 'FILL_BLANK') {
      return Boolean((answers[currentQuestion.id] || '').trim());
    }
    return Boolean(answers[currentQuestion.id]);
  };

  const handleSubmit = async () => {
    const answerList = takeData.questions.map((question) => ({
      questionId: question.id,
      responseText: question.questionType === 'MATCHING'
        ? JSON.stringify(matching[question.id]?.pairs || {})
        : (answers[question.id] || ''),
    }));

    setSubmitting(true);
    const result = await submitPretestAttempt(takeData.id, studentId, { answers: answerList });
    setSubmitting(false);

    if (!result.error && result.data) {
      setSubmitResult(result.data);
      setMode('result');
    }
  };

  const handleNext = () => {
    if (currentIndex < takeData.questions.length - 1) {
      setCurrentIndex((index) => index + 1);
    } else {
      void handleSubmit();
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((index) => Math.max(0, index - 1));
  };

  const handleBackToBrowse = () => {
    setMode('browse');
    setTakeData(null);
    setCurrentIndex(0);
    setAnswers({});
    setMatching({});
    setSubmitResult(null);
    void loadPretests();
  };

  return (
    <section className="module-shell student-class-workspace">
      <header className="module-banner student-class-banner">
        <div>
          <p className="module-label">Your Classroom</p>
          <h3>{studentClassInfo.className}</h3>
          <p>
            Learning materials and pretests shared by {[studentClassInfo.teacherFirstName, studentClassInfo.teacherLastName].filter(Boolean).join(' ') || 'your teacher'}.
          </p>
        </div>
        <div className="module-banner-stats">
          <article>
            <span>Materials</span>
            <strong>{studentMaterials.length}</strong>
          </article>
          <button type="button" className="module-back" onClick={() => onNavigate('dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </header>

        {mode === 'browse' && (
          <>
            <div className="module-strip student-class-tabs" role="tablist" aria-label="Class content">
              <button type="button" role="tab" className={`module-tab${tab === 'materials' ? ' active' : ''}`} onClick={() => onNavigate('class', 'materials')}>
                <h4>Materials</h4>
                <span>Review lessons and files shared for your class.</span>
              </button>
              <button type="button" role="tab" className={`module-tab${tab === 'pretests' ? ' active' : ''}`} onClick={() => onNavigate('class', 'pretests')}>
                <h4>Pretests</h4>
                <span>Check your understanding and track your attempts.</span>
              </button>
            </div>

            <div className="module-stage student-class-stage">
            {tab === 'materials' && (
              <div className="dashboard-materials-list student-class-list">
                {studentMaterials.map((material) => (
                  <a
                    key={material.id}
                    className="dashboard-material-item"
                    href={material.downloadUrl || undefined}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{material.title || material.fileName}</span>
                    <span className="dashboard-material-meta">
                      {material.fileSize ? formatFileSize(material.fileSize) : ''}
                    </span>
                  </a>
                ))}
                {studentMaterials.length === 0 && (
                  <p className="dashboard-materials-empty">No materials shared yet.</p>
                )}
              </div>
            )}

            {tab === 'pretests' && (
              <div className="dashboard-pretest-list">
                {pretestsLoading && <p className="dashboard-materials-empty">Loading pretests...</p>}
                {pretestsError && <p className="dashboard-materials-empty">{pretestsError}</p>}
                {takeError && <p className="dashboard-materials-empty">{takeError}</p>}

                {!pretestsLoading && pretests.map((pretest) => (
                  <div key={pretest.id} className="dashboard-pretest-item">
                    <div className="dashboard-pretest-item-copy">
                      <strong>{pretest.title}</strong>
                      {pretest.description && <span>{pretest.description}</span>}
                      <span className="dashboard-material-meta">
                        {pretest.questionCount} question{pretest.questionCount === 1 ? '' : 's'}
                        {pretest.latestAttempt ? ` • Best: ${pretest.latestAttempt.score}/${pretest.latestAttempt.totalQuestions}` : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="dashboard-card-button dashboard-pretest-take-button"
                      onClick={() => handleStartPretest(pretest.id)}
                      disabled={takeLoading}
                    >
                      {pretest.latestAttempt ? 'Retake' : 'Take Pretest'}
                    </button>
                  </div>
                ))}

                {!pretestsLoading && pretests.length === 0 && (
                  <p className="dashboard-materials-empty">No pretests shared yet.</p>
                )}
              </div>
            )}
            </div>
          </>
        )}

        {mode === 'taking' && takeData && currentQuestion && (
          <div className="module-stage dashboard-pretest-take student-class-stage">
            <div className="dashboard-pretest-progress">
              Question {currentIndex + 1} of {takeData.questions.length}
            </div>

            <p className="dashboard-pretest-question">{currentQuestion.promptText}</p>

            {currentQuestion.audioUrl && (
              <button type="button" className="dashboard-pretest-audio-button" onClick={() => playAudio(currentQuestion.audioUrl)}>
                🔊 Listen
              </button>
            )}

            {(currentQuestion.questionType === 'MULTIPLE_CHOICE' || currentQuestion.questionType === 'TRUE_FALSE') && (
              <div className="dashboard-pretest-options">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`dashboard-pretest-option${answers[currentQuestion.id] === String(option.id) ? ' selected' : ''}`}
                    onClick={() => handleOptionSelect(currentQuestion, option)}
                  >
                    {option.label} {option.audioUrl ? '🔊' : ''}
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.questionType === 'MATCHING' && (
              <div className="dashboard-pretest-matching">
                <div className="dashboard-pretest-matching-column">
                  {currentQuestion.options.map((option) => {
                    const state = matching[currentQuestion.id];
                    const isMatched = state?.pairs?.[option.id] != null;
                    const isSelected = state?.selected === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`dashboard-pretest-match-chip${isSelected ? ' active' : ''}${isMatched ? ' matched' : ''}`}
                        onClick={() => handleMatchLeftTap(currentQuestion, option)}
                      >
                        {option.label}
                        {isMatched ? ` → ${state.pairs[option.id]}` : ''}
                      </button>
                    );
                  })}
                </div>

                <div className="dashboard-pretest-matching-column">
                  {(matching[currentQuestion.id]?.rightPool || []).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="dashboard-pretest-match-chip"
                      onClick={() => handleMatchRightTap(currentQuestion, value)}
                      disabled={!matching[currentQuestion.id]?.selected}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(currentQuestion.questionType === 'IDENTIFICATION' || currentQuestion.questionType === 'FILL_BLANK') && (
              <input
                type="text"
                className="dashboard-pretest-text-input"
                value={answers[currentQuestion.id] || ''}
                onChange={(event) => handleTextAnswer(currentQuestion, event.target.value)}
                placeholder="Type your answer"
              />
            )}

            <div className="dashboard-pretest-nav">
              <button type="button" className="dashboard-secondary-button" onClick={handleBackToBrowse}>
                Exit
              </button>
              {currentIndex > 0 && (
                <button type="button" className="dashboard-secondary-button" onClick={handlePrevious}>
                  Back
                </button>
              )}
              <button
                type="button"
                className="dashboard-card-button"
                onClick={handleNext}
                disabled={!isCurrentAnswered() || submitting}
              >
                {submitting ? 'Submitting...' : currentIndex === takeData.questions.length - 1 ? 'Submit' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {mode === 'result' && submitResult && takeData && (
          <div className="module-stage dashboard-pretest-result student-class-stage">
            <h4>You scored {submitResult.score} / {submitResult.totalQuestions}!</h4>
            <div className="dashboard-pretest-result-list">
              {takeData.questions.map((question, index) => {
                const outcome = submitResult.results.find((entry) => entry.questionId === question.id);
                return (
                  <div key={question.id} className={`dashboard-pretest-result-item${outcome?.correct ? ' correct' : ' incorrect'}`}>
                    <span>{index + 1}. {question.promptText}</span>
                    <span>{outcome?.correct ? '✓' : '✗'}</span>
                  </div>
                );
              })}
            </div>
            <div className="dashboard-pretest-nav">
              <button type="button" className="dashboard-secondary-button" onClick={handleBackToBrowse}>
                Done
              </button>
              <button type="button" className="dashboard-card-button" onClick={() => handleStartPretest(takeData.id)}>
                Retake
              </button>
            </div>
          </div>
        )}
    </section>
  );
}
