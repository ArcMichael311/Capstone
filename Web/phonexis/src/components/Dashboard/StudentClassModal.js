import { useEffect, useRef, useState } from 'react';
import { fetchPretestForStudent, fetchStudentPretests, submitPretestAttempt } from '../../lib/supabaseClient';
import './StudentClass.css';

const materialTypes = {
  pdf: { key: 'pdf', icon: '📄', label: 'PDF' },
  ppt: { key: 'ppt', icon: '📊', label: 'Slides' },
  pptx: { key: 'ppt', icon: '📊', label: 'Slides' },
  mp4: { key: 'mp4', icon: '🎬', label: 'Video' },
  mp3: { key: 'mp3', icon: '🎵', label: 'Audio' },
};

const extensionOf = (fileName = '') => {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : '';
};

const getMaterialInfo = (material) => (
  materialTypes[String(material.materialType || '').toLowerCase()]
  || materialTypes[extensionOf(material.fileName)]
  || { key: 'file', icon: '📁', label: 'File' }
);

// Save downloads under the material's title ("Vowel Sounds.pdf"), not the stored file name.
const getDownloadName = (material) => {
  const extension = extensionOf(material.fileName);
  const base = String(material.title || material.fileName || 'material').replace(/[\\/:*?"<>|]/g, '').trim() || 'material';
  return extension && !base.toLowerCase().endsWith(`.${extension}`) ? `${base}.${extension}` : base;
};

const getStars = (score, total) => {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 1) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.4) return 1;
  return 0;
};

const confettiColors = ['#ec4899', '#fbbf24', '#3b82f6', '#10b981', '#8b5cf6', '#f97316'];
const confettiPieces = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 29) % 100,
  delay: (i % 10) * 0.12,
  duration: 2.2 + (i % 5) * 0.35,
  color: confettiColors[i % confettiColors.length],
}));

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
    void loadPretests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, studentClassInfo?.classId]);

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

  const teacherName = [studentClassInfo.teacherFirstName, studentClassInfo.teacherLastName].filter(Boolean).join(' ') || 'your teacher';
  const completedPretests = pretests.filter((pretest) => pretest.latestAttempt).length;
  const totalQuestions = takeData?.questions?.length || 0;

  const renderMaterials = () => (
    <div className="sc-material-grid">
      {studentMaterials.map((material, index) => {
        const info = getMaterialInfo(material);
        return (
          <article key={material.id} className={`sc-material sc-type-${info.key}`} style={{ '--i': index }}>
            <span className="sc-material-icon" aria-hidden="true">{info.icon}</span>
            <div className="sc-material-copy">
              <span className="sc-material-type">{info.label}</span>
              <strong>{material.title || material.fileName}</strong>
              {material.fileSize ? <span className="sc-material-size">{formatFileSize(material.fileSize)}</span> : null}
            </div>
            {material.downloadUrl ? (
              <a
                className="sc-btn sc-download"
                href={material.downloadUrl}
                target="_blank"
                rel="noreferrer"
                download={getDownloadName(material)}
              >
                ⬇ Download
              </a>
            ) : (
              <span className="sc-btn sc-btn-disabled">Unavailable</span>
            )}
          </article>
        );
      })}
      {studentMaterials.length === 0 && (
        <div className="sc-empty">
          <span aria-hidden="true">📭</span>
          <strong>No materials yet</strong>
          <p>Your teacher hasn&apos;t shared any files. Check back soon!</p>
        </div>
      )}
    </div>
  );

  const renderPretests = () => (
    <div className="sc-quest-list">
      {pretestsLoading && <p className="sc-note">⏳ Loading pretests...</p>}
      {pretestsError && <p className="sc-note sc-note-bad">{pretestsError}</p>}
      {takeError && <p className="sc-note sc-note-bad">{takeError}</p>}

      {!pretestsLoading && pretests.map((pretest, index) => {
        const attempt = pretest.latestAttempt;
        const stars = attempt ? getStars(attempt.score, attempt.totalQuestions) : 0;
        return (
          <article key={pretest.id} className={`sc-quest ${attempt ? 'done' : ''}`} style={{ '--i': index }}>
            <span className="sc-quest-icon" aria-hidden="true">{attempt ? '🏅' : '📝'}</span>
            <div className="sc-quest-copy">
              <span className="sc-quest-label">Quest {index + 1}</span>
              <strong>{pretest.title}</strong>
              {pretest.description && <p>{pretest.description}</p>}
              <div className="sc-quest-chips">
                <span>❓ {pretest.questionCount} question{pretest.questionCount === 1 ? '' : 's'}</span>
                {attempt ? <span>⭐ Best: {attempt.score}/{attempt.totalQuestions}</span> : <span>✨ New!</span>}
              </div>
            </div>
            <div className="sc-quest-side">
              {attempt ? (
                <div className="sc-stars" aria-label={`${stars} of 3 stars`}>
                  {[1, 2, 3].map((value) => (
                    <span key={value} className={value <= stars ? 'earned' : ''}>★</span>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                className={`sc-btn ${attempt ? 'sc-btn-soft' : 'sc-pulse'}`}
                onClick={() => handleStartPretest(pretest.id)}
                disabled={takeLoading}
              >
                {attempt ? '↻ Retake' : '▶ Start Quest'}
              </button>
            </div>
          </article>
        );
      })}

      {!pretestsLoading && pretests.length === 0 && (
        <div className="sc-empty">
          <span aria-hidden="true">🗒️</span>
          <strong>No pretests yet</strong>
          <p>When your teacher adds a pretest, it will show up here as a quest.</p>
        </div>
      )}
    </div>
  );

  const renderTaking = () => (
    <section className="sc-take">
      <div className="sc-take-head">
        <div>
          <span className="sc-kicker sc-kicker-dark">📝 {takeData.title}</span>
          <strong>Question {currentIndex + 1} of {totalQuestions}</strong>
        </div>
        <button type="button" className="sc-btn sc-btn-soft" onClick={handleBackToBrowse}>
          ✕ Exit
        </button>
      </div>

      <div className="sc-take-dots" aria-hidden="true">
        {takeData.questions.map((question, index) => (
          <span key={question.id} className={index === currentIndex ? 'current' : index < currentIndex ? 'done' : ''} />
        ))}
      </div>

      <div key={currentQuestion.id} className="sc-question">
        <p className="sc-question-prompt">{currentQuestion.promptText}</p>

        {currentQuestion.audioUrl && (
          <button type="button" className="sc-listen" onClick={() => playAudio(currentQuestion.audioUrl)}>
            🔊 Listen
          </button>
        )}

        {(currentQuestion.questionType === 'MULTIPLE_CHOICE' || currentQuestion.questionType === 'TRUE_FALSE') && (
          <div className="sc-options">
            {currentQuestion.options.map((option, index) => (
              <button
                key={option.id}
                type="button"
                className={`sc-option${answers[currentQuestion.id] === String(option.id) ? ' selected' : ''}`}
                style={{ '--i': index }}
                onClick={() => handleOptionSelect(currentQuestion, option)}
              >
                {option.label} {option.audioUrl ? '🔊' : ''}
              </button>
            ))}
          </div>
        )}

        {currentQuestion.questionType === 'MATCHING' && (
          <div className="sc-matching">
            <div className="sc-match-column">
              <span className="sc-match-hint">1️⃣ Tap a word</span>
              {currentQuestion.options.map((option) => {
                const state = matching[currentQuestion.id];
                const isMatched = state?.pairs?.[option.id] != null;
                const isSelected = state?.selected === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`sc-match-chip${isSelected ? ' active' : ''}${isMatched ? ' matched' : ''}`}
                    onClick={() => handleMatchLeftTap(currentQuestion, option)}
                  >
                    {option.label}
                    {isMatched ? ` → ${state.pairs[option.id]}` : ''}
                  </button>
                );
              })}
            </div>

            <div className="sc-match-column">
              <span className="sc-match-hint">2️⃣ Tap its match</span>
              {(matching[currentQuestion.id]?.rightPool || []).map((value) => (
                <button
                  key={value}
                  type="button"
                  className="sc-match-chip"
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
            className="sc-text-input"
            value={answers[currentQuestion.id] || ''}
            onChange={(event) => handleTextAnswer(currentQuestion, event.target.value)}
            placeholder="✏️ Type your answer"
          />
        )}
      </div>

      <div className="sc-take-nav">
        {currentIndex > 0 ? (
          <button type="button" className="sc-btn sc-btn-soft" onClick={handlePrevious}>
            ‹ Back
          </button>
        ) : <span />}
        <button
          type="button"
          className="sc-btn"
          onClick={handleNext}
          disabled={!isCurrentAnswered() || submitting}
        >
          {submitting ? '⏳ Submitting...' : currentIndex === totalQuestions - 1 ? '🏁 Submit' : 'Next ›'}
        </button>
      </div>
    </section>
  );

  const renderResult = () => {
    const stars = getStars(submitResult.score, submitResult.totalQuestions);
    const titles = ['Keep practicing!', 'Good try!', 'Great job!', 'Perfect score!'];
    const emojis = ['💪', '👍', '🎉', '🏆'];

    return (
      <section className="sc-result">
        {stars >= 2 ? (
          <div className="sc-confetti" aria-hidden="true">
            {confettiPieces.map((piece, i) => (
              <span
                key={i}
                style={{
                  left: `${piece.left}%`,
                  background: piece.color,
                  animationDelay: `${piece.delay}s`,
                  animationDuration: `${piece.duration}s`,
                }}
              />
            ))}
          </div>
        ) : null}
        <span className="sc-result-emoji" aria-hidden="true">{emojis[stars]}</span>
        <span className="sc-kicker sc-kicker-dark">{takeData.title} complete</span>
        <h1>{titles[stars]}</h1>
        <div className="sc-stars sc-stars-big" aria-label={`${stars} of 3 stars`}>
          {[1, 2, 3].map((value) => (
            <span key={value} className={value <= stars ? 'earned' : ''} style={{ '--i': value }}>★</span>
          ))}
        </div>
        <p className="sc-result-score">
          You scored <strong>{submitResult.score}</strong> / <strong>{submitResult.totalQuestions}</strong>
        </p>
        <div className="sc-result-list">
          {takeData.questions.map((question, index) => {
            const outcome = submitResult.results.find((entry) => entry.questionId === question.id);
            return (
              <div
                key={question.id}
                className={`sc-result-item ${outcome?.correct ? 'correct' : 'incorrect'}`}
                style={{ '--i': index }}
              >
                <span>{index + 1}. {question.promptText}</span>
                <b>{outcome?.correct ? '✓' : '✗'}</b>
              </div>
            );
          })}
        </div>
        <div className="sc-result-actions">
          <button type="button" className="sc-btn sc-btn-soft" onClick={handleBackToBrowse}>
            🏫 Back to Class
          </button>
          <button type="button" className="sc-btn" onClick={() => handleStartPretest(takeData.id)}>
            ↻ Retake
          </button>
        </div>
      </section>
    );
  };

  return (
    <section className="sc-page" aria-label="Your class">
      <header className="sc-hero">
        <span className="sc-hero-icon" aria-hidden="true">🏫</span>
        <div className="sc-hero-copy">
          <span className="sc-kicker">⛺ Class Camp</span>
          <h1>{studentClassInfo.className}</h1>
          <p>👩‍🏫 Materials and pretests shared by {teacherName}</p>
        </div>
        <div className="sc-hero-stats">
          <div>
            <strong key={studentMaterials.length} className="sc-pop">📚 {studentMaterials.length}</strong>
            <span>Materials</span>
          </div>
          <div>
            <strong key={`${completedPretests}-${pretests.length}`} className="sc-pop">🏅 {completedPretests}/{pretests.length}</strong>
            <span>Quests done</span>
          </div>
        </div>
        <button type="button" className="sc-back" onClick={() => onNavigate('dashboard')}>
          ← Dashboard
        </button>
      </header>

      {mode === 'browse' && (
        <>
          <div className="sc-tabs" role="tablist" aria-label="Class content">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'materials'}
              className={`sc-tab${tab === 'materials' ? ' active' : ''}`}
              onClick={() => onNavigate('class', 'materials')}
            >
              <span className="sc-tab-icon" aria-hidden="true">📚</span>
              <span>
                <strong>Materials</strong>
                <small>Lessons and files from your teacher</small>
              </span>
              <b className="sc-tab-count">{studentMaterials.length}</b>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'pretests'}
              className={`sc-tab${tab === 'pretests' ? ' active' : ''}`}
              onClick={() => onNavigate('class', 'pretests')}
            >
              <span className="sc-tab-icon" aria-hidden="true">📝</span>
              <span>
                <strong>Pretests</strong>
                <small>Take quests and beat your best score</small>
              </span>
              <b className="sc-tab-count">{pretests.length}</b>
            </button>
          </div>

          <div key={tab} className="sc-stage">
            {tab === 'materials' ? renderMaterials() : renderPretests()}
          </div>
        </>
      )}

      {mode === 'taking' && takeData && currentQuestion && renderTaking()}
      {mode === 'result' && submitResult && takeData && renderResult()}
    </section>
  );
}
