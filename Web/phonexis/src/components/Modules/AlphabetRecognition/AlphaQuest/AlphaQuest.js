import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './AlphaQuest.css';
import { playSound } from '../../shared/gameSounds';
import SoundToggle from '../../shared/SoundToggle';

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
    playSound('sparkle');
    setRewardMessage('You defeated the boss! Choose a reward.');
    setRewardClaimed(false);
    setRevealedHint(null);
  }, []);

  const showVictoryScreen = useCallback(() => {
    setGameState('victory');
    playSound('victory');
  }, []);

  const advanceToNextRound = useCallback(() => {
    if (round >= totalRounds) {
      schedule(() => showVictoryScreen(), 900);
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
      playSound('whoosh');
      showRoundBanner(`Round ${round + 1}`);
      speakLetter(newLetter);
    }, 900);
  }, [difficulty, getRandomBossEmoji, getRandomLetter, playBossAnim, round, schedule, showRoundBanner, showVictoryScreen, speakLetter, totalRounds]);

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
        playSound('heal');
        playPlayerAnim('heal');
        advanceToNextRound();
        return;
      }

      if (rewardType === 'hints') {
        setRewardClaimed('hints');
        setHintCount((currentHintCount) => currentHintCount + 2);
        setRewardMessage('You gained 2 hints.');
        playSound('powerUp');
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
    playSound('sparkle');
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
    playSound('start');

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
          playSound('enemyDefeated');
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
              showVictoryScreen();
            } else {
              showRewardScreen();
            }
          }, BOSS_DEFEAT_DELAY);
        } else {
          // Boss still alive
          setBossHealth(newBossHealth);
          setStreak(newStreak);
          playBossAnim('hit');
          playSound(newStreak >= 3 ? 'combo' : 'hit');
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
        playSound('hurt');

        if (newPlayerHealth <= 0) {
          // Game over
          setIsLocked(true);
          playPlayerAnim('defeated');
          setFeedback(`✗ Oh no! You ran out of hearts!`);
          schedule(() => {
            setIsLocked(false);
            setGameState('gameOver');
            playSound('lose');
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

  const difficultyCards = [
    { key: 'beginner', icon: '🟢', color: 'green', preview: '👾' },
    { key: 'intermediate', icon: '🟡', color: 'amber', preview: '🐉' },
    { key: 'endless', icon: '🔴', color: 'red', preview: '👹' },
  ];
  const roundLabel = totalRounds === Infinity ? '∞' : totalRounds;

  return (
    <div className="aq-page">
      <div className="aq-sky" aria-hidden="true">
        <span className="aq-moon" />
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="aq-star"
            style={{ '--i': i, top: `${4 + ((i * 37) % 45)}%`, left: `${3 + ((i * 53) % 94)}%` }}
          />
        ))}
        <span className="aq-castle left" />
        <span className="aq-castle right" />
      </div>

      <div className="aq-shell">
        <div className="aq-topbar">
          <div className="aq-brand">
            <span className="aq-brand-icon" aria-hidden="true">⚔️</span>
            <div>
              <h1>AlphaQuest</h1>
              <span>Hear the letter. Strike the boss!</span>
            </div>
          </div>
          <div className="aq-topbar-actions">
            <SoundToggle />
            <button type="button" className="aq-ghost-btn" onClick={onClose}>
              ← Alphabet
            </button>
          </div>
        </div>

        {gameState === 'menu' && (
          <section className="aq-card aq-menu">
            <div className="aq-menu-hero" aria-hidden="true">
              <span className="aq-menu-hero-player">🧙</span>
              <span className="aq-menu-hero-vs">⚔️</span>
              <span className="aq-menu-hero-boss">👾</span>
            </div>

            <div className="aq-menu-copy">
              <p className="aq-kicker">Letter battle</p>
              <h2>Choose your quest!</h2>
              <p>Listen to each letter, then type or tap it to attack the boss.</p>
            </div>

            <div className="aq-rules">
              <span>🔊 Listen</span>
              <span>⌨️ Type the letter</span>
              <span>⚡ Hit the boss</span>
              <span>🏆 Defeat them all</span>
            </div>

            <div className="aq-difficulties">
              {difficultyCards.map((card, index) => {
                const mode = DIFFICULTY_MODES[card.key];
                return (
                  <button
                    key={card.key}
                    type="button"
                    className={`aq-difficulty aq-${card.color}`}
                    style={{ '--i': index }}
                    onClick={() => startGame(card.key)}
                  >
                    <span className="aq-difficulty-boss" aria-hidden="true">{card.preview}</span>
                    <strong>{card.icon} {mode.name}</strong>
                    <span>{mode.rounds === Infinity ? '∞' : mode.rounds} rounds · {mode.maxHealth} ❤️</span>
                    <em>▶ Start</em>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {(gameState === 'playing' || gameState === 'reward') && (
          <section className="aq-game">
            <div className="aq-hud">
              <div className="aq-hud-chip">
                <span>Round</span>
                <strong>{round}/{roundLabel}</strong>
              </div>
              <div className="aq-hud-chip">
                <span>Mode</span>
                <strong>{DIFFICULTY_MODES[difficulty].name}</strong>
              </div>
              <div className="aq-hud-chip aq-hud-score">
                <span>Score</span>
                <strong key={score} className="aq-pop">⭐ {score}</strong>
              </div>
              <div className={`aq-hud-chip ${streak >= 3 ? 'on-fire' : ''}`}>
                <span>Streak</span>
                <strong key={streak} className="aq-pop">{streak >= 3 ? '🔥' : '⚡'} {streak}</strong>
              </div>
              <button type="button" className="aq-ghost-btn aq-hud-quit" onClick={returnToMenu}>
                ✕ Quit
              </button>
            </div>

            <div className={`aq-arena ${isShaking ? 'shake' : ''}`}>
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

              <div className="aq-fighter aq-player">
                <span className="aq-nameplate">🧙 You</span>
                <div key={`player-${playerAnim.id}`} className={`aq-actor player-anim-${playerAnim.type || 'idle'}`}>
                  <div className="aq-fighter-emoji">{getPlayerEmoji()}</div>
                </div>
                <div className="aq-hearts">
                  {Array.from({ length: maxPlayerHealth }).map((_, i) => (
                    <span key={i} className={`aq-heart ${i < playerHealth ? 'full' : 'empty'}`}>❤️</span>
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

              <span className="aq-vs" aria-hidden="true">VS</span>

              <div className="aq-fighter aq-boss">
                <span className="aq-nameplate">👑 Boss</span>
                <div key={`boss-${bossAnim.id}`} className={`aq-actor boss-anim-${bossAnim.type || 'idle'}`}>
                  <div className="aq-fighter-emoji">{currentBoss}</div>
                </div>
                <div className="aq-hearts">
                  {Array.from({ length: maxBossHealth }).map((_, i) => (
                    <span key={i} className={`aq-heart ${i < bossHealth ? 'full' : 'empty'}`}>❤️</span>
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

            <p
              key={feedback}
              className={`aq-feedback ${feedback.startsWith('✓') ? 'good' : ''} ${feedback.startsWith('✗') ? 'bad' : ''}`}
            >
              {feedback}
            </p>

            <div className="aq-controls">
              <button
                type="button"
                className="aq-btn aq-listen"
                onClick={() => currentLetter && speakLetter(currentLetter)}
                disabled={gameState === 'reward'}
              >
                🔊 Listen Again
              </button>
              <button
                type="button"
                className="aq-btn aq-hint"
                onClick={handleUseHint}
                disabled={gameState === 'reward' || hintCount <= 0}
              >
                💡 Use Hint <b key={hintCount}>{hintCount}</b>
              </button>
              {revealedHint && (
                <div className="aq-hint-card" aria-live="polite">
                  <span aria-hidden="true">{revealedHint.icon}</span>
                  <span className="aq-sr-only">Object clue revealed</span>
                </div>
              )}
            </div>

            <div className="aq-keyboard">
              <span className="aq-keyboard-hint">⌨️ Type the letter or tap it below</span>
              <div className="aq-letters">
                {ALPHABET.map((letter, index) => (
                  <button
                    key={letter}
                    type="button"
                    className={`aq-letter ${
                      pressedKey && pressedKey.letter === letter ? (pressedKey.correct ? 'correct' : 'wrong') : ''
                    }`}
                    style={{ '--i': index }}
                    onClick={() => handleLetterPress(letter)}
                    disabled={gameState === 'reward' || isLocked}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>

            {gameState === 'reward' &&
              createPortal(
                <div className="aq-modal-backdrop" role="dialog" aria-modal="true" aria-label="Boss reward selection">
                  <div className="aq-modal">
                    <div className="aq-modal-trophy">
                      <span className="aq-sparkle s1" aria-hidden="true">✨</span>
                      <span className="aq-sparkle s2" aria-hidden="true">⭐</span>
                      <span className="aq-sparkle s3" aria-hidden="true">✨</span>
                      <span className="aq-sparkle s4" aria-hidden="true">⭐</span>
                      <div className="aq-modal-emoji">🏆</div>
                    </div>
                    <h2 key={rewardMessage}>{rewardMessage || 'You defeated the boss!'}</h2>
                    <p>Choose one reward before the next boss appears.</p>

                    <div className="aq-rewards">
                      <button
                        type="button"
                        className={`aq-reward health ${rewardClaimed === 'health' ? 'claimed' : ''}`}
                        onClick={() => handleRewardChoice('health')}
                        disabled={Boolean(rewardClaimed)}
                      >
                        <span className="aq-reward-icon" aria-hidden="true">❤️</span>
                        <strong>Health</strong>
                        <span>+1 heart</span>
                      </button>
                      <button
                        type="button"
                        className={`aq-reward hints ${rewardClaimed === 'hints' ? 'claimed' : ''}`}
                        onClick={() => handleRewardChoice('hints')}
                        disabled={Boolean(rewardClaimed)}
                      >
                        <span className="aq-reward-icon" aria-hidden="true">💡</span>
                        <strong>Hints</strong>
                        <span>+2 hints</span>
                      </button>
                    </div>

                    <p className="aq-modal-note">
                      {playerHealth >= maxPlayerHealth
                        ? 'You still have full health, so choose hints instead.'
                        : 'Health restores 1 heart only when you are damaged.'}
                    </p>
                  </div>
                </div>,
                document.body
              )}
          </section>
        )}

        {(gameState === 'gameOver' || gameState === 'victory') && (
          <section className={`aq-card aq-end ${gameState === 'victory' ? 'victory' : 'defeat'}`}>
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

            <div className="aq-end-emoji" aria-hidden="true">{gameState === 'victory' ? '🏆' : '😵'}</div>
            <p className="aq-kicker">{gameState === 'victory' ? 'Quest complete' : 'Game over'}</p>
            <h2>{gameState === 'victory' ? 'Victory!' : 'You were defeated!'}</h2>
            <p className="aq-end-message">
              {gameState === 'victory'
                ? `You defeated all ${roundLabel} bosses!`
                : 'The boss was too strong this time. Try again!'}
            </p>

            <div className="aq-end-stats">
              <div><span>Score</span><strong>⭐ {score}</strong></div>
              <div><span>Round</span><strong>⚔️ {round}/{roundLabel}</strong></div>
              <div><span>Mode</span><strong>{difficulty ? DIFFICULTY_MODES[difficulty].name : '-'}</strong></div>
            </div>

            <div className="aq-end-actions">
              <button type="button" className="aq-btn aq-btn-soft" onClick={onClose}>
                ← Alphabet
              </button>
              <button type="button" className="aq-btn aq-pulse" onClick={() => setGameState('menu')}>
                ↻ Play Again
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
