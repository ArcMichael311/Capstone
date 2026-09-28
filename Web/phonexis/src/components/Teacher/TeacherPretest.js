import { useEffect, useState } from 'react';
import {
  addPretestQuestion,
  createPretest,
  deletePretest,
  deletePretestQuestion,
  fetchPretestAttempts,
  fetchPretestDetail,
  fetchTeacherPretests,
  updatePretest,
  updatePretestQuestion,
} from '../../lib/supabaseClient';
import { formatDate, formatTimestamp } from './teacherUtils';
import { ClipboardCheckIcon, CloseIcon, PlusIcon, TrashIcon } from './TeacherIcons';
import TeacherAudioRecorder from './TeacherAudioRecorder';
import useConfirm from './useConfirm';

const QUESTION_TYPES = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'MATCHING', label: 'Matching Type' },
  { value: 'IDENTIFICATION', label: 'Identification' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'FILL_BLANK', label: 'Fill-in-the-Blank' },
];

const TYPE_LABELS = QUESTION_TYPES.reduce((map, type) => ({ ...map, [type.value]: type.label }), {});

const isFreeTextType = (type) => type === 'IDENTIFICATION' || type === 'FILL_BLANK';

const makeOption = (overrides = {}) => ({
  tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  label: '',
  matchValue: '',
  audio: null,
  isCorrect: false,
  ...overrides,
});

const buildInitialOptions = (type) => {
  if (type === 'TRUE_FALSE') {
    return [makeOption({ tempId: 'true', label: 'True' }), makeOption({ tempId: 'false', label: 'False' })];
  }
  if (type === 'MULTIPLE_CHOICE' || type === 'MATCHING') {
    return [makeOption(), makeOption()];
  }
  return [];
};

const optionsFromResponse = (options) => (options || []).map((option) => makeOption({
  tempId: option.id,
  label: option.label || '',
  matchValue: option.matchValue || '',
  audio: option.audioStoragePath ? { storagePath: option.audioStoragePath, downloadUrl: option.audioUrl } : null,
  isCorrect: Boolean(option.correct),
}));

export default function TeacherPretest({ backendUserId, classes, loading }) {
  const [confirmDialog, confirm] = useConfirm();

  const [selectedClassId, setSelectedClassId] = useState(null);
  const [pretests, setPretests] = useState([]);
  const [pretestsLoading, setPretestsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const [view, setView] = useState('list');
  const [selectedPretestId, setSelectedPretestId] = useState(null);
  const [pretestDetail, setPretestDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [editingMeta, setEditingMeta] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionType, setQuestionType] = useState('MULTIPLE_CHOICE');
  const [promptText, setPromptText] = useState('');
  const [promptAudio, setPromptAudio] = useState(null);
  const [correctAnswerText, setCorrectAnswerText] = useState('');
  const [options, setOptions] = useState(buildInitialOptions('MULTIPLE_CHOICE'));
  const [questionFormError, setQuestionFormError] = useState(null);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const [showResults, setShowResults] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const loadPretests = async (classId) => {
    setPretestsLoading(true);
    setError(null);
    const result = await fetchTeacherPretests(classId);
    if (result.error) {
      setError(result.error.message || 'Failed to load pretests');
    } else {
      setPretests(Array.isArray(result.data) ? result.data : []);
    }
    setPretestsLoading(false);
  };

  useEffect(() => {
    if (selectedClassId) {
      void loadPretests(selectedClassId);
    }
  }, [selectedClassId]);

  const loadPretestDetail = async (pretestId) => {
    setDetailLoading(true);
    const result = await fetchPretestDetail(pretestId, backendUserId);
    setDetailLoading(false);
    if (result.error) {
      setError(result.error.message || 'Failed to load pretest');
      return;
    }
    setPretestDetail(result.data);
  };

  const handleSelectClass = (classId) => {
    setSelectedClassId(classId);
    setView('list');
    setSelectedPretestId(null);
    setPretestDetail(null);
  };

  const handleCreatePretest = async (event) => {
    event.preventDefault();
    if (!newTitle.trim()) {
      setError('Pretest title is required');
      return;
    }

    setCreating(true);
    setError(null);
    const result = await createPretest(selectedClassId, backendUserId, {
      title: newTitle.trim(),
      description: newDescription.trim(),
    });
    setCreating(false);

    if (result.error) {
      setError(result.error.message || 'Failed to create pretest');
      return;
    }

    setNewTitle('');
    setNewDescription('');
    await loadPretests(selectedClassId);
  };

  const handleDeletePretest = async (pretestId) => {
    const confirmed = await confirm('Students will no longer be able to see or take this pretest.', {
      title: 'Delete this pretest?',
      confirmLabel: 'Delete Pretest',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }

    const result = await deletePretest(pretestId, backendUserId);
    if (!result.error) {
      if (selectedPretestId === pretestId) {
        setView('list');
        setSelectedPretestId(null);
        setPretestDetail(null);
      }
      await loadPretests(selectedClassId);
    }
  };

  const handleOpenPretest = async (pretestId) => {
    setSelectedPretestId(pretestId);
    setView('edit');
    setShowQuestionForm(false);
    setEditingMeta(false);
    setShowResults(false);
    setAttempts([]);
    await loadPretestDetail(pretestId);
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedPretestId(null);
    setPretestDetail(null);
    setShowQuestionForm(false);
    setShowResults(false);
  };

  const handleStartEditMeta = () => {
    setMetaTitle(pretestDetail.title);
    setMetaDescription(pretestDetail.description || '');
    setEditingMeta(true);
  };

  const handleSaveMeta = async (event) => {
    event.preventDefault();
    if (!metaTitle.trim()) {
      return;
    }
    setSavingMeta(true);
    const result = await updatePretest(selectedPretestId, backendUserId, {
      title: metaTitle.trim(),
      description: metaDescription.trim(),
    });
    setSavingMeta(false);
    if (!result.error) {
      setEditingMeta(false);
      await loadPretestDetail(selectedPretestId);
      await loadPretests(selectedClassId);
    }
  };

  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQuestionType('MULTIPLE_CHOICE');
    setPromptText('');
    setPromptAudio(null);
    setCorrectAnswerText('');
    setOptions(buildInitialOptions('MULTIPLE_CHOICE'));
    setQuestionFormError(null);
  };

  const handleAddQuestionClick = () => {
    resetQuestionForm();
    setShowQuestionForm(true);
  };

  const handleTypeChange = (type) => {
    setQuestionType(type);
    setOptions(buildInitialOptions(type));
    setCorrectAnswerText('');
  };

  const handleEditQuestion = (question) => {
    setEditingQuestionId(question.id);
    setQuestionType(question.questionType);
    setPromptText(question.promptText || '');
    setPromptAudio(question.audioStoragePath ? { storagePath: question.audioStoragePath, downloadUrl: question.audioUrl } : null);
    setCorrectAnswerText(question.correctAnswerText || '');
    setOptions(isFreeTextType(question.questionType) ? [] : optionsFromResponse(question.options));
    setQuestionFormError(null);
    setShowQuestionForm(true);
  };

  const handleDeleteQuestion = async (questionId) => {
    const confirmed = await confirm('This question will be removed from the pretest.', {
      title: 'Delete this question?',
      confirmLabel: 'Delete Question',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }

    const result = await deletePretestQuestion(questionId, backendUserId);
    if (!result.error) {
      if (editingQuestionId === questionId) {
        setShowQuestionForm(false);
        resetQuestionForm();
      }
      await loadPretestDetail(selectedPretestId);
      await loadPretests(selectedClassId);
    }
  };

  const handleOptionField = (index, field, value) => {
    setOptions((prev) => prev.map((option, i) => (i === index ? { ...option, [field]: value } : option)));
  };

  const handleOptionCorrect = (index) => {
    setOptions((prev) => prev.map((option, i) => ({ ...option, isCorrect: i === index })));
  };

  const handleOptionAudio = (index, audio) => {
    setOptions((prev) => prev.map((option, i) => (i === index ? { ...option, audio } : option)));
  };

  const handleAddOption = () => {
    setOptions((prev) => [...prev, makeOption()]);
  };

  const handleRemoveOption = (index) => {
    setOptions((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSaveQuestion = async (event) => {
    event.preventDefault();
    setQuestionFormError(null);

    if (!promptText.trim()) {
      setQuestionFormError('Question text is required');
      return;
    }

    const freeText = isFreeTextType(questionType);

    if (freeText) {
      if (!correctAnswerText.trim()) {
        setQuestionFormError('Enter the correct answer');
        return;
      }
    } else {
      if (options.length < 2) {
        setQuestionFormError('Add at least two answer choices');
        return;
      }
      if (options.some((option) => !option.label.trim())) {
        setQuestionFormError('Every answer choice needs text');
        return;
      }
      if (questionType === 'MATCHING' && options.some((option) => !option.matchValue.trim())) {
        setQuestionFormError('Every matching pair needs a match');
        return;
      }
      if ((questionType === 'MULTIPLE_CHOICE' || questionType === 'TRUE_FALSE') && options.filter((option) => option.isCorrect).length !== 1) {
        setQuestionFormError('Pick exactly one correct answer');
        return;
      }
    }

    const payload = {
      questionType,
      promptText: promptText.trim(),
      audioStoragePath: promptAudio?.storagePath || null,
      correctAnswerText: freeText ? correctAnswerText.trim() : null,
      options: freeText ? null : options.map((option) => ({
        label: option.label.trim(),
        matchValue: questionType === 'MATCHING' ? option.matchValue.trim() : null,
        audioStoragePath: option.audio?.storagePath || null,
        isCorrect: questionType === 'MATCHING' ? null : option.isCorrect,
      })),
    };

    setSavingQuestion(true);
    const result = editingQuestionId
      ? await updatePretestQuestion(editingQuestionId, backendUserId, payload)
      : await addPretestQuestion(selectedPretestId, backendUserId, payload);
    setSavingQuestion(false);

    if (result.error) {
      setQuestionFormError(result.error.message || 'Failed to save question');
      return;
    }

    setShowQuestionForm(false);
    resetQuestionForm();
    await loadPretestDetail(selectedPretestId);
    await loadPretests(selectedClassId);
  };

  const handleShowResults = async () => {
    setShowResults(true);
    setAttemptsLoading(true);
    const result = await fetchPretestAttempts(selectedPretestId, backendUserId);
    setAttemptsLoading(false);
    if (!result.error) {
      setAttempts(Array.isArray(result.data) ? result.data : []);
    }
  };

  if (!loading && classes.length === 0) {
    return (
      <section className="teacher-board" aria-label="Pretest">
        <p className="teacher-empty">Create a class first from the Dashboard, then come back here to build a pretest for its students.</p>
      </section>
    );
  }

  return (
    <section aria-label="Pretest">
      {confirmDialog}
      <div className="teacher-class-picker" role="group" aria-label="Select class">
        {classes.map((classItem) => (
          <button
            key={classItem.id}
            type="button"
            className={selectedClassId === classItem.id ? 'active' : ''}
            onClick={() => handleSelectClass(classItem.id)}
          >
            {classItem.name}
          </button>
        ))}
      </div>

      {error && <div className="teacher-error">{error}</div>}

      {view === 'list' && (
        <div className="teacher-activities-layout">
          <div className="teacher-activity-editor">
            <div className="teacher-board-head">
              <h3>New Pretest</h3>
              <p>Give it a name, then add questions once it's created.</p>
            </div>

            <form onSubmit={handleCreatePretest}>
              <label className="teacher-activity-field">
                <span>Title</span>
                <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="e.g. Alphabet Sounds Pretest" />
              </label>

              <label className="teacher-activity-field">
                <span>Description (optional)</span>
                <input value={newDescription} onChange={(event) => setNewDescription(event.target.value)} placeholder="What this pretest checks" />
              </label>

              <button type="submit" className="teacher-primary-button teacher-create-activity" disabled={creating || !selectedClassId}>
                {creating ? 'Creating...' : 'Create Pretest'}
              </button>
            </form>
          </div>

          <div className="teacher-activity-list-panel">
            <div className="teacher-board-head">
              <h3>Pretests</h3>
              <p>{pretestsLoading ? 'Loading...' : `${pretests.length} pretest${pretests.length === 1 ? '' : 's'} for this class`}</p>
            </div>

            <div className="teacher-pretest-list">
              {pretests.map((pretest) => (
                <article key={pretest.id} className="teacher-pretest-card">
                  <div className="teacher-pretest-card-icon"><ClipboardCheckIcon /></div>
                  <div className="teacher-material-info">
                    <strong>{pretest.title}</strong>
                    {pretest.description && <span>{pretest.description}</span>}
                    <span>{pretest.questionCount} question{pretest.questionCount === 1 ? '' : 's'} &bull; Created {formatDate(pretest.createdAt)}</span>
                  </div>
                  <div className="teacher-material-actions">
                    <button type="button" className="teacher-secondary-button" onClick={() => handleOpenPretest(pretest.id)}>
                      Manage
                    </button>
                    <button type="button" className="teacher-icon-button danger" onClick={() => handleDeletePretest(pretest.id)} title="Delete" aria-label="Delete pretest">
                      <TrashIcon />
                    </button>
                  </div>
                </article>
              ))}

              {!pretestsLoading && pretests.length === 0 && <p className="teacher-empty">No pretests created yet for this class.</p>}
            </div>
          </div>
        </div>
      )}

      {view === 'edit' && pretestDetail && (
        <div className="teacher-pretest-detail">
          <button type="button" className="teacher-secondary-button teacher-back-button" onClick={handleBackToList}>
            ← Back to Pretests
          </button>

          <div className="teacher-pretest-meta">
            {editingMeta ? (
              <form onSubmit={handleSaveMeta} className="teacher-pretest-meta-form">
                <input value={metaTitle} onChange={(event) => setMetaTitle(event.target.value)} placeholder="Pretest title" />
                <input value={metaDescription} onChange={(event) => setMetaDescription(event.target.value)} placeholder="Description (optional)" />
                <div className="teacher-pretest-meta-actions">
                  <button type="submit" className="teacher-primary-button" disabled={savingMeta}>{savingMeta ? 'Saving...' : 'Save'}</button>
                  <button type="button" className="teacher-secondary-button" onClick={() => setEditingMeta(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div>
                  <h3>{pretestDetail.title}</h3>
                  {pretestDetail.description && <p>{pretestDetail.description}</p>}
                </div>
                <div className="teacher-pretest-meta-actions">
                  <button type="button" className="teacher-secondary-button" onClick={handleStartEditMeta}>Edit</button>
                  <button type="button" className="teacher-secondary-button" onClick={handleShowResults}>Results</button>
                </div>
              </>
            )}
          </div>

          {showResults && (
            <div className="teacher-pretest-results">
              <div className="teacher-board-head">
                <h4>Results</h4>
                <button type="button" className="teacher-icon-button" onClick={() => setShowResults(false)} aria-label="Close results">
                  <CloseIcon />
                </button>
              </div>

              {attemptsLoading && <p className="teacher-empty">Loading results...</p>}
              {!attemptsLoading && attempts.length === 0 && <p className="teacher-empty">No students have taken this pretest yet.</p>}
              {!attemptsLoading && attempts.length > 0 && (
                <table className="teacher-results-table">
                  <thead>
                    <tr><th>Student</th><th>Score</th><th>Submitted</th></tr>
                  </thead>
                  <tbody>
                    {attempts.map((attempt) => (
                      <tr key={attempt.attemptId}>
                        <td>{[attempt.studentFirstName, attempt.studentLastName].filter(Boolean).join(' ')}</td>
                        <td>{attempt.score} / {attempt.totalQuestions}</td>
                        <td>{formatTimestamp(attempt.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <div className="teacher-board-head">
            <h4>Questions</h4>
            <button type="button" className="teacher-primary-button" onClick={handleAddQuestionClick}>
              <PlusIcon /> Add Question
            </button>
          </div>

          {detailLoading && <p className="teacher-empty">Loading questions...</p>}

          <div className="teacher-question-list">
            {pretestDetail.questions.map((question, index) => (
              <article key={question.id} className="teacher-question-card">
                <div className="teacher-question-card-head">
                  <span className="teacher-question-type-badge">{TYPE_LABELS[question.questionType] || question.questionType}</span>
                  <div className="teacher-material-actions">
                    <button type="button" className="teacher-icon-button" onClick={() => handleEditQuestion(question)} title="Edit question" aria-label="Edit question">
                      Edit
                    </button>
                    <button type="button" className="teacher-icon-button danger" onClick={() => handleDeleteQuestion(question.id)} title="Delete question" aria-label="Delete question">
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                <p className="teacher-question-prompt">{index + 1}. {question.promptText}</p>
                {question.audioUrl && (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <audio controls src={question.audioUrl} className="teacher-audio-preview" />
                )}

                {isFreeTextType(question.questionType) ? (
                  <p className="teacher-question-answer">Answer: {question.correctAnswerText}</p>
                ) : (
                  <ul className="teacher-question-options">
                    {question.options.map((option) => (
                      <li key={option.id} className={option.correct ? 'correct' : ''}>
                        {question.questionType === 'MATCHING' ? `${option.label} → ${option.matchValue}` : option.label}
                        {option.correct && ' ✓'}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}

            {!detailLoading && pretestDetail.questions.length === 0 && (
              <p className="teacher-empty">No questions yet. Add your first question above.</p>
            )}
          </div>

          {showQuestionForm && (
            <div className="teacher-modal-backdrop" onClick={() => setShowQuestionForm(false)}>
              <div className="teacher-modal teacher-question-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
                <div className="teacher-modal-head">
                  <h3>{editingQuestionId ? 'Edit Question' : 'Add Question'}</h3>
                  <button type="button" className="teacher-icon-button" onClick={() => setShowQuestionForm(false)} aria-label="Close">
                    <CloseIcon />
                  </button>
                </div>

                <p className="teacher-panel-hint">🎙 Recordings use Studio quality — clean microphone audio with natural processing.</p>

                <form onSubmit={handleSaveQuestion} className="teacher-question-form">
                  <label className="teacher-activity-field">
                    <span>Question Type</span>
                    <select value={questionType} onChange={(event) => handleTypeChange(event.target.value)} disabled={Boolean(editingQuestionId)}>
                      {QUESTION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="teacher-activity-field">
                    <span>Question Text</span>
                    <textarea
                      value={promptText}
                      onChange={(event) => setPromptText(event.target.value)}
                      placeholder="e.g. Which letter makes this sound?"
                      rows={2}
                    />
                  </label>

                  <TeacherAudioRecorder
                    pretestId={selectedPretestId}
                    teacherId={backendUserId}
                    value={promptAudio}
                    onChange={setPromptAudio}
                    label="Question audio (say the word or letter)"
                  />

                  {isFreeTextType(questionType) && (
                    <label className="teacher-activity-field">
                      <span>Correct Answer</span>
                      <input
                        value={correctAnswerText}
                        onChange={(event) => setCorrectAnswerText(event.target.value)}
                        placeholder="Separate accepted answers with | e.g. Cat|cats"
                      />
                    </label>
                  )}

                  {!isFreeTextType(questionType) && (
                    <div className="teacher-option-editor">
                      <span className="teacher-option-editor-label">
                        {questionType === 'MATCHING' ? 'Matching Pairs' : 'Answer Choices'}
                      </span>

                      {options.map((option, index) => (
                        <div key={option.tempId} className="teacher-option-row">
                          {questionType !== 'MATCHING' && (
                            <input
                              type="radio"
                              name="correct-option"
                              checked={option.isCorrect}
                              onChange={() => handleOptionCorrect(index)}
                              aria-label={`Mark "${option.label || `choice ${index + 1}`}" as correct`}
                            />
                          )}

                          <input
                            value={option.label}
                            onChange={(event) => handleOptionField(index, 'label', event.target.value)}
                            placeholder={questionType === 'MATCHING' ? 'Term' : `Choice ${index + 1}`}
                            disabled={questionType === 'TRUE_FALSE'}
                            className="teacher-option-label-input"
                          />

                          {questionType === 'MATCHING' && (
                            <input
                              value={option.matchValue}
                              onChange={(event) => handleOptionField(index, 'matchValue', event.target.value)}
                              placeholder="Match"
                              className="teacher-option-label-input"
                            />
                          )}

                          <TeacherAudioRecorder
                            pretestId={selectedPretestId}
                            teacherId={backendUserId}
                            value={option.audio}
                            onChange={(audio) => handleOptionAudio(index, audio)}
                          />

                          {questionType !== 'TRUE_FALSE' && options.length > 2 && (
                            <button
                              type="button"
                              className="teacher-icon-button danger"
                              onClick={() => handleRemoveOption(index)}
                              aria-label="Remove choice"
                            >
                              <TrashIcon />
                            </button>
                          )}
                        </div>
                      ))}

                      {questionType !== 'TRUE_FALSE' && (
                        <button type="button" className="teacher-secondary-button" onClick={handleAddOption}>
                          <PlusIcon /> Add {questionType === 'MATCHING' ? 'Pair' : 'Choice'}
                        </button>
                      )}
                    </div>
                  )}

                  {questionFormError && <div className="teacher-error">{questionFormError}</div>}

                  <div className="teacher-pretest-meta-actions">
                    <button type="submit" className="teacher-primary-button" disabled={savingQuestion}>
                      {savingQuestion ? 'Saving...' : 'Save Question'}
                    </button>
                    <button type="button" className="teacher-secondary-button" onClick={() => setShowQuestionForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
