import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './AlphabetRecognition.css';
import { configureFemaleVoice } from '../../../lib/speechUtils';
import './AlphabetPage.css';
import AlphaQuest from './AlphaQuest';
import VoicePractice from '../../VoicePractice/VoicePractice';

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

const difficultyInfo = {
  easy: { label: 'Easy', icon: '🟢', color: 'green', range: 'Letters A – M', next: 'medium' },
  medium: { label: 'Medium', icon: '🟡', color: 'amber', range: 'Letters N – Z', next: 'hard' },
  hard: { label: 'Hard', icon: '🔴', color: 'red', range: 'All letters A – Z', next: null },
};

const fryListColors = ['blue', 'purple', 'green', 'orange'];

const confettiColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#fbbf24', '#ec4899'];
const confettiPieces = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 29) % 100,
  delay: (i % 10) * 0.12,
  duration: 2.2 + (i % 5) * 0.35,
  color: confettiColors[i % confettiColors.length],
}));

const getResultStars = (score, max) => {
  const ratio = max > 0 ? score / max : 0;
  if (ratio >= 1) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.4) return 1;
  return 0;
};

export default function AlphabetRecognition({ onPretestComplete, onBack, onProgressUpdate, completedModes = [], alphabetScores = {}, initialSection = null, onNavigate }) {
  const [selectedLetter, setSelectedLetter] = useState(alphabet[0]);
  const [feedback, setFeedback] = useState('Choose a letter to see its sample object.');
  const [mode, setMode] = useState('learning'); // 'learning', 'pretest' or 'result'
  const [difficulty, setDifficulty] = useState(null); // 'easy', 'medium', 'hard'
  const [currentPretestLetter, setCurrentPretestLetter] = useState(null);
  const [hasListened, setHasListened] = useState(false);
  const [showVoicePractice, setShowVoicePractice] = useState(false);
  const [pretestScore, setPretestScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0); // Track total attempts (correct + wrong)
  const [correctLetters, setCorrectLetters] = useState([]); // Track correctly identified letters
  const [wrongPromptLetters, setWrongPromptLetters] = useState([]); // Track spoken letters answered incorrectly
  const [completedPromptLetters, setCompletedPromptLetters] = useState([]); // Track spoken letters that should not be replayed
  const [showAlphaQuest, setShowAlphaQuest] = useState(false); // Track if AlphaQuest is active

  // Gamification + animation state
  const [exploredLetters, setExploredLetters] = useState(['A']);
  const [heardFryWords, setHeardFryWords] = useState([]);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [lastAnswer, setLastAnswer] = useState(null);
  const [pretestResult, setPretestResult] = useState(null);
  const [letterTap, setLetterTap] = useState(0);
  const answerIdRef = useRef(0);

  const letters = useMemo(() => alphabet.map((item) => item.letter), []);
  const selectedIndex = letters.indexOf(selectedLetter.letter);
  const isFryWordsView = initialSection === 'frywords';
  const fryWordColumns = useMemo(
    () => [
      ['the', 'to', 'that', 'for', 'with', 'at', 'from', 'by', 'what', 'when', 'there', 'which', 'their', 'other', 'then', 'some', 'like', 'has', 'write', 'no', 'my', 'been', 'sit', 'down', 'come'],
      ['of', 'in', 'it', 'on', 'his', 'be', 'or', 'words', 'all', 'your', 'use', 'she', 'if', 'about', 'them', 'her', 'him', 'look', 'go', 'way', 'than', 'called', 'now', 'day', 'made'],
      ['and', 'is', 'he', 'are', 'they', 'this', 'one', 'but', 'were', 'can', 'an', 'do', 'will', 'out', 'these', 'would', 'into', 'two', 'see', 'could', 'first', 'who', 'find', 'did', 'may'],
      ['a', 'you', 'was', 'as', 'I', 'have', 'had', 'not', 'we', 'said', 'each', 'how', 'up', 'many', 'so', 'make', 'time', 'more', 'number', 'people', 'water', 'oil', 'long', 'get', 'part'],
    ],
    []
  );
  const totalFryWords = fryWordColumns.reduce((sum, column) => sum + column.length, 0);

  const markExplored = (letter) => {
    setExploredLetters((current) => (current.includes(letter) ? current : [...current, letter]));
  };

  const speakLetter = (letterToSpeak = selectedLetter) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setFeedback(`Speech is not available for ${letterToSpeak.letter} right now.`);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(letterToSpeak.letter);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    configureFemaleVoice(utterance);
    window.speechSynthesis.speak(utterance);
    setFeedback(`Speaking letter: ${letterToSpeak.letter}.`);
  };

  const speakLetterAndWord = (letterToSpeak = selectedLetter) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setFeedback(`Speech is not available for ${letterToSpeak.letter} right now.`);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${letterToSpeak.letter} ... ${letterToSpeak.word}.`);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    configureFemaleVoice(utterance);
    window.speechSynthesis.speak(utterance);
    setFeedback(`Speaking ${letterToSpeak.letter}: ${letterToSpeak.word}.`);
  };

  const speakObjectWord = (wordToSpeak = selectedLetter.word) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setFeedback(`Speech is not available for ${wordToSpeak} right now.`);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(wordToSpeak);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    configureFemaleVoice(utterance);
    window.speechSynthesis.speak(utterance);
    setFeedback(`Speaking word: ${wordToSpeak}.`);
  };

  const speakFryWord = (word) => {
    if (!word || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    configureFemaleVoice(utterance);
    window.speechSynthesis.speak(utterance);
    setFeedback(`Speaking word: ${word}`);
  };

  const handleFryWord = (key, word) => {
    speakFryWord(word);
    setHeardFryWords((current) => (current.includes(key) ? current : [...current, key]));
  };

  const handlePick = (letter) => {
    const nextSelected = alphabet.find((item) => item.letter === letter) ?? alphabet[0];
    setSelectedLetter(nextSelected);
    markExplored(nextSelected.letter);
    speakLetterAndWord(nextSelected);
  };

  const goToRelativeLetter = (offset) => {
    const nextIndex = (selectedIndex + offset + alphabet.length) % alphabet.length;
    const nextSelected = alphabet[nextIndex];
    setSelectedLetter(nextSelected);
    markExplored(nextSelected.letter);
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

  const resetPretestState = useCallback((diff) => {
    setMode('pretest');
    setDifficulty(diff);
    setPretestScore(0);
    setTotalAttempts(0);
    setCorrectLetters([]);
    setWrongPromptLetters([]);
    setCompletedPromptLetters([]);
    setHasListened(false);
    setAttemptHistory([]);
    setLastAnswer(null);
    setPretestResult(null);

    const range = diff === 'easy'
      ? alphabet.slice(0, 13).map((item) => item.letter)
      : diff === 'medium'
        ? alphabet.slice(13).map((item) => item.letter)
        : alphabet.map((item) => item.letter);
    setCurrentPretestLetter(range[Math.floor(Math.random() * range.length)]);
    setFeedback('Press listen to hear the first letter.');
  }, []);

  useEffect(() => {
    if (initialSection === 'alphaquest') {
      if (!showAlphaQuest) {
        setShowAlphaQuest(true);
        setMode('learning');
      }
      return;
    }

    if (showAlphaQuest) {
      setShowAlphaQuest(false);
    }

    if (['easy', 'medium', 'hard'].includes(initialSection)) {
      // Keep the results screen up until the student chooses what to do next.
      if (difficulty !== initialSection || (mode !== 'pretest' && mode !== 'result')) {
        resetPretestState(initialSection);
      }
      return;
    }

    if (mode !== 'learning') {
      setMode('learning');
    }
  }, [difficulty, initialSection, mode, resetPretestState, showAlphaQuest]);

  if (initialSection === 'alphaquest' || showAlphaQuest) {
    return (
      <AlphaQuest onClose={() => onNavigate?.('alphabet', 'learning')} />
    );
  }

  const playPretestAudio = (letter) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(letter);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      configureFemaleVoice(utterance);
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

    answerIdRef.current += 1;
    setLastAnswer({ id: answerIdRef.current, letter, correct: isCorrect });
    setAttemptHistory((current) => [...current, isCorrect]);
    setCorrectLetters(nextCorrectLetters);
    setWrongPromptLetters(nextWrongPromptLetters);
    setCompletedPromptLetters(nextCompletedPromptLetters);
    setPretestScore(nextScore);
    setTotalAttempts(newTotalAttempts);
    setFeedback(isCorrect ? `✓ Check! ${letter} is correct.` : `✗ Wrong! ${currentLetter} is incorrect.`);

    if (newTotalAttempts >= maxAttempts || !nextLetter) {
      const finishedDifficulty = difficulty;
      setCurrentPretestLetter(null);
      setHasListened(false);
      setTimeout(() => {
        setFeedback(`Pretest Complete! Score: ${nextScore}/${maxAttempts}`);
        setPretestResult({ difficulty: finishedDifficulty, score: nextScore, max: maxAttempts });
        setMode('result');

        // Notify parent of mode completion and update progress
        if (typeof onProgressUpdate === 'function') {
          onProgressUpdate(finishedDifficulty);
        }

        if (typeof onPretestComplete === 'function') {
          onPretestComplete(finishedDifficulty, nextScore, maxAttempts);
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

  const renderHero = ({ icon, kicker, title, subtitle, stat, color = 'blue' }) => (
    <header className={`ar-hero ar-${color}`}>
      <span className="ar-hero-icon" aria-hidden="true">{icon}</span>
      <div className="ar-hero-copy">
        <span className="ar-hero-kicker">{kicker}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {stat}
    </header>
  );

  const renderLearning = () => {
    const exploredPercent = Math.round((exploredLetters.length / letters.length) * 100);

    return (
      <>
        {renderHero({
          icon: '🔤',
          kicker: '🗺️ Letter Land',
          title: 'Learn the Alphabet',
          subtitle: 'Tap a letter to hear it and meet its friend!',
          stat: (
            <div className="ar-hero-stat">
              <strong key={exploredLetters.length} className="ar-pop">{exploredLetters.length}<small>/26</small></strong>
              <span>Letters explored</span>
              <div className="ar-meter"><div style={{ '--p': `${exploredPercent}%` }} /></div>
            </div>
          ),
        })}

        <section className="ar-stage">
          <button type="button" className="ar-arrow" onClick={() => goToRelativeLetter(-1)} aria-label="Previous letter">
            ‹
          </button>

          <div className="ar-cards">
            <div
              className="ar-letter-card"
              onClick={() => {
                setLetterTap((current) => current + 1);
                speakLetter();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setLetterTap((current) => current + 1);
                  speakLetter();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Read the letter ${selectedLetter.letter}`}
            >
              {letterTap > 0 ? <span key={letterTap} className="ar-ripple" aria-hidden="true" /> : null}
              <span key={selectedLetter.letter} className="ar-big-letter">
                {selectedLetter.letter}
                <small>{selectedLetter.letter.toLowerCase()}</small>
              </span>
              <span className="ar-tap-hint">🔊 Tap to hear</span>
            </div>

            <div
              className="ar-object-card"
              onClick={() => speakObjectWord()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  speakObjectWord();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Read the word ${selectedLetter.word}`}
            >
              <span key={`${selectedLetter.letter}-icon`} className="ar-object-icon" aria-hidden="true">
                {selectedLetter.icon}
              </span>
              <p key={`${selectedLetter.letter}-word`} className="ar-object-word">
                <b>{selectedLetter.word.charAt(0)}</b>{selectedLetter.word.slice(1)}
              </p>
              <span className="ar-tap-hint">🔊 Tap to hear the word</span>
            </div>
          </div>

          <button type="button" className="ar-arrow" onClick={() => goToRelativeLetter(1)} aria-label="Next letter">
            ›
          </button>
        </section>

        <div className="ar-toolbar">
          <p key={feedback} className="ar-feedback" aria-live="polite">{feedback}</p>
          <button
            type="button"
            className={`ar-btn ar-btn-mic ${showVoicePractice ? 'active' : ''}`}
            onClick={() => setShowVoicePractice(!showVoicePractice)}
            aria-expanded={showVoicePractice}
          >
            🎤 {showVoicePractice ? 'Hide Practice' : 'Practice Pronunciation'}
          </button>
        </div>

        {showVoicePractice && (
          <div className="ar-voice-panel">
            <VoicePractice
              targetWord={selectedLetter.letter}
              onResult={(result) => {
                if (result.success) {
                  setFeedback(`Great! You pronounced ${selectedLetter.letter} correctly!`);
                } else {
                  setFeedback(result.feedback);
                }
              }}
              showTranscript={true}
            />
          </div>
        )}

        <section className="ar-grid-panel">
          <div className="ar-grid-head">
            <h2>🧩 Pick a letter</h2>
            <span>✨ = already explored</span>
          </div>
          <div className="ar-letter-grid" aria-label="Alphabet choices">
            {letters.map((letter, index) => (
              <button
                key={letter}
                type="button"
                className={[
                  'ar-tile',
                  letter === selectedLetter.letter ? 'active' : '',
                  exploredLetters.includes(letter) ? 'explored' : '',
                ].join(' ')}
                style={{ '--i': index }}
                onClick={() => handlePick(letter)}
              >
                {letter}
              </button>
            ))}
          </div>
        </section>
      </>
    );
  };

  const renderPretest = () => {
    const info = difficultyInfo[difficulty] || difficultyInfo.easy;
    const maxAttempts = getMaxAttempts(difficulty);
    const isWaiting = !currentPretestLetter;

    return (
      <>
        {renderHero({
          icon: info.icon,
          kicker: `🎯 Pretest · ${info.range}`,
          title: `${info.label} Challenge`,
          subtitle: 'Listen to the letter, then tap the one you heard!',
          color: info.color,
          stat: (
            <div className="ar-hero-stat ar-score-stat">
              <strong key={pretestScore} className="ar-pop">⭐ {pretestScore}<small>/{maxAttempts}</small></strong>
              <span>Score</span>
              {lastAnswer ? (
                <span key={lastAnswer.id} className={`ar-float ${lastAnswer.correct ? 'good' : 'bad'}`} aria-hidden="true">
                  {lastAnswer.correct ? '+1 ⭐' : '✗'}
                </span>
              ) : null}
            </div>
          ),
        })}

        <div className="ar-attempts" aria-label={`Attempt ${Math.min(totalAttempts + 1, maxAttempts)} of ${maxAttempts}`}>
          {Array.from({ length: maxAttempts }).map((_, i) => {
            const result = attemptHistory[i];
            const state = result === true ? 'good' : result === false ? 'bad' : i === totalAttempts ? 'now' : '';
            return (
              <span key={i} className={`ar-attempt ${state}`}>
                {result === true ? '✓' : result === false ? '✗' : i + 1}
              </span>
            );
          })}
        </div>

        <section className={`ar-pretest-stage ar-${info.color}`}>
          <button
            type="button"
            className={`ar-listen ${hasListened ? 'listened' : 'waiting'}`}
            onClick={() => {
              if (!currentPretestLetter) {
                return;
              }

              setHasListened(true);
              playPretestAudio(currentPretestLetter);
            }}
            disabled={isWaiting}
          >
            <span className="ar-listen-wave w1" aria-hidden="true" />
            <span className="ar-listen-wave w2" aria-hidden="true" />
            <span className="ar-listen-icon" aria-hidden="true">🔊</span>
            <span className="ar-listen-label">{hasListened ? 'Listen again' : 'Tap to listen'}</span>
          </button>

          <p key={feedback} className={`ar-feedback ${feedback.startsWith('✓') ? 'good' : ''} ${feedback.startsWith('✗') ? 'bad' : ''}`} aria-live="polite">
            {feedback}
          </p>

          <div className={`ar-letter-grid ar-answer-grid ${hasListened ? '' : 'locked'}`} aria-label="Letter choices">
            {getDifficultyRange(difficulty).map((letter, index) => (
              <button
                key={letter}
                type="button"
                className={[
                  'ar-tile',
                  correctLetters.includes(letter) ? 'correct' : '',
                  wrongPromptLetters.includes(letter) ? 'wrong' : '',
                  lastAnswer && lastAnswer.letter === letter ? `just-${lastAnswer.correct ? 'correct' : 'wrong'}` : '',
                ].join(' ')}
                style={{ '--i': index }}
                onClick={() => handlePretestAnswer(letter)}
                disabled={!hasListened || completedPromptLetters.includes(letter)}
              >
                {letter}
              </button>
            ))}
            {!hasListened && !isWaiting ? <span className="ar-locked-hint">👂 Listen first!</span> : null}
          </div>
        </section>
      </>
    );
  };

  const renderResult = () => {
    const result = pretestResult || { difficulty, score: pretestScore, max: getMaxAttempts(difficulty) };
    const info = difficultyInfo[result.difficulty] || difficultyInfo.easy;
    const stars = getResultStars(result.score, result.max);
    const titles = ['Keep practicing!', 'Good try!', 'Great job!', 'Perfect score!'];
    const emojis = ['💪', '👍', '🎉', '🏆'];

    return (
      <section className={`ar-result ar-${info.color}`}>
        {stars >= 2 ? (
          <div className="ar-confetti" aria-hidden="true">
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

        <span className="ar-result-emoji" aria-hidden="true">{emojis[stars]}</span>
        <span className="ar-hero-kicker">{info.icon} {info.label} Challenge complete</span>
        <h1>{titles[stars]}</h1>

        <div className="ar-result-stars" aria-label={`${stars} of 3 stars`}>
          {[1, 2, 3].map((value) => (
            <span key={value} className={value <= stars ? 'earned' : ''} style={{ '--i': value }}>★</span>
          ))}
        </div>

        <p className="ar-result-score">
          You got <strong>{result.score}</strong> of <strong>{result.max}</strong> letters right
        </p>

        <div className="ar-attempts">
          {attemptHistory.map((correct, i) => (
            <span key={i} className={`ar-attempt ${correct ? 'good' : 'bad'}`}>{correct ? '✓' : '✗'}</span>
          ))}
        </div>

        <div className="ar-result-actions">
          <button type="button" className="ar-btn ar-btn-soft" onClick={() => onNavigate?.('alphabet', 'learning')}>
            🔤 Back to letters
          </button>
          <button type="button" className="ar-btn ar-btn-soft" onClick={() => resetPretestState(result.difficulty)}>
            ↻ Try again
          </button>
          {info.next ? (
            <button type="button" className="ar-btn" onClick={() => onNavigate?.('alphabet', info.next)}>
              {difficultyInfo[info.next].icon} Next: {difficultyInfo[info.next].label} ›
            </button>
          ) : null}
        </div>
      </section>
    );
  };

  const renderFryWords = () => {
    const heardPercent = Math.round((heardFryWords.length / totalFryWords) * 100);

    return (
      <>
        {renderHero({
          icon: '📖',
          kicker: '🗺️ Letter Land · Sight words',
          title: 'Fry Words – The First Hundred',
          subtitle: 'Tap a word to hear it. Can you read all 100?',
          color: 'purple',
          stat: (
            <div className="ar-hero-stat">
              <strong key={heardFryWords.length} className="ar-pop">{heardFryWords.length}<small>/{totalFryWords}</small></strong>
              <span>Words read</span>
              <div className="ar-meter"><div style={{ '--p': `${heardPercent}%` }} /></div>
            </div>
          ),
        })}

        <section className="ar-fry-grid">
          {fryWordColumns.map((column, columnIndex) => {
            const listHeard = column.filter((word, index) => heardFryWords.includes(`${columnIndex}-${index}`)).length;
            return (
              <div
                key={`fry-column-${columnIndex}`}
                className={`ar-fry-list ar-${fryListColors[columnIndex]}`}
                style={{ '--col': columnIndex }}
              >
                <div className="ar-fry-head">
                  <strong>List {columnIndex + 1}</strong>
                  <span>{listHeard === column.length ? '🏅 Done!' : `${listHeard}/${column.length}`}</span>
                </div>
                <ul className="ar-fry-words" aria-label={`Fry words list ${columnIndex + 1}`}>
                  {column.map((word, index) => {
                    const key = `${columnIndex}-${index}`;
                    const heard = heardFryWords.includes(key);
                    return (
                      <li key={key} style={{ '--i': index }}>
                        <button
                          type="button"
                          className={`ar-fry-word ${heard ? 'heard' : ''}`}
                          onClick={() => handleFryWord(key, word)}
                          aria-label={`Read the word ${word}`}
                        >
                          {word}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </section>
      </>
    );
  };

  return (
    <div className="ar-page">
      {isFryWordsView
        ? renderFryWords()
        : mode === 'result'
          ? renderResult()
          : mode === 'pretest'
            ? renderPretest()
            : renderLearning()}
    </div>
  );
}
