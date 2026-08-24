import { useMemo, useState } from 'react';
import './AlphabetRecognition.css';
import AlphaQuest from './AlphaQuest';

const alphabet = [
  { letter: 'A', word: 'Apple', icon: '🍎' },
  { letter: 'B', word: 'Ball', icon: '🏀' },
  { letter: 'C', word: 'Cat', icon: '🐱' },
  { letter: 'D', word: 'Dog', icon: '🐶' },
  { letter: 'E', word: 'Egg', icon: '🥚' },
  { letter: 'F', word: 'Fish', icon: '🐟' },
  { letter: 'G', word: 'Grapes', icon: '🍇' },
  { letter: 'H', word: 'Hat', icon: '🎩' },
  { letter: 'I', word: 'Ice cream', icon: '🍦' },
  { letter: 'J', word: 'Jam', icon: '🫙' },
  { letter: 'K', word: 'Kite', icon: '🪁' },
  { letter: 'L', word: 'Lion', icon: '🦁' },
  { letter: 'M', word: 'Moon', icon: '🌙' },
  { letter: 'N', word: 'Nest', icon: '🪺' },
  { letter: 'O', word: 'Orange', icon: '🍊' },
  { letter: 'P', word: 'Pear', icon: '🍐' },
  { letter: 'Q', word: 'Queen', icon: '👑' },
  { letter: 'R', word: 'Rainbow', icon: '🌈' },
  { letter: 'S', word: 'Sun', icon: '☀️' },
  { letter: 'T', word: 'Tree', icon: '🌳' },
  { letter: 'U', word: 'Umbrella', icon: '☂️' },
  { letter: 'V', word: 'Violin', icon: '🎻' },
  { letter: 'W', word: 'Whale', icon: '🐋' },
  { letter: 'X', word: 'Xylophone', icon: '🎼' },
  { letter: 'Y', word: 'Yarn', icon: '🧶' },
  { letter: 'Z', word: 'Zebra', icon: '🦓' },
];

export default function AlphabetRecognition({ onPretestComplete, onBack, onProgressUpdate, completedModes = [] }) {
  const [selectedLetter, setSelectedLetter] = useState(alphabet[0]);
  const [feedback, setFeedback] = useState('Choose a letter to see its sample object.');
  const [mode, setMode] = useState('learning'); // 'learning' or 'pretest'
  const [difficulty, setDifficulty] = useState(null); // 'easy', 'medium', 'hard'
  const [currentPretestLetter, setCurrentPretestLetter] = useState(null);
  const [hasListened, setHasListened] = useState(false);
  const [pretestScore, setPretestScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0); // Track total attempts (correct + wrong)
  const [correctLetters, setCorrectLetters] = useState([]); // Track correctly identified letters
  const [wrongPromptLetters, setWrongPromptLetters] = useState([]); // Track spoken letters answered incorrectly
  const [completedPromptLetters, setCompletedPromptLetters] = useState([]); // Track spoken letters that should not be replayed
  const [showAlphaQuest, setShowAlphaQuest] = useState(false); // Track if AlphaQuest is active
  const pretestLevels = [
    { key: 'easy', label: 'Easy', rangeLabel: 'A-M', className: 'easy-level' },
    { key: 'medium', label: 'Medium', rangeLabel: 'N-Z', className: 'medium-level' },
    { key: 'hard', label: 'Hard', rangeLabel: 'A-Z', className: 'hard-level' },
  ];

  const letters = useMemo(() => alphabet.map((item) => item.letter), []);
  const selectedIndex = letters.indexOf(selectedLetter.letter);

  const speakLetter = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setFeedback(`Speech is not available for ${selectedLetter.letter} right now.`);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selectedLetter.letter);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    setFeedback(`Speaking ${selectedLetter.letter}.`);
  };

  const handlePick = (letter) => {
    const nextSelected = alphabet.find((item) => item.letter === letter) ?? alphabet[0];
    setSelectedLetter(nextSelected);
    setFeedback(`Selected ${nextSelected.letter} - ${nextSelected.word}.`);
  };

  const goToRelativeLetter = (offset) => {
    const nextIndex = (selectedIndex + offset + alphabet.length) % alphabet.length;
    const nextSelected = alphabet[nextIndex];
    setSelectedLetter(nextSelected);
    setFeedback(`Selected ${nextSelected.letter} - ${nextSelected.word}.`);
  };

  const getDifficultyRange = (diff) => {
    if (diff === 'easy') return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
    if (diff === 'medium') return ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  };

  const getMaxAttempts = (diff) => {
    if (diff === 'medium') return 8;
    if (diff === 'hard') return 5;
    return 10;
  };

  const getAvailablePretestLetters = (
    range,
    correct = correctLetters,
    wrong = wrongPromptLetters,
    excludedLetters = completedPromptLetters
  ) => {
    const excluded = new Set(excludedLetters);
    return range.filter((letter) => !correct.includes(letter) && !wrong.includes(letter) && !excluded.has(letter));
  };

  const pickNextPretestLetter = (range, correct = correctLetters, wrong = wrongPromptLetters, excludedLetters = []) => {
    const availableLetters = getAvailablePretestLetters(range, correct, wrong, excludedLetters);

    if (availableLetters.length > 0) {
      return availableLetters[Math.floor(Math.random() * availableLetters.length)];
    }

    const fallbackLetters = range.filter((letter) => !correct.includes(letter) && !wrong.includes(letter));
    if (fallbackLetters.length > 0) {
      return fallbackLetters[Math.floor(Math.random() * fallbackLetters.length)];
    }

    return null;
  };

  const resetPretestState = (diff) => {
    setMode('pretest');
    setDifficulty(diff);
    setPretestScore(0);
    setTotalAttempts(0);
    setCorrectLetters([]);
    setWrongPromptLetters([]);
    setCompletedPromptLetters([]);
    setHasListened(false);

    const range = getDifficultyRange(diff);
    setCurrentPretestLetter(pickNextPretestLetter(range, [], [], []));
    setFeedback('Press listen to hear the first letter.');
  };

  const startPretest = (diff) => {
    resetPretestState(diff);
  };

  const playPretestAudio = (letter) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(letter);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      setFeedback('Listen to the letter...');
    }
  };

  const handlePretestAnswer = (letter) => {
    if (!hasListened || !currentPretestLetter) {
      return;
    }

    const range = getDifficultyRange(difficulty);
    const maxAttempts = getMaxAttempts(difficulty);
    const currentLetter = currentPretestLetter;

    if (completedPromptLetters.includes(letter)) {
      return;
    }

    const newTotalAttempts = totalAttempts + 1;
    const isCorrect = letter === currentLetter;
    const nextCorrectLetters = isCorrect ? [...correctLetters, letter] : correctLetters;
    const nextScore = isCorrect ? pretestScore + 1 : pretestScore;
    const nextWrongPromptLetters = isCorrect ? wrongPromptLetters : [...wrongPromptLetters, currentLetter];
    const nextCompletedPromptLetters = [...new Set([...completedPromptLetters, currentLetter])];
    const nextLetter = pickNextPretestLetter(range, nextCorrectLetters, nextWrongPromptLetters, nextCompletedPromptLetters);

    setCorrectLetters(nextCorrectLetters);
    setWrongPromptLetters(nextWrongPromptLetters);
    setCompletedPromptLetters(nextCompletedPromptLetters);
    setPretestScore(nextScore);
    setTotalAttempts(newTotalAttempts);
    setFeedback(isCorrect ? `✓ Check! ${letter} is correct.` : `✗ Wrong! ${currentLetter} is incorrect.`);

    if (newTotalAttempts >= maxAttempts || !nextLetter) {
      setTimeout(() => {
        setFeedback(`Pretest Complete! Score: ${nextScore}/${maxAttempts}`);
        setMode('learning');
        setCurrentPretestLetter(null);
        setHasListened(false);

        // Notify parent of mode completion and update progress
        if (typeof onProgressUpdate === 'function') {
          onProgressUpdate(difficulty);
        }

        if (typeof onPretestComplete === 'function') {
          onPretestComplete(difficulty);
        }
      }, 1500);
      return;
    }

    setCurrentPretestLetter(nextLetter);
    setHasListened(false);

    setTimeout(() => {
      setFeedback('Press listen to hear the next letter.');
    }, 1000);
  };

  return (
    <div className="module-detail alphabet-module">
      <div className="alphabet-topbar">
        <p className="module-detail-label">
          {mode === 'learning' ? 'Alphabet Recognition' : `Pretest - ${difficulty?.toUpperCase()}`}
        </p>
        <button type="button" className="module-back secondary" onClick={onBack}>
          ← Return to learning path
        </button>
      </div>

      {mode === 'learning' ? (
        <div className="alphabet-stage">
          <div className="alphabet-display">
            <div className="alphabet-letter-panel">
              <span className="alphabet-letter">{selectedLetter.letter}</span>
            </div>

            <div className="alphabet-object-panel">
              <span className="alphabet-object-icon" aria-hidden="true">
                {selectedLetter.icon}
              </span>
              <div>
                <p className="alphabet-object-word">{selectedLetter.word}</p>
                <p className="alphabet-object-caption">Sample object</p>
              </div>
            </div>
          </div>

          <div className="alphabet-actions">
            <button type="button" className="alphabet-speak-button" onClick={speakLetter}>
              🔊 Listen
            </button>
            <p className="game-feedback">{feedback}</p>
          </div>

          <div className="alphabet-controls">
            <button type="button" className="alphabet-nav-button" onClick={() => goToRelativeLetter(-1)}>
              Previous
            </button>
            <button type="button" className="alphabet-nav-button" onClick={() => goToRelativeLetter(1)}>
              Next
            </button>
          </div>

          <div className="letter-grid" aria-label="Alphabet choices">
            {letters.map((letter) => (
              <button
                key={letter}
                type="button"
                className={letter === selectedLetter.letter ? 'letter-tile active' : 'letter-tile'}
                onClick={() => handlePick(letter)}
              >
                {letter}
              </button>
            ))}
          </div>

          <div className="pretest-level-grid">
            {pretestLevels.map((level) => {
              const isCompleted = completedModes.includes(level.key);

              return (
                <button
                  key={level.key}
                  type="button"
                  className={`alphabet-complete-button pretest-level-button ${level.className}${isCompleted ? ' completed' : ''}`}
                  onClick={() => startPretest(level.key)}
                >
                  <span className="pretest-level-icon" aria-hidden="true">
                    {level.key === 'easy' ? '🟢' : level.key === 'medium' ? '🟠' : '🔴'}
                  </span>
                  <span className="pretest-level-copy">
                    <strong>{level.label}</strong>
                    <span>{level.rangeLabel}</span>
                  </span>
                  {isCompleted ? <span className="pretest-level-badge">Completed</span> : null}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button
              type="button"
              className="alphabet-complete-button"
              onClick={() => setShowAlphaQuest(true)}
              style={{ padding: '1.5rem', fontSize: '1.1rem', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', width: '100%', maxWidth: '800px' }}
            >
              ⚔️ AlphaQuest - Battle Game
            </button>
          </div>
        </div>
      ) : mode === 'pretest' ? (
        <div className="alphabet-stage">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1.8rem' }}>Listen and Identify</h2>
            <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '1rem' }}>
              Score: {pretestScore}/{getMaxAttempts(difficulty)} (Attempt {totalAttempts}/{getMaxAttempts(difficulty)})
            </p>
          </div>

          <div className="alphabet-actions">
            <button
              type="button"
              className="alphabet-speak-button"
              onClick={() => {
                if (!currentPretestLetter) {
                  return;
                }

                setHasListened(true);
                playPretestAudio(currentPretestLetter);
              }}
              disabled={!currentPretestLetter}
              style={{ opacity: !currentPretestLetter ? 0.5 : 1, cursor: !currentPretestLetter ? 'not-allowed' : 'pointer' }}
            >
              🔊 Listen
            </button>
            <p className="game-feedback">{feedback}</p>
          </div>

          <div className="letter-grid" aria-label="Letter choices">
            {getDifficultyRange(difficulty).map((letter) => (
              <button
                key={letter}
                type="button"
                className={
                  correctLetters.includes(letter)
                    ? 'letter-tile active'
                      : wrongPromptLetters.includes(letter)
                    ? 'letter-tile wrong'
                    : 'letter-tile'
                }
                onClick={() => handlePretestAnswer(letter)}
                disabled={!hasListened || completedPromptLetters.includes(letter)}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {showAlphaQuest && (
        <AlphaQuest onClose={() => setShowAlphaQuest(false)} />
      )}
    </div>
  );
}
