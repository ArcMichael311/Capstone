import { useEffect, useMemo, useRef, useState } from 'react';
import './VowelRush.css';
import { playSound } from '../../shared/gameSounds';
import SoundToggle from '../../shared/SoundToggle';
import { doubleVowelExamples } from '../DoubleVowelLesson/doubleVowelData';

const vowelLetters = new Set(['A', 'E', 'I', 'O', 'U']);
const vowelTeams = doubleVowelExamples.map(({ letters }) => letters.toUpperCase());
const letterPool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const laneCount = 6;
const maxHearts = 3;
const comboTarget = 5;
const burstAngles = [0, 45, 90, 135, 180, 225, 270, 315];

const difficultyModes = {
  beginner: {
    label: 'Beginner',
    icon: '🟢',
    description: '10 falling stars, 3 hearts, slow speed',
    totalStars: 10,
    fallDuration: 2600,
    gapDuration: 500,
    minSpeedFactor: 0.8,
    speedLevel: 1,
    goal: 'Catch 10 vowel stars',
  },
  intermediate: {
    label: 'Intermediate',
    icon: '🟡',
    description: '20 falling stars, 3 hearts, medium speed',
    totalStars: 20,
    fallDuration: 2000,
    gapDuration: 380,
    minSpeedFactor: 0.75,
    speedLevel: 2,
    goal: 'Catch 20 vowel stars',
  },
  endless: {
    label: 'Endless',
    icon: '🔴',
    description: 'Unlimited stars, 3 hearts, fast speed',
    totalStars: null,
    fallDuration: 1550,
    gapDuration: 250,
    minSpeedFactor: 0.6,
    speedLevel: 3,
    goal: 'Build the highest score possible',
  },
};

const confettiColors = ['#ffd84d', '#62d6ff', '#ff6b9a', '#7ef0a8', '#c08bff'];
const confettiPieces = Array.from({ length: 32 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 10) * 0.15,
  duration: 2.4 + (i % 4) * 0.4,
  color: confettiColors[i % confettiColors.length],
}));

const createRandomStar = (fallDuration) => {
  const isVowel = Math.random() < 0.55;
  const vowels = [...vowelLetters, ...vowelTeams];
  const consonants = letterPool.filter((letter) => !vowelLetters.has(letter));
  const letter = isVowel
    ? vowels[Math.floor(Math.random() * vowels.length)]
    : consonants[Math.floor(Math.random() * consonants.length)];

  return {
    id: `${letter}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    letter,
    isVowel,
    lane: Math.floor(Math.random() * laneCount),
    fallDuration,
  };
};

// Stars fall a little faster as the run goes on, down to the mode's minimum.
const getFallDuration = (mode, starNumber) => {
  const factor = Math.max(mode.minSpeedFactor, 1 - starNumber * 0.015);
  return Math.round(mode.fallDuration * factor);
};

const getPlayerFace = (hearts) => {
  if (hearts >= 3) return '😊';
  if (hearts === 2) return '😐';
  if (hearts === 1) return '😟';
  return '😭';
};

const moveBasket = (currentLane, direction) => {
  const nextLane = currentLane + direction;
  if (nextLane < 0) return 0;
  if (nextLane > laneCount - 1) return laneCount - 1;
  return nextLane;
};

const getStarRating = (score, vowelsSeen) => {
  if (vowelsSeen === 0) return 1;
  const accuracy = score / vowelsSeen;
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.6) return 2;
  return 1;
};

export default function VowelRush({ onClose }) {
  const [screen, setScreen] = useState('instructions');
  const [selectedDifficulty, setSelectedDifficulty] = useState('beginner');
  const [activeStar, setActiveStar] = useState(null);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(maxHearts);
  const [streak, setStreak] = useState(0);
  const [roundCount, setRoundCount] = useState(0);
  const [basketLane, setBasketLane] = useState(2);
  const [statusMessage, setStatusMessage] = useState('Read the rules, then start your run.');
  const [effectState, setEffectState] = useState('');
  const [comboFlash, setComboFlash] = useState(false);
  const [finalMessage, setFinalMessage] = useState('');
  const [isReadingInstructions, setIsReadingInstructions] = useState(false);

  // Animation state
  const [countdown, setCountdown] = useState(null);
  const [effects, setEffects] = useState([]);
  const [rocketTilt, setRocketTilt] = useState('');
  const [bossThrowId, setBossThrowId] = useState(0);
  const [combos, setCombos] = useState(0);
  const [vowelsSeen, setVowelsSeen] = useState(0);

  const starTimerRef = useRef(null);
  const effectTimerRef = useRef(null);
  const comboTimerRef = useRef(null);
  const fxTimersRef = useRef([]);
  const fxIdRef = useRef(0);
  const activeStarRef = useRef(null);
  const scoreRef = useRef(0);
  const heartsRef = useRef(maxHearts);
  const streakRef = useRef(0);
  const roundCountRef = useRef(0);
  const vowelsSeenRef = useRef(0);
  const basketLaneRef = useRef(2);
  const selectedDifficultyRef = useRef('beginner');

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsReadingInstructions(false);
  };

  const currentMode = useMemo(() => difficultyModes[selectedDifficulty], [selectedDifficulty]);
  const playerFace = getPlayerFace(hearts);
  const roundGoal = currentMode.totalStars === null ? '∞' : currentMode.totalStars;
  const instructionText = 'Welcome to Vowel Rush. Catch the vowel stars: A, E, I, O, U, and double vowel pairs like EE, OO, AI, OA, AY, AA, and II. Move the rocket with the left or right arrow keys, or the A and D keys. Catching a vowel or vowel pair gives one point. Catching a consonant removes one heart. Catch five vowel stars in a row to gain one heart.';

  const scheduleFx = (fn, ms) => {
    fxTimersRef.current.push(window.setTimeout(fn, ms));
  };

  const clearFxTimers = () => {
    fxTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    fxTimersRef.current = [];
  };

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

  useEffect(() => () => {
    clearTimers();
    clearFxTimers();
    stopSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tiltRocket = (direction) => {
    setRocketTilt(direction);
    scheduleFx(() => setRocketTilt(''), 180);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (screen !== 'game') {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') {
        event.preventDefault();
        tiltRocket('left');
        setBasketLane((currentLane) => {
          const nextLane = moveBasket(currentLane, -1);
          basketLaneRef.current = nextLane;
          return nextLane;
        });
      }

      if (key === 'arrowright' || key === 'd') {
        event.preventDefault();
        tiltRocket('right');
        setBasketLane((currentLane) => {
          const nextLane = moveBasket(currentLane, 1);
          basketLaneRef.current = nextLane;
          return nextLane;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const addEffect = (type, lane, text) => {
    fxIdRef.current += 1;
    const id = fxIdRef.current;
    setEffects((current) => [...current, { id, type, lane, text }]);
    scheduleFx(() => setEffects((current) => current.filter((effect) => effect.id !== id)), 900);
  };

  const resetRunState = () => {
    clearTimers();
    clearFxTimers();
    activeStarRef.current = null;
    scoreRef.current = 0;
    heartsRef.current = maxHearts;
    streakRef.current = 0;
    roundCountRef.current = 0;
    vowelsSeenRef.current = 0;
    basketLaneRef.current = 2;
    setActiveStar(null);
    setScore(0);
    setHearts(maxHearts);
    setStreak(0);
    setRoundCount(0);
    setBasketLane(2);
    setEffectState('');
    setComboFlash(false);
    setFinalMessage('');
    setCountdown(null);
    setEffects([]);
    setRocketTilt('');
    setCombos(0);
    setVowelsSeen(0);
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
    playSound(nextScreen === 'gameover' ? 'lose' : 'victory');
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

    const nextStar = createRandomStar(getFallDuration(mode, roundCountRef.current));
    activeStarRef.current = nextStar;
    setActiveStar(nextStar);
    setBossThrowId((current) => current + 1);

    if (nextStar.isVowel) {
      vowelsSeenRef.current += 1;
      setVowelsSeen(vowelsSeenRef.current);
    }

    roundCountRef.current += 1;
    setRoundCount(roundCountRef.current);
    setEffectState('');
    setStatusMessage('Move the rocket with ⬅️ ➡️, A, or D.');
  };

  const beginCountdown = () => {
    setCountdown(3);
    playSound('countdown');
    scheduleFx(() => { setCountdown(2); playSound('countdown'); }, 700);
    scheduleFx(() => { setCountdown(1); playSound('countdown'); }, 1400);
    scheduleFx(() => { setCountdown('GO!'); playSound('go'); }, 2100);
    scheduleFx(() => setCountdown(null), 2700);
    starTimerRef.current = window.setTimeout(spawnStar, 2500);
  };

  const startRun = () => {
    selectedDifficultyRef.current = selectedDifficulty;
    resetRunState();
    setScreen('game');
    setStatusMessage('Get ready...');
    beginCountdown();
  };

  const speakInstructions = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setStatusMessage('Speech is not available. Please ask for help reading the rules.');
      return;
    }

    if (isReadingInstructions) {
      stopSpeech();
      setStatusMessage('Stopped reading the Vowel Rush instructions.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(instructionText);
    utterance.rate = 0.8;
    utterance.onend = () => setIsReadingInstructions(false);
    utterance.onerror = () => setIsReadingInstructions(false);
    window.speechSynthesis.speak(utterance);
    setIsReadingInstructions(true);
    setStatusMessage('Reading the Vowel Rush instructions.');
  };

  const openDifficultyScreen = () => {
    setScreen('difficulty');
    setStatusMessage('Choose a difficulty mode to begin.');
  };

  const returnToMainMenu = () => {
    stopSpeech();
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
    setStatusMessage('Get ready...');
    beginCountdown();
  };

  const pulseEffect = (nextState) => {
    setEffectState(nextState);

    if (effectTimerRef.current) {
      window.clearTimeout(effectTimerRef.current);
    }

    effectTimerRef.current = window.setTimeout(() => {
      setEffectState('');
    }, 450);
  };

  const handleCombo = () => {
    setComboFlash(true);

    if (comboTimerRef.current) {
      window.clearTimeout(comboTimerRef.current);
    }

    comboTimerRef.current = window.setTimeout(() => {
      setComboFlash(false);
    }, 1200);
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
      addEffect('catch', star.lane, '+1');
      playSound('coin');

      if (nextStreak >= comboTarget) {
        const nextHearts = Math.min(heartsRef.current + 1, maxHearts);
        heartsRef.current = nextHearts;
        streakRef.current = 0;
        setHearts(nextHearts);
        setStreak(0);
        setCombos((current) => current + 1);
        setStatusMessage('🔥 COMBO x5  ❤️ +1 Heart');
        addEffect('heal', star.lane, '+1 ❤️');
        playSound('combo');
        handleCombo();
      }
    } else if (caught && basketMatches && !star.isVowel) {
      const nextHearts = heartsRef.current - 1;

      heartsRef.current = nextHearts;
      streakRef.current = 0;
      setHearts(nextHearts);
      setStreak(0);
      setStatusMessage(`💔 ${star.letter} is a consonant! -1 Heart`);
      pulseEffect('wrong');
      addEffect('hit', star.lane, '-1 ❤️');
      playSound('hurt');

      if (nextHearts <= 0) {
        clearTimers();
        scheduleFx(() => finishGame('gameover', '💀 GAME OVER 💀'), 700);
        return;
      }
    } else if (!caught && star.isVowel) {
      streakRef.current = 0;
      setStreak(0);
      setStatusMessage(`${star.letter} was a vowel — it slipped past!`);
      addEffect('miss', star.lane, 'MISS');
      playSound('whoosh');
    } else {
      streakRef.current = 0;
      setStreak(0);
      setStatusMessage('Nice dodge! That was a consonant.');
      addEffect('dodge', star.lane, 'DODGED');
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

  const renderTopbar = () => (
    <div className="rush-topbar">
      <div className="rush-brand">
        <span className="rush-brand-icon" aria-hidden="true">🚀</span>
        <div>
          <h1>Vowel Rush</h1>
          <span>Fast vowels, sharp eyes.</span>
        </div>
      </div>
      <div className="rush-topbar-actions">
        <SoundToggle />
        {typeof onClose === 'function' ? (
          <button
            type="button"
            className="rush-secondary-btn"
            onClick={() => {
              stopSpeech();
              clearTimers();
              clearFxTimers();
              onClose();
            }}
          >
            ← Return to Vowels
          </button>
        ) : null}
      </div>
    </div>
  );

  const renderMenuCard = () => (
    <section className="rush-card rush-panel rush-menu">
      <div className="rush-hero" aria-hidden="true">
        <span className="rush-hero-star s1">⭐</span>
        <span className="rush-hero-star s2">✨</span>
        <span className="rush-hero-star s3">⭐</span>
        <span className="rush-hero-alien">👽</span>
        <span className="rush-hero-rocket">🚀</span>
      </div>

      <div className="rush-panel-header">
        <p className="rush-eyebrow">How to play</p>
        <h2>Catch the vowel stars with your rocket!</h2>
      </div>

      <div className="rush-instructions-list" aria-label="Vowel Rush rules">
        <div className="rush-rule"><span>🎯</span>Catch the vowel stars: A, E, I, O, U</div>
        <div className="rush-rule"><span>✨</span>Double vowels count too: EE, OO, AI, OA, AY, AA, II</div>
        <div className="rush-rule"><span>🚀</span>Move the rocket with ⬅️ ➡️, A, or D</div>
        <div className="rush-rule"><span>⭐</span>Catching a vowel gives 1 point</div>
        <div className="rush-rule"><span>💔</span>Catching a consonant removes 1 heart</div>
        <div className="rush-rule"><span>🔥</span>Catch 5 vowels in a row to gain 1 heart</div>
      </div>

      <div className="rush-actions">
        <button type="button" className="rush-listen-btn" onClick={speakInstructions} aria-pressed={isReadingInstructions}>
          {isReadingInstructions ? '⏹ Stop Reading' : '🔊 Read Instructions Aloud'}
        </button>
        <button type="button" className="rush-primary-btn rush-pulse" onClick={openDifficultyScreen}>
          Start Game ▶
        </button>
      </div>
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
            <span className="rush-difficulty-icon" aria-hidden="true">{mode.icon}</span>
            <span className="rush-difficulty-name">{mode.label}</span>
            <span className="rush-difficulty-detail">{mode.description}</span>
            <span className="rush-speed-meter" aria-label={`Speed ${mode.speedLevel} of 3`}>
              {[1, 2, 3].map((level) => (
                <span key={level} className={level <= mode.speedLevel ? 'on' : ''} />
              ))}
            </span>
            <span className="rush-difficulty-goal">Goal: {mode.goal}</span>
          </button>
        ))}
      </div>

      <div className="rush-actions">
        <button type="button" className="rush-secondary-btn" onClick={returnToMainMenu}>
          Main Menu
        </button>
        <button type="button" className="rush-primary-btn rush-pulse" onClick={startRun}>
          Launch! 🚀
        </button>
      </div>
    </section>
  );

  const renderGameBoard = () => {
    const mode = difficultyModes[selectedDifficulty];
    // The background speeds up as the streak builds.
    const warpSpeed = Math.max(1.2, 6 - streak * 1.1);

    return (
      <section
        className={[
          'rush-game-shell',
          effectState ? `is-${effectState}` : '',
          comboFlash ? 'is-combo' : '',
          hearts === 1 ? 'is-danger' : '',
        ].join(' ')}
      >
        <div className="rush-hud">
          <div className="rush-hud-block">
            <span className="rush-hud-label">{mode.icon} {mode.label}</span>
            <strong>Star {roundCount}/{roundGoal}</strong>
          </div>

          <div className="rush-hud-block">
            <span className="rush-hud-label">Hearts</span>
            <div className="rush-hearts">
              {Array.from({ length: maxHearts }).map((_, i) => (
                <span key={i} className={`rush-heart ${i < hearts ? 'full' : 'empty'}`}>❤️</span>
              ))}
            </div>
          </div>

          <div className="rush-hud-block rush-hud-score">
            <span className="rush-hud-label">Score</span>
            <strong key={score} className="rush-score-value">⭐ {score}</strong>
          </div>

          <div className="rush-hud-block rush-hud-combo">
            <span className="rush-hud-label">Combo {streak >= 3 ? '🔥' : ''}</span>
            <div className="rush-combo-meter" aria-label={`Combo ${streak} of ${comboTarget}`}>
              {Array.from({ length: comboTarget }).map((_, i) => (
                <span key={i} className={i < streak ? 'on' : ''} />
              ))}
            </div>
          </div>

          <button type="button" className="rush-secondary-btn rush-hud-menu" onClick={returnToMainMenu}>
            Main Menu
          </button>
        </div>

        <div className="rush-board" style={{ '--rush-warp': `${warpSpeed}s` }}>
          <div className="rush-starfield far" aria-hidden="true" />
          <div className="rush-starfield near" aria-hidden="true" />

          <div className="rush-lanes" aria-hidden="true">
            {Array.from({ length: laneCount }).map((_, i) => (
              <span key={i} className={i === basketLane ? 'active' : ''} />
            ))}
          </div>

          <div className="rush-boss" aria-hidden="true">
            <span key={bossThrowId} className={`rush-boss-icon ${bossThrowId ? 'throw' : ''}`}>👽</span>
            <span className="rush-boss-label">BOSS</span>
          </div>

          {comboFlash ? <div className="rush-combo-banner">🔥 COMBO x5 · ❤️ +1 Heart</div> : null}

          {countdown !== null ? (
            <div key={countdown} className={`rush-countdown ${countdown === 'GO!' ? 'go' : ''}`} aria-live="assertive">
              {countdown}
            </div>
          ) : null}

          {activeStar ? (
            <div
              key={activeStar.id}
              className={`rush-star lane-${activeStar.lane}`}
              style={{ '--rush-fall-duration': `${activeStar.fallDuration}ms`, '--rush-lane': activeStar.lane }}
              role="button"
              tabIndex={0}
              aria-label={`Falling star ${activeStar.letter}`}
              onClick={() => handleStarCatch(activeStar)}
              onAnimationEnd={(event) => {
                if (event.target === event.currentTarget) {
                  handleStarMiss(activeStar);
                }
              }}
            >
              <span className="rush-star-trail" aria-hidden="true" />
              <span className="rush-star-orb">
                <span className="rush-star-letter">{activeStar.letter}</span>
              </span>
            </div>
          ) : null}

          {effects.map((effect) => (
            <div
              key={effect.id}
              className={`rush-fx ${effect.type}`}
              style={{ '--rush-lane': effect.lane }}
              aria-hidden="true"
            >
              {effect.type === 'catch' || effect.type === 'heal'
                ? burstAngles.map((angle) => (
                    <span key={angle} className="rush-particle" style={{ '--angle': `${angle}deg` }} />
                  ))
                : null}
              {effect.type === 'hit' ? <span className="rush-explosion">💥</span> : null}
              <span className="rush-fx-text">{effect.text}</span>
            </div>
          ))}

          <div
            className={`rush-basket ${rocketTilt ? `tilt-${rocketTilt}` : ''}`}
            style={{ '--rush-lane': basketLane }}
            aria-hidden="true"
          >
            <span className="rush-basket-icon">🚀</span>
            <span className="rush-flame" />
          </div>

          <div className="rush-ground">
            <div className="rush-avatar" aria-hidden="true">{playerFace}</div>
            <p key={statusMessage} className="rush-status">{statusMessage}</p>
          </div>
        </div>
      </section>
    );
  };

  const renderGameOverCard = () => (
    <section className="rush-card rush-final-card gameover">
      <div className="rush-final-emoji" aria-hidden="true">💀</div>
      <p className="rush-eyebrow">Game Over</p>
      <h2>The aliens got you!</h2>
      <div className="rush-final-stats">
        <div><span>Score</span><strong>⭐ {score}</strong></div>
        <div><span>Stars</span><strong>{roundCount}</strong></div>
        <div><span>Combos</span><strong>🔥 {combos}</strong></div>
      </div>
      <div className="rush-actions">
        <button type="button" className="rush-secondary-btn" onClick={returnToMainMenu}>
          Main Menu
        </button>
        <button type="button" className="rush-primary-btn rush-pulse" onClick={restartSameDifficulty}>
          Retry ↻
        </button>
      </div>
    </section>
  );

  const renderCompleteCard = () => {
    const rating = getStarRating(score, vowelsSeen);

    return (
      <section className="rush-card rush-final-card complete">
        <div className="rush-confetti" aria-hidden="true">
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
        <p className="rush-eyebrow">Run Complete</p>
        <div className="rush-rating" aria-label={`${rating} out of 3 stars`}>
          {[1, 2, 3].map((value) => (
            <span key={value} className={value <= rating ? 'earned' : ''} style={{ animationDelay: `${value * 0.25}s` }}>
              ⭐
            </span>
          ))}
        </div>
        <h2>{rating === 3 ? 'Superstar!' : rating === 2 ? 'Great run!' : 'Nice try!'}</h2>
        <div className="rush-final-stats">
          <div><span>Score</span><strong>⭐ {score}</strong></div>
          <div><span>Hearts left</span><strong>❤️ {hearts}</strong></div>
          <div><span>Combos</span><strong>🔥 {combos}</strong></div>
        </div>
        <div className="rush-actions">
          <button type="button" className="rush-secondary-btn" onClick={returnToMainMenu}>
            Main Menu
          </button>
          <button type="button" className="rush-primary-btn rush-pulse" onClick={restartSameDifficulty}>
            Play Again ↻
          </button>
        </div>
      </section>
    );
  };

  return (
    <div className="vowel-rush-overlay" aria-label="Vowel Rush game">
      <div className="vowel-rush-shell">
        {renderTopbar()}

        {screen === 'instructions' ? renderMenuCard() : null}
        {screen === 'difficulty' ? renderDifficultyCard() : null}
        {screen === 'game' ? renderGameBoard() : null}
        {screen === 'gameover' ? renderGameOverCard() : null}
        {screen === 'complete' ? renderCompleteCard() : null}

        {screen !== 'game' ? <p className="rush-footer-note">{finalMessage || statusMessage}</p> : null}
      </div>
    </div>
  );
}
