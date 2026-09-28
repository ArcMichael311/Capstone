import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './AlphaQuest.css';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const LETTER_HINTS = {
  A: { objectName: 'Apple', icon: '🍎' },
  B: { objectName: 'Ball', icon: '⚽' },
  C: { objectName: 'Cat', icon: '🐱' },
  D: { objectName: 'Dog', icon: '🐶' },
  E: { objectName: 'Egg', icon: '🥚' },
  F: { objectName: 'Fish', icon: '🐟' },
  G: { objectName: 'Grapes', icon: '🍇' },
  H: { objectName: 'Hat', icon: '🎩' },
  I: { objectName: 'Ice Cream', icon: '🍦' },
  J: { objectName: 'Jam', icon: '🍓' },
  K: { objectName: 'Kite', icon: '🪁' },
  L: { objectName: 'Lion', icon: '🦁' },
  M: { objectName: 'Moon', icon: '🌙' },
  N: { objectName: 'Nest', icon: '🪺' },
  O: { objectName: 'Orange', icon: '🍊' },
  P: { objectName: 'Pizza', icon: '🍕' },
  Q: { objectName: 'Queen', icon: '👑' },
  R: { objectName: 'Robot', icon: '🤖' },
  S: { objectName: 'Sun', icon: '☀️' },
  T: { objectName: 'Tree', icon: '🌳' },
  U: { objectName: 'Umbrella', icon: '☂️' },
  V: { objectName: 'Violin', icon: '🎻' },
  W: { objectName: 'Whale', icon: '🐋' },
  X: { objectName: 'Xylophone', icon: '🎼' },
  Y: { objectName: 'Yarn', icon: '🧶' },
  Z: { objectName: 'Zebra', icon: '🦓' },
};

const CONFETTI_COLORS = ['#FF6B6B', '#FFD700', '#4D96FF', '#6EE7B7', '#F59E0B', '#C084FC'];
const CONFETTI_PIECES = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 12) * 0.12,
  duration: 2.2 + (i % 5) * 0.35,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}));

const BOSS_DEFEAT_DELAY = 900;
const PLAYER_DEFEAT_DELAY = 900;

const DIFFICULTY_MODES = {
  beginner: {
    rounds: 3,
    maxHealth: 4,
    emojis: ['👾', '🐙', '🦞', '🐟', '🥶', '🐡', '🐊'],
    name: 'Beginner',
  },
  intermediate: {
    rounds: 4,
    maxHealth: 4,
    emojis: ['🐒', '🦍', '🦁', '🐯', '🐉', '🦕', '🦈'],
    name: 'Intermediate',
  },
  endless: {
    rounds: Infinity,
    maxHealth: 4,
    emojis: ['😈', '👹', '😤', '🤡', '👺', '👻'],
    name: 'Endless',
  },
};

export default function AlphaQuest({ onClose }) {
  const [gameState, setGameState] = useState('menu'); // menu, playing, reward, gameOver, victory
  const [difficulty, setDifficulty] = useState(null);
  const [round, setRound] = useState(1);
  const [currentLetter, setCurrentLetter] = useState(null);
  const [currentBoss, setCurrentBoss] = useState(null);
  const [playerHealth, setPlayerHealth] = useState(null);
  const [maxPlayerHealth, setMaxPlayerHealth] = useState(null);
  const [bossHealth, setBossHealth] = useState(null);
  const [maxBossHealth, setMaxBossHealth] = useState(null);
  const [hintCount, setHintCount] = useState(0);
  const [revealedHint, setRevealedHint] = useState(null);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [totalRounds, setTotalRounds] = useState(null);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [rewardMessage, setRewardMessage] = useState('');
  const [score, setScore] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Animation state
  const [bossAnim, setBossAnim] = useState({ type: 'enter', id: 0 });
  const [playerAnim, setPlayerAnim] = useState({ type: '', id: 0 });
  const [floaters, setFloaters] = useState([]);
  const [attack, setAttack] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [pressedKey, setPressedKey] = useState(null);
  const [roundBanner, setRoundBanner] = useState(null);
  const animIdRef = useRef(0);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const schedule = useCallback((fn, ms) => {
    timeoutsRef.current.push(setTimeout(fn, ms));
  }, []);

  const nextAnimId = useCallback(() => {
    animIdRef.current += 1;
    return animIdRef.current;
  }, []);

  const playBossAnim = useCallback((type) => setBossAnim({ type, id: nextAnimId() }), [nextAnimId]);
  const playPlayerAnim = useCallback((type) => setPlayerAnim({ type, id: nextAnimId() }), [nextAnimId]);

  const addFloater = useCallback(
    (text, side, kind) => {
      const id = nextAnimId();
      setFloaters((current) => [...current, { id, text, side, kind }]);
      schedule(() => setFloaters((current) => current.filter((floater) => floater.id !== id)), 1100);
    },
    [nextAnimId, schedule]
  );

  const launchAttack = useCallback(
    (direction) => {
      const id = nextAnimId();
      setAttack({ id, direction });
      schedule(() => setAttack((current) => (current && current.id === id ? null : current)), 550);
    },
    [nextAnimId, schedule]
  );

  const flashKey = useCallback(
    (letter, correct) => {
      const id = nextAnimId();
      setPressedKey({ id, letter, correct });
      schedule(() => setPressedKey((current) => (current && current.id === id ? null : current)), 450);
    },
    [nextAnimId, schedule]
  );

  const shakeBattle = useCallback(() => {
    setIsShaking(true);
    schedule(() => setIsShaking(false), 450);
  }, [schedule]);

  const showRoundBanner = useCallback(
    (text) => {
      const id = nextAnimId();
      setRoundBanner({ id, text });
      schedule(() => setRoundBanner((current) => (current && current.id === id ? null : current)), 1400);
    },
    [nextAnimId, schedule]
  );

  // Get random emoji for boss
  const getRandomBossEmoji = useCallback((emojis) => {
    return emojis[Math.floor(Math.random() * emojis.length)];
  }, []);

  // Get random letter
  const getRandomLetter = useCallback(() => {
    return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }, []);

  // Speak the letter pronunciation
  const speakLetter = useCallback((letter) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(letter);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Get player emoji based on health
  const getPlayerEmoji = useCallback(() => {
    if (playerHealth === null) return '🤓';
    if (playerHealth === maxPlayerHealth) return '🤓';
    if (playerHealth === maxPlayerHealth - 1) return '😐';
    if (playerHealth === 1) return '🤕';
    if (playerHealth <= 0) return '😵';
    return '🤓';
  }, [playerHealth, maxPlayerHealth]);

  const getCurrentHint = useCallback((letter) => {
    if (!letter) return null;
    return LETTER_HINTS[letter] || null;
  }, []);

  const showRewardScreen = useCallback(() => {
    setGameState('reward');
    setRewardMessage('You defeated the boss! Choose a reward.');
    setRewardClaimed(false);
    setRevealedHint(null);
  }, []);

  const showVictoryScreen = useCallback(
    (finalScore) => {
      setGameState('victory');
      setGameOverMessage(`🎉 Victory! You defeated all ${totalRounds} bosses!\nFinal Score: ${finalScore}`);
    },
    [totalRounds]
  );

  const advanceToNextRound = useCallback(() => {
    if (round >= totalRounds) {
      schedule(() => showVictoryScreen(score), 900);
      return;
    }

    schedule(() => {
      setGameState('playing');
      setRound((currentRound) => currentRound + 1);
      setBossHealth(DIFFICULTY_MODES[difficulty].maxHealth);
      const newLetter = getRandomLetter();
      const newBoss = getRandomBossEmoji(DIFFICULTY_MODES[difficulty].emojis);
      setCurrentLetter(newLetter);
      setCurrentBoss(newBoss);
      setFeedback('Next boss incoming! Listen to the letter!');
      setRevealedHint(null);
      playBossAnim('enter');
      showRoundBanner(`Round ${round + 1}`);
      speakLetter(newLetter);
    }, 900);
  }, [difficulty, getRandomBossEmoji, getRandomLetter, playBossAnim, round, schedule, score, showRoundBanner, showVictoryScreen, speakLetter, totalRounds]);

  const handleRewardChoice = useCallback(
    (rewardType) => {
      if (rewardClaimed) return;

      if (rewardType === 'health') {
        if (playerHealth >= maxPlayerHealth) {
          setRewardMessage('You still have full health. Choose hints instead.');
          return;
        }

        setRewardClaimed('health');
        setPlayerHealth((currentHealth) => Math.min(currentHealth + 1, maxPlayerHealth));
        setRewardMessage('You gained 1 heart.');
        playPlayerAnim('heal');
        advanceToNextRound();
        return;
      }

      if (rewardType === 'hints') {
        setRewardClaimed('hints');
        setHintCount((currentHintCount) => currentHintCount + 2);
        setRewardMessage('You gained 2 hints.');
        advanceToNextRound();
      }
    },
    [advanceToNextRound, maxPlayerHealth, playPlayerAnim, playerHealth, rewardClaimed]
  );

  const handleUseHint = useCallback(() => {
    if (!currentLetter || hintCount <= 0) return;

    const hint = getCurrentHint(currentLetter);
    setHintCount((currentHintCount) => Math.max(currentHintCount - 1, 0));
    setRevealedHint(hint);
    setFeedback(hint ? '💡 Hint revealed!' : 'Hint clue is unavailable for this letter.');
  }, [currentLetter, getCurrentHint, hintCount]);

  // Initialize game
  const startGame = (selectedDifficulty) => {
    const mode = DIFFICULTY_MODES[selectedDifficulty];
    setDifficulty(selectedDifficulty);
    setGameState('playing');
    setRound(1);
    setTotalRounds(mode.rounds);
    setPlayerHealth(mode.maxHealth);
    setMaxPlayerHealth(mode.maxHealth);
    setBossHealth(mode.maxHealth);
    setMaxBossHealth(mode.maxHealth);
    setHintCount(0);
    setRevealedHint(null);
    setStreak(0);
    setScore(0);
    setFeedback('Listen to the letter pronunciation and type the correct letter!');
    setRewardMessage('');
    setRewardClaimed(false);
    setIsLocked(false);
    setFloaters([]);
    setAttack(null);
    setPressedKey(null);
    playPlayerAnim('');
    playBossAnim('enter');
    showRoundBanner('Round 1');

    const letter = getRandomLetter();
    const boss = getRandomBossEmoji(mode.emojis);
    setCurrentLetter(letter);
    setCurrentBoss(boss);

    // Speak the letter
    setTimeout(() => {
      speakLetter(letter);
    }, 500);
  };

  const returnToMenu = () => {
    setIsLocked(false);
    setGameState('menu');
    setDifficulty(null);
    setCurrentLetter(null);
    setCurrentBoss(null);
    setRewardMessage('');
  };

  // Handle keyboard input
  const handleLetterPress = useCallback(
    (letter) => {
      if (gameState !== 'playing' || isLocked || !currentLetter || !currentBoss) return;

      const upperLetter = letter.toUpperCase();

      if (upperLetter === currentLetter) {
        // Correct answer - player attacks the boss
        const newBossHealth = bossHealth - 1;
        const newStreak = streak + 1;
        flashKey(upperLetter, true);
        launchAttack('to-boss');
        addFloater('-1', 'boss', 'damage');
        if (newStreak >= 2) {
          addFloater(`${newStreak}x Combo!`, 'player', 'combo');
        }

        if (newBossHealth <= 0) {
          // Boss defeated, move to next round
          const newScore = score + 10 + streak;
          setBossHealth(0);
          setScore(newScore);
          setIsLocked(true);
          playBossAnim('defeated');
          addFloater(`+${10 + streak}`, 'boss', 'score');

          if (newStreak % 3 === 0 && (difficulty === 'intermediate' || difficulty === 'endless')) {
            // Bonus heart for 3-streak
            const bonusHealth = Math.min(playerHealth + 1, maxPlayerHealth);
            setPlayerHealth(bonusHealth);
            playPlayerAnim('heal');
            addFloater('+1 ❤️', 'player', 'heal');
          }

          setFeedback('💥 You defeated the boss!');

          setStreak(0);
          schedule(() => {
            setIsLocked(false);
            if (round >= totalRounds) {
              showVictoryScreen(newScore);
            } else {
              showRewardScreen();
            }
          }, BOSS_DEFEAT_DELAY);
        } else {
          // Boss still alive
          setBossHealth(newBossHealth);
          setStreak(newStreak);
          playBossAnim('hit');
          setFeedback(`✓ Correct! Boss took damage!`);
          const newLetter = getRandomLetter();
          setCurrentLetter(newLetter);
          speakLetter(newLetter);
        }
      } else {
        // Wrong answer - boss attacks the player
        const newPlayerHealth = playerHealth - 1;
        setPlayerHealth(newPlayerHealth);
        setStreak(0);
        flashKey(upperLetter, false);
        launchAttack('to-player');
        addFloater('-1', 'player', 'damage');
        shakeBattle();

        if (newPlayerHealth <= 0) {
          // Game over
          setIsLocked(true);
          playPlayerAnim('defeated');
          setFeedback(`✗ Oh no! You ran out of hearts!`);
          schedule(() => {
            setIsLocked(false);
            setGameState('gameOver');
            setGameOverMessage('You Died');
          }, PLAYER_DEFEAT_DELAY);
        } else {
          playPlayerAnim('hit');
          playBossAnim('attack');
          setFeedback(`✗ Wrong! You took damage!`);
          const newLetter = getRandomLetter();
          setCurrentLetter(newLetter);
        }
      }
    },
    [gameState, isLocked, currentLetter, currentBoss, bossHealth, playerHealth, streak, difficulty, score, maxPlayerHealth, round, totalRounds, showRewardScreen, showVictoryScreen, getRandomLetter, speakLetter, flashKey, launchAttack, addFloater, playBossAnim, playPlayerAnim, shakeBattle, schedule]
  );

  // Listen for keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState === 'playing') {
        const letter = e.key.toUpperCase();
        if (ALPHABET.includes(letter)) {
          e.preventDefault();
          handleLetterPress(letter);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleLetterPress]);

  return (
    <div className="alpha-quest-container">
      {gameState === 'menu' && (
        <div className="alpha-quest-menu">
          <div className="alpha-quest-title">
            <span className="alpha-quest-icon">⚔️</span>
            <h1>AlphaQuest</h1>
            <span className="alpha-quest-icon">🎮</span>
          </div>
          <p className="alpha-quest-subtitle">Listen to the pronunciation and type the correct letter!</p>

          <div className="alpha-quest-difficulty-buttons">
            <button
              className="alpha-quest-difficulty-btn beginner-btn"
              onClick={() => startGame('beginner')}
            >
              <div className="difficulty-icon">🟢</div>
              <div className="difficulty-name">Beginner</div>
              <div className="difficulty-desc">3 Rounds | 4 ❤️</div>
            </button>
            <button
              className="alpha-quest-difficulty-btn intermediate-btn"
              onClick={() => startGame('intermediate')}
            >
              <div className="difficulty-icon">🟡</div>
              <div className="difficulty-name">Intermediate</div>
              <div className="difficulty-desc">4 Rounds | 4 ❤️</div>
            </button>
            <button
              className="alpha-quest-difficulty-btn endless-btn"
              onClick={() => startGame('endless')}
            >
              <div className="difficulty-icon">🔴</div>
              <div className="difficulty-name">Endless</div>
              <div className="difficulty-desc">∞ Rounds | 4 ❤️</div>
            </button>
          </div>

          <button type="button" className="alpha-quest-close-btn" onClick={onClose}>
            ← Return to Alphabet Module
          </button>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'reward') && (
        <div className="alpha-quest-game">
          <div className="alpha-quest-header">
            <div className="game-info">
              <p className="game-round">Round {round} / {totalRounds === Infinity ? '∞' : totalRounds}</p>
              <p className="game-difficulty">{DIFFICULTY_MODES[difficulty].name}</p>
            </div>
            <div className="game-score">Score: {score}</div>
            <button type="button" className="alpha-quest-quit-btn" onClick={returnToMenu}>
              ← Return
            </button>
          </div>

          {gameState === 'reward' &&
            createPortal(
              <div className="alpha-quest-reward-overlay" role="dialog" aria-modal="true" aria-label="Boss reward selection">
                <div className="alpha-quest-reward-card">
                  <div className="alpha-quest-reward-trophy">
                    <span className="alpha-quest-reward-sparkle s1" aria-hidden="true">✨</span>
                    <span className="alpha-quest-reward-sparkle s2" aria-hidden="true">⭐</span>
                    <span className="alpha-quest-reward-sparkle s3" aria-hidden="true">✨</span>
                    <span className="alpha-quest-reward-sparkle s4" aria-hidden="true">⭐</span>
                    <div className="alpha-quest-reward-emoji">🏆</div>
                  </div>
                  <h2 key={rewardMessage}>{rewardMessage || 'You defeated the boss!'}</h2>
                  <p>Choose one reward before the next boss appears.</p>

                  <div className="alpha-quest-reward-options">
                    <button
                      type="button"
                      className={`alpha-quest-reward-btn health ${rewardClaimed === 'health' ? 'claimed' : ''}`}
                      onClick={() => handleRewardChoice('health')}
                      disabled={Boolean(rewardClaimed)}
                    >
                      <span className="reward-icon" aria-hidden="true">❤️</span>
                      <span className="reward-title">Health</span>
                      <span className="reward-subtitle">+1 heart</span>
                    </button>
                    <button
                      type="button"
                      className={`alpha-quest-reward-btn hints ${rewardClaimed === 'hints' ? 'claimed' : ''}`}
                      onClick={() => handleRewardChoice('hints')}
                      disabled={Boolean(rewardClaimed)}
                    >
                      <span className="reward-icon" aria-hidden="true">💡</span>
                      <span className="reward-title">Hints</span>
                      <span className="reward-subtitle">+2 hints</span>
                    </button>
                  </div>

                  <p className="alpha-quest-reward-note">
                    {playerHealth >= maxPlayerHealth
                      ? 'You still have full health, so choose hints instead.'
                      : 'Health restores 1 heart only when you are damaged.'}
                  </p>
                </div>
              </div>,
              document.body
            )}

          <div className={`alpha-quest-battle ${isShaking ? 'shake' : ''}`}>
            {roundBanner && (
              <div key={roundBanner.id} className="aq-round-banner" aria-hidden="true">
                ⚔️ {roundBanner.text} ⚔️
              </div>
            )}

            {attack && (
              <span key={attack.id} className={`aq-projectile ${attack.direction}`} aria-hidden="true">
                {attack.direction === 'to-boss' ? '⚡' : '💥'}
              </span>
            )}

            {/* Player Side */}
            <div className="alpha-quest-player-side">
              <div key={`player-${playerAnim.id}`} className={`aq-actor player-anim-${playerAnim.type || 'idle'}`}>
                <div className="player-emoji">{getPlayerEmoji()}</div>
              </div>
              <div className="player-health">
                {Array.from({ length: maxPlayerHealth }).map((_, i) => (
                  <span key={i} className={`heart ${i < playerHealth ? 'full' : 'empty'}`}>
                    ❤️
                  </span>
                ))}
              </div>
              {floaters
                .filter((floater) => floater.side === 'player')
                .map((floater) => (
                  <span key={floater.id} className={`aq-floater ${floater.kind}`} aria-hidden="true">
                    {floater.text}
                  </span>
                ))}
            </div>

            {/* Boss Side */}
            <div className="alpha-quest-boss-side">
              <div className="boss-display">
                <div key={`boss-${bossAnim.id}`} className={`aq-actor boss-anim-${bossAnim.type || 'idle'}`}>
                  <div className="boss-emoji">{currentBoss}</div>
                </div>
              </div>
              <div className="boss-health">
                {Array.from({ length: maxBossHealth }).map((_, i) => (
                  <span key={i} className={`heart ${i < bossHealth ? 'full' : 'empty'}`}>
                    ❤️
                  </span>
                ))}
              </div>
              {floaters
                .filter((floater) => floater.side === 'boss')
                .map((floater) => (
                  <span key={floater.id} className={`aq-floater ${floater.kind}`} aria-hidden="true">
                    {floater.text}
                  </span>
                ))}
            </div>
          </div>

          <div
            key={feedback}
            className={`alpha-quest-feedback ${feedback.startsWith('✓') ? 'good' : ''} ${feedback.startsWith('✗') ? 'bad' : ''}`}
          >
            {feedback}
          </div>

          <div className="alpha-quest-hint-status">
            <div key={hintCount} className="alpha-quest-hint-count">💡 Hints: {hintCount}</div>
            {revealedHint && (
              <div className="alpha-quest-hint-card" aria-live="polite">
                <span className="alpha-quest-hint-icon" aria-hidden="true">
                  {revealedHint.icon}
                </span>
                <span className="alpha-quest-hint-sr-only">Object clue revealed</span>
              </div>
            )}
          </div>

          <div className="alpha-quest-controls">
            <button
              type="button"
              className="alpha-quest-listen-btn"
              onClick={() => currentLetter && speakLetter(currentLetter)}
              disabled={gameState === 'reward'}
            >
              🔊 Listen Again
            </button>
            <button
              type="button"
              className="alpha-quest-hint-btn"
              onClick={handleUseHint}
              disabled={gameState === 'reward' || hintCount <= 0}
            >
              💡 Use Hint
            </button>
          </div>

          <div key={streak} className={`alpha-quest-streak ${streak >= 3 ? 'on-fire' : ''}`}>
            {streak >= 3 && <span className="aq-fire" aria-hidden="true">🔥</span>}
            Streak: {streak}
          </div>

          <div className="alpha-quest-keyboard-hint">
            Type the letter or click below
          </div>

          {/* On-screen letter buttons */}
          <div className="alpha-quest-letter-buttons">
            {ALPHABET.map((letter) => (
              <button
                key={letter}
                className={`alpha-quest-letter-btn ${
                  pressedKey && pressedKey.letter === letter ? (pressedKey.correct ? 'correct' : 'wrong') : ''
                }`}
                onClick={() => handleLetterPress(letter)}
                disabled={gameState === 'reward' || isLocked}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      )}

      {(gameState === 'gameOver' || gameState === 'victory') && (
        <div className="alpha-quest-game-over">
          {gameState === 'victory' && (
            <div className="aq-confetti" aria-hidden="true">
              {CONFETTI_PIECES.map((piece, i) => (
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
          )}
          <div className={`game-over-modal ${gameState === 'victory' ? 'victory' : 'defeat'}`}>
            {gameState === 'gameOver' && (
              <>
                <div className="game-over-emoji">😵</div>
                <h2 className="game-over-title">{gameOverMessage}</h2>
                <p className="game-over-stats">
                  Made it to Round {round}/{totalRounds === Infinity ? '∞' : totalRounds}
                  <br />
                  Final Score: {score}
                </p>
              </>
            )}
            {gameState === 'victory' && (
              <>
                <div className="game-over-emoji">🎉</div>
                <h2 className="game-over-title">{gameOverMessage}</h2>
              </>
            )}

            <div className="game-over-buttons">
              <button type="button" className="game-over-btn play-again" onClick={() => setGameState('menu')}>
                Play Again
              </button>
              <button type="button" className="game-over-btn back-to-alpha" onClick={onClose}>
                Return to Alphabet Module
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
