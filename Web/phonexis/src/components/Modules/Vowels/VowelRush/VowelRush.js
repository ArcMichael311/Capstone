import { useEffect, useMemo, useRef, useState } from 'react';
import './VowelRush.css';

const vowelLetters = new Set(['A', 'E', 'I', 'O', 'U']);
const letterPool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const laneCount = 6;

const difficultyModes = {
  beginner: {
    label: 'Beginner',
    description: '10 falling stars, 3 hearts, slow speed',
    totalStars: 10,
    fallDuration: 2600,
    gapDuration: 500,
    goal: 'Catch 10 vowel stars',
  },
  intermediate: {
    label: 'Intermediate',
    description: '20 falling stars, 3 hearts, medium speed',
    totalStars: 20,
    fallDuration: 2000,
    gapDuration: 380,
    goal: 'Catch 20 vowel stars',
  },
  endless: {
    label: 'Endless',
    description: 'Unlimited stars, 3 hearts, fast speed',
    totalStars: null,
    fallDuration: 1550,
    gapDuration: 250,
    goal: 'Build the highest score possible',
  },
};

const createRandomStar = () => {
  const isVowel = Math.random() < 0.55;
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  const consonants = letterPool.filter((letter) => !vowelLetters.has(letter));
  const letter = isVowel
    ? vowels[Math.floor(Math.random() * vowels.length)]
    : consonants[Math.floor(Math.random() * consonants.length)];

  return {
    id: `${letter}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    letter,
    isVowel,
    lane: Math.floor(Math.random() * laneCount),
  };
};

const getPlayerFace = (hearts) => {
  if (hearts >= 3) return '😊';
  if (hearts === 2) return '😐';
  if (hearts === 1) return '😟';
  return '😭';
};

const playTone = (frequency, duration = 120, waveType = 'sine') => {
  if (typeof window === 'undefined') {
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = waveType;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = 0.05;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();

  window.setTimeout(() => {
    oscillator.stop();
    audioContext.close();
  }, duration);
};

const moveBasket = (currentLane, direction) => {
  const nextLane = currentLane + direction;
  if (nextLane < 0) return 0;
  if (nextLane > laneCount - 1) return laneCount - 1;
  return nextLane;
};

export default function VowelRush({ onClose }) {
  const [screen, setScreen] = useState('instructions');
  const [selectedDifficulty, setSelectedDifficulty] = useState('beginner');
  const [activeStar, setActiveStar] = useState(null);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [streak, setStreak] = useState(0);
  const [roundCount, setRoundCount] = useState(0);
  const [basketLane, setBasketLane] = useState(2);
  const [statusMessage, setStatusMessage] = useState('Read the rules, then start your run.');
  const [effectState, setEffectState] = useState('');
  const [comboFlash, setComboFlash] = useState(false);
  const [finalMessage, setFinalMessage] = useState('');

  const starTimerRef = useRef(null);
  const effectTimerRef = useRef(null);
  const comboTimerRef = useRef(null);
  const activeStarRef = useRef(null);
  const scoreRef = useRef(0);
  const heartsRef = useRef(3);
  const streakRef = useRef(0);
  const roundCountRef = useRef(0);
  const basketLaneRef = useRef(2);
  const selectedDifficultyRef = useRef('beginner');

  const currentMode = useMemo(() => difficultyModes[selectedDifficulty], [selectedDifficulty]);
  const playerFace = getPlayerFace(hearts);
  const heartsDisplay = '❤️'.repeat(Math.max(0, hearts));
  const roundGoal = currentMode.totalStars === null ? '∞' : currentMode.totalStars;

  const clearTimers = () => {
    if (starTimerRef.current) {
      window.clearTimeout(starTimerRef.current);
      starTimerRef.current = null;
    }

    if (effectTimerRef.current) {
      window.clearTimeout(effectTimerRef.current);
      effectTimerRef.current = null;
    }

    if (comboTimerRef.current) {
      window.clearTimeout(comboTimerRef.current);
      comboTimerRef.current = null;
    }
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (screen !== 'game') {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') {
        event.preventDefault();
        setBasketLane((currentLane) => {
          const nextLane = moveBasket(currentLane, -1);
          basketLaneRef.current = nextLane;
          return nextLane;
        });
      }

      if (key === 'arrowright' || key === 'd') {
        event.preventDefault();
        setBasketLane((currentLane) => {
          const nextLane = moveBasket(currentLane, 1);
          basketLaneRef.current = nextLane;
          return nextLane;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen]);

  const resetRunState = () => {
    clearTimers();
    activeStarRef.current = null;
    scoreRef.current = 0;
    heartsRef.current = 3;
    streakRef.current = 0;
    roundCountRef.current = 0;
    basketLaneRef.current = 2;
    setActiveStar(null);
    setScore(0);
    setHearts(3);
    setStreak(0);
    setRoundCount(0);
    setBasketLane(2);
    setEffectState('');
    setComboFlash(false);
    setFinalMessage('');
  };

  const finishGame = (nextScreen, message) => {
    clearTimers();
    activeStarRef.current = null;
    setActiveStar(null);
    setFinalMessage(message);
    setStatusMessage(message);
    setEffectState('');
    setComboFlash(false);
    setScreen(nextScreen);
  };

  const scheduleNextStar = () => {
    const mode = difficultyModes[selectedDifficultyRef.current];

    if (mode.totalStars !== null && roundCountRef.current >= mode.totalStars) {
      finishGame('complete', `Finished with ${scoreRef.current} points.`);
      return;
    }

    starTimerRef.current = window.setTimeout(() => {
      spawnStar();
    }, mode.gapDuration);
  };

  const spawnStar = () => {
    const mode = difficultyModes[selectedDifficultyRef.current];

    if (heartsRef.current <= 0) {
      finishGame('gameover', '💀 GAME OVER 💀');
      return;
    }

    if (mode.totalStars !== null && roundCountRef.current >= mode.totalStars) {
      finishGame('complete', `Finished with ${scoreRef.current} points.`);
      return;
    }

    const nextStar = createRandomStar();
    activeStarRef.current = nextStar;
    setActiveStar(nextStar);

    roundCountRef.current += 1;
    setRoundCount(roundCountRef.current);
    setEffectState('');
    setStatusMessage('Move the rocket with ➡️, ⬅️, A, or D.');
  };

  const startRun = () => {
    selectedDifficultyRef.current = selectedDifficulty;
    resetRunState();
    setScreen('game');
    setStatusMessage('Move the rocket with ➡️, ⬅️, A, or D.');
    starTimerRef.current = window.setTimeout(spawnStar, 300);
  };

  const openDifficultyScreen = () => {
    setScreen('difficulty');
    setStatusMessage('Choose a difficulty mode to begin.');
  };

  const returnToMainMenu = () => {
    resetRunState();
    setSelectedDifficulty('beginner');
    selectedDifficultyRef.current = 'beginner';
    setScreen('instructions');
    setStatusMessage('Read the rules, then start your run.');
  };

  const restartSameDifficulty = () => {
    selectedDifficultyRef.current = selectedDifficulty;
    resetRunState();
    setScreen('game');
    setStatusMessage('Move the rocket with ➡️, ⬅️, A, or D.');
    starTimerRef.current = window.setTimeout(spawnStar, 300);
  };

  const pulseEffect = (nextState) => {
    setEffectState(nextState);

    if (effectTimerRef.current) {
      window.clearTimeout(effectTimerRef.current);
    }

    effectTimerRef.current = window.setTimeout(() => {
      setEffectState('');
    }, 350);
  };

  const handleCombo = () => {
    setComboFlash(true);

    if (comboTimerRef.current) {
      window.clearTimeout(comboTimerRef.current);
    }

    comboTimerRef.current = window.setTimeout(() => {
      setComboFlash(false);
    }, 700);
  };

  const resolveStar = (star, caught) => {
    if (!activeStarRef.current || activeStarRef.current.id !== star.id) {
      return;
    }

    activeStarRef.current = null;
    setActiveStar(null);
    clearTimers();

    const basketMatches = basketLaneRef.current === star.lane;

    if (caught && basketMatches && star.isVowel) {
      const nextScore = scoreRef.current + 1;
      const nextStreak = streakRef.current + 1;

      scoreRef.current = nextScore;
      streakRef.current = nextStreak;
      setScore(nextScore);
      setStreak(nextStreak);
      setStatusMessage('⭐ +1 Point');
      pulseEffect('correct');
      playTone(880, 120, 'sine');

      if (nextStreak >= 5) {
        const nextHearts = Math.min(heartsRef.current + 1, 3);
        heartsRef.current = nextHearts;
        streakRef.current = 0;
        setHearts(nextHearts);
        setStreak(0);
        setStatusMessage('🔥 COMBO x5  ❤️ +1 Heart');
        handleCombo();
        playTone(1040, 150, 'triangle');
      }
    } else if (caught && basketMatches && !star.isVowel) {
      const nextHearts = heartsRef.current - 1;

      heartsRef.current = nextHearts;
      streakRef.current = 0;
      setHearts(nextHearts);
      setStreak(0);
      setStatusMessage('💔 -1 Heart');
      pulseEffect('wrong');
      playTone(190, 160, 'sawtooth');

      if (nextHearts <= 0) {
        finishGame('gameover', '💀 GAME OVER 💀');
        return;
      }
    } else if (!caught && star.isVowel) {
      streakRef.current = 0;
      setStreak(0);
      setStatusMessage('A vowel star slipped past.');
    } else {
      streakRef.current = 0;
      setStreak(0);
      setStatusMessage('A consonant star passed by.');
    }

    scheduleNextStar();
  };

  const handleStarMiss = (star) => {
    if (!activeStarRef.current || activeStarRef.current.id !== star.id) {
      return;
    }

    // If the basket is in the same lane when the star reaches the ground,
    // treat that as a catch. Otherwise it's a miss.
    const basketMatches = basketLaneRef.current === star.lane;
    resolveStar(star, basketMatches);
  };

  const handleStarCatch = (star) => {
    resolveStar(star, true);
  };

  const renderMenuCard = () => (
    <section className="rush-card rush-panel">
      <div className="rush-panel-header">
        <p className="rush-eyebrow">Vowel Rush</p>
        <h2>Catch the vowel stars with your rocket.</h2>
        <p>
          Use the rocket to catch the falling vowel stars while the pretest stays open on the left.
        </p>
      </div>

      <div className="rush-instructions-list" aria-label="Vowel Rush rules">
        <div className="rush-rule">🎯 Catch the vowel stars: A, E, I, O, U.</div>
        <div className="rush-rule">🚀 Move the rocket with ➡️, ⬅️, A, or D.</div>
        <div className="rush-rule">⭐ Catching a vowel gives 1 point.</div>
        <div className="rush-rule">💔 Catching a consonant removes 1 heart.</div>
        <div className="rush-rule">🔥 Catch 5 vowels in a row to gain 1 heart.</div>
      </div>

      <button type="button" className="rush-primary-btn" onClick={openDifficultyScreen}>
        Start Game
      </button>
    </section>
  );

  const renderDifficultyCard = () => (
    <section className="rush-card rush-panel">
      <div className="rush-panel-header">
        <p className="rush-eyebrow">Select Difficulty</p>
        <h2>Choose your pace.</h2>
        <p>Beginner is slower, Intermediate is tighter, and Endless keeps going until your hearts are gone.</p>
      </div>

      <div className="rush-difficulty-grid" role="radiogroup" aria-label="Vowel Rush difficulty">
        {Object.entries(difficultyModes).map(([key, mode]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selectedDifficulty === key}
            className={selectedDifficulty === key ? 'rush-difficulty-card active' : 'rush-difficulty-card'}
            onClick={() => setSelectedDifficulty(key)}
          >
            <span className="rush-difficulty-name">{mode.label}</span>
            <span className="rush-difficulty-detail">{mode.description}</span>
            <span className="rush-difficulty-goal">Goal: {mode.goal}</span>
          </button>
        ))}
      </div>

      <div className="rush-actions">
        <button type="button" className="rush-secondary-btn" onClick={returnToMainMenu}>
          Main Menu
        </button>
        <button type="button" className="rush-primary-btn" onClick={startRun}>
          Start Game
        </button>
      </div>
    </section>
  );

  const renderGameBoard = () => {
    const mode = difficultyModes[selectedDifficulty];

    return (
      <section className={`rush-game-shell ${effectState ? `is-${effectState}` : ''} ${comboFlash ? 'is-combo' : ''}`}>
        <div className="rush-game-header">
          <div>
            <p className="rush-eyebrow">{mode.label} Mode</p>
            <h2>Vowel Rush</h2>
          </div>
          <button type="button" className="rush-secondary-btn" onClick={returnToMainMenu}>
            Main Menu
          </button>
        </div>

        <div className="rush-status-bar">
          <div className="rush-status-chip">
            <span>Player</span>
            <strong>{playerFace}</strong>
          </div>
          <div className="rush-status-chip">
            <span>HP</span>
            <strong>{heartsDisplay || '0'}</strong>
          </div>
          <div className="rush-status-chip">
            <span>Score</span>
            <strong>{score}</strong>
          </div>
          <div className="rush-status-chip">
            <span>Streak</span>
            <strong>{streak}</strong>
          </div>
          <div className="rush-status-chip">
            <span>Round</span>
            <strong>{roundCount}/{roundGoal}</strong>
          </div>
        </div>

        <div className="rush-board" aria-live="polite">
          <div className="rush-boss" aria-hidden="true">
            <span className="rush-boss-icon">👽</span>
            <span className="rush-boss-label">BOSS</span>
          </div>

          {comboFlash ? <div className="rush-combo-banner">🔥 COMBO x5  ❤️ +1 Heart</div> : null}

          {activeStar ? (
            <div
              className={`rush-star ${activeStar.isVowel ? 'vowel' : 'consonant'} lane-${activeStar.lane} ${effectState}`}
              style={{ '--rush-fall-duration': `${mode.fallDuration}ms`, '--rush-lane': activeStar.lane }}
              role="button"
              tabIndex={0}
              onClick={() => handleStarCatch(activeStar)}
              onAnimationEnd={() => handleStarMiss(activeStar)}
            >
              <span className="rush-star-icon" aria-hidden="true">🔥</span>
              <span className="rush-star-content">
                <span className="rush-star-letter">{activeStar.letter}</span>
              </span>
            </div>
          ) : (
            <div className="rush-letter-placeholder">
              <span>Waiting for the next star...</span>
            </div>
          )}

          <div className={`rush-basket lane-${basketLane}`} style={{ '--rush-lane': basketLane }} aria-hidden="true">
            <span className="rush-basket-icon">🚀</span>
          </div>

          <div className="rush-ground">
            <div className="rush-avatar" aria-hidden="true">
              {playerFace}
            </div>
            <p>{statusMessage}</p>
          </div>
        </div>
      </section>
    );
  };

  const renderGameOverCard = () => (
    <section className="rush-card rush-final-card gameover">
      <p className="rush-eyebrow">Game Over</p>
      <h2>💀 GAME OVER 💀</h2>
      <p>You finished with {score} points.</p>
      <div className="rush-actions">
        <button type="button" className="rush-secondary-btn" onClick={restartSameDifficulty}>
          Retry
        </button>
        <button type="button" className="rush-primary-btn" onClick={returnToMainMenu}>
          Main Menu
        </button>
      </div>
    </section>
  );

  const renderCompleteCard = () => (
    <section className="rush-card rush-final-card complete">
      <p className="rush-eyebrow">Run Complete</p>
      <h2>Great run.</h2>
      <p>You finished with {score} points and {hearts} heart{hearts === 1 ? '' : 's'} remaining.</p>
      <div className="rush-actions">
        <button type="button" className="rush-secondary-btn" onClick={restartSameDifficulty}>
          Retry
        </button>
        <button type="button" className="rush-primary-btn" onClick={returnToMainMenu}>
          Main Menu
        </button>
      </div>
    </section>
  );

  return (
    <div className="vowel-rush-overlay" role="dialog" aria-modal="true" aria-label="Vowel Rush game">
      <div className="vowel-rush-shell">
        <div className="rush-topbar">
          <span className="rush-topbar-note">Fast vowels, sharp eyes.</span>
          {typeof onClose === 'function' ? (
            <button type="button" className="rush-secondary-btn" onClick={onClose}>
              ← Return to Vowels
            </button>
          ) : null}
        </div>

        {screen === 'instructions' ? renderMenuCard() : null}
        {screen === 'difficulty' ? renderDifficultyCard() : null}
        {screen === 'game' ? renderGameBoard() : null}
        {screen === 'gameover' ? renderGameOverCard() : null}
        {screen === 'complete' ? renderCompleteCard() : null}

        <p className="rush-footer-note">{finalMessage || statusMessage}</p>
      </div>
    </div>
  );
}