import { useEffect, useRef, useState } from 'react';
import './BalloonPop.css';
import { speakText } from '../speechUtils';
import { playSound } from '../../shared/gameSounds';
import SoundToggle from '../../shared/SoundToggle';

const wordBuildingDeck = [
  { target: 'cat', icon: '🐱', choices: ['C', 'A', 'T', 'O', 'E'], description: 'A small pet that says meow.' },
  { target: 'dog', icon: '🐶', choices: ['D', 'O', 'G', 'A', 'U'], description: 'A pet that barks.' },
  { target: 'sun', icon: '☀️', choices: ['S', 'U', 'N', 'A', 'E'], description: 'The bright star in the sky.' },
  { target: 'pig', icon: '🐷', choices: ['P', 'I', 'G', 'O', 'E'], description: 'A farm animal that oinks.' },
  { target: 'bat', icon: '🦇', choices: ['B', 'A', 'T', 'I', 'O'], description: 'A night flyer with tiny wings.' },
  { target: 'man', icon: '🧑', choices: ['M', 'A', 'N', 'E', 'I'], description: 'A grown-up person.' },
  { target: 'fan', icon: '🪭', choices: ['F', 'A', 'N', 'O', 'U'], description: 'It moves air when it spins.' },
  { target: 'pen', icon: '🖊️', choices: ['P', 'E', 'N', 'A', 'O'], description: 'A tool used for writing.' },
  { target: 'cup', icon: '🥤', choices: ['C', 'U', 'P', 'A', 'O'], description: 'A container used for drinking.' },
  { target: 'bag', icon: '👜', choices: ['B', 'A', 'G', 'D', 'R'], description: 'A container you carry your things in.' },
  { target: 'car', icon: '🚗', choices: ['C', 'A', 'R', 'T', 'M'], description: 'A vehicle with four wheels.' },
  { target: 'bus', icon: '🚌', choices: ['B', 'U', 'S', 'T', 'P'], description: 'A large vehicle that carries many people.' },
];

const maxHearts = 4;
const rewardEvery = 3;
const letterPoints = 10;
const wordBonus = 30;
const balloonColors = ['#ff5d73', '#ffb830', '#3ec6ff', '#8b5cf6', '#22c55e', '#ff7ac6'];
const burstAngles = [0, 45, 90, 135, 180, 225, 270, 315];
const rewardInfo = {
  shield: { icon: '🛡️', label: 'Shield', detail: 'Blocks 1 wrong pop' },
  heal: { icon: '❤️', label: 'Heal', detail: '+1 heart' },
  reveal: { icon: '✨', label: 'Reveal', detail: 'Shows 1 letter' },
};
const confettiPieces = Array.from({ length: 40 }, (_, i) => ({
  left: (i * 29) % 100,
  delay: (i % 10) * 0.08,
  duration: 1.6 + (i % 5) * 0.25,
  color: balloonColors[i % balloonColors.length],
}));

const shuffleItems = (items) => {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[randomIndex]] = [shuffledItems[randomIndex], shuffledItems[index]];
  }

  return shuffledItems;
};

const pickRandomWord = (excludeTarget) => {
  const availableWords = wordBuildingDeck.filter((item) => item.target !== excludeTarget);
  const source = availableWords.length > 0 ? availableWords : wordBuildingDeck;
  return source[Math.floor(Math.random() * source.length)];
};

const createBalloonSet = (word, builtSlots = [], previousLanes = {}, round = 0) => {
  const remainingTargetLetters = word.target
    .toUpperCase()
    .split('')
    .filter((_, index) => !builtSlots[index]);
  const targetLetter = remainingTargetLetters.length > 0
    ? remainingTargetLetters[Math.floor(Math.random() * remainingTargetLetters.length)]
    : null;
  const distractorPool = word.choices.filter((letter) => !remainingTargetLetters.includes(letter));
  const distractorCount = 3;
  const distractors = Array.from({ length: distractorCount }, (_, index) => (
    distractorPool[index % distractorPool.length]
  ));
  const letters = shuffleItems(targetLetter ? [targetLetter, ...distractors] : distractors);
  const availableLanes = shuffleItems([0, 1, 2, 3]);
  const colorOffset = Math.floor(Math.random() * balloonColors.length);

  return letters.map((letter, index) => {
    const previousLane = previousLanes[letter];
    const laneOptions = availableLanes.filter((lane) => lane !== previousLane);
    const lane = laneOptions.length > 0 ? laneOptions[0] : availableLanes[0];
    availableLanes.splice(availableLanes.indexOf(lane), 1);
    previousLanes[letter] = lane;

    return {
      id: `${word.target}-${round}-${index}-${letter}`,
      letter,
      lane,
      delay: index * 0.35,
      color: balloonColors[(index + colorOffset) % balloonColors.length],
    };
  });
};

// Balloons rise a little faster with every word spelled.
const getRiseDuration = (wordsSpelled) => Math.max(4200, 7000 - wordsSpelled * 300);

export default function BalloonPop({ onClose }) {
  const [screen, setScreen] = useState('intro'); // intro, playing, gameover
  const [word, setWord] = useState(() => pickRandomWord());
  const [slots, setSlots] = useState(['', '', '']);
  const [balloons, setBalloons] = useState([]);
  const [waveId, setWaveId] = useState(0);
  const [popped, setPopped] = useState({});
  const [hearts, setHearts] = useState(maxHearts);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [wordsSpelled, setWordsSpelled] = useState(0);
  const [shield, setShield] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [status, setStatus] = useState('Pop the balloons to spell the word.');
  const [wordDone, setWordDone] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isReadingInstructions, setIsReadingInstructions] = useState(false);
  const [isReadingHint, setIsReadingHint] = useState(false);

  // Animation state
  const [effects, setEffects] = useState([]);
  const [banner, setBanner] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [celebrateId, setCelebrateId] = useState(0);

  const timersRef = useRef([]);
  const fxIdRef = useRef(0);
  const laneHistoryRef = useRef({});
  const roundRef = useRef(0);
  const heartsRef = useRef(maxHearts);
  const fieldRef = useRef(null);
  const wordRef = useRef(word);
  const slotsRef = useRef(slots);
  wordRef.current = word;
  slotsRef.current = slots;

  const riseDuration = getRiseDuration(wordsSpelled);

  const schedule = (fn, ms) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  const clearAllTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsReadingInstructions(false);
    setIsReadingHint(false);
  };

  useEffect(() => () => {
    clearAllTimers();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const spawnWave = (currentWord, currentSlots) => {
    roundRef.current += 1;
    setBalloons(createBalloonSet(currentWord, currentSlots, laneHistoryRef.current, roundRef.current));
    setPopped({});
    setWaveId((current) => current + 1);
  };

  // When a wave floats away without the right pop, send a fresh one.
  useEffect(() => {
    if (screen !== 'playing' || wordDone || isGameOver || waveId === 0) return undefined;

    const waveLength = riseDuration + 3 * 350 + 200;
    const timer = window.setTimeout(() => spawnWave(wordRef.current, slotsRef.current), waveLength);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveId, screen, wordDone, isGameOver]);

  const addEffect = (type, x, y, text) => {
    fxIdRef.current += 1;
    const id = fxIdRef.current;
    setEffects((current) => [...current, { id, type, x, y, text }]);
    schedule(() => setEffects((current) => current.filter((effect) => effect.id !== id)), 1000);
  };

  const showBanner = (text, kind, duration = 1400) => {
    fxIdRef.current += 1;
    const id = fxIdRef.current;
    setBanner({ id, text, kind });
    schedule(() => setBanner((current) => (current && current.id === id ? null : current)), duration);
  };

  const shake = () => {
    setIsShaking(true);
    schedule(() => setIsShaking(false), 450);
  };

  const removeBalloonLater = (balloonId) => {
    schedule(() => {
      setBalloons((current) => current.filter((item) => item.id !== balloonId));
    }, 450);
  };

  const speakHint = (currentWord = word) => {
    speakText(currentWord.description, {
      rate: 0.85,
      onend: () => setIsReadingHint(false),
      onerror: () => setIsReadingHint(false),
    });
    setIsReadingHint(true);
  };

  const toggleHint = () => {
    if (isReadingHint) {
      stopSpeech();
      return;
    }
    speakHint();
    setStatus('🔊 Listen to the hint.');
  };

  const speakInstructions = () => {
    const instructions = 'Listen to the hint. Pop the balloons with the letters of the word. You can choose the letters in any order. Wrong balloons take away one heart. Pop three right balloons in a row to earn a reward.';

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setStatus('Speech is not available. Please ask for help reading the instructions.');
      return;
    }

    if (isReadingInstructions) {
      stopSpeech();
      return;
    }

    speakText(instructions, {
      rate: 0.85,
      onend: () => setIsReadingInstructions(false),
      onerror: () => setIsReadingInstructions(false),
    });
    setIsReadingInstructions(true);
  };

  const beginWord = (nextWord) => {
    laneHistoryRef.current = {};
    setWord(nextWord);
    setSlots(['', '', '']);
    setWordDone(false);
    setStatus('Listen to the hint and pop the right letters!');
    spawnWave(nextWord, ['', '', '']);
    schedule(() => speakHint(nextWord), 400);
  };

  const completeWord = (finalSlots) => {
    const finishedWord = finalSlots.join('');
    setWordDone(true);
    setWordsSpelled((current) => current + 1);
    setScore((current) => current + wordBonus);
    setCelebrateId((current) => current + 1);
    showBanner(`🎉 ${finishedWord}!`, 'win', 1800);
    playSound('levelUp');
    setStatus(`Word complete! +${wordBonus} bonus points`);
    speakText(finishedWord, { rate: 0.8 });
    schedule(() => setBalloons([]), 450);
    schedule(() => beginWord(pickRandomWord(word.target)), 2300);
  };

  const awardReward = () => {
    const rewardTypes = Object.keys(rewardInfo);
    const reward = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
    setRewards((current) => [...current, reward]);
    showBanner(`🎁 ${rewardInfo[reward].label} earned!`, 'reward', 1400);
    playSound('sparkle');
  };

  const handlePop = (balloon, event) => {
    if (screen !== 'playing' || wordDone || isGameOver || popped[balloon.id]) return;

    const balloonRect = event.currentTarget.getBoundingClientRect();
    const fieldRect = fieldRef.current.getBoundingClientRect();
    const x = balloonRect.left + balloonRect.width / 2 - fieldRect.left;
    const y = balloonRect.top + balloonRect.height / 2 - fieldRect.top;

    speakText(balloon.letter);

    const targetIndex = word.target
      .toUpperCase()
      .split('')
      .findIndex((letter, index) => letter === balloon.letter && !slots[index]);

    if (targetIndex !== -1) {
      const nextSlots = [...slots];
      nextSlots[targetIndex] = balloon.letter;
      const nextStreak = streak + 1;

      setPopped((current) => ({ ...current, [balloon.id]: 'correct' }));
      setSlots(nextSlots);
      setScore((current) => current + letterPoints);
      setStreak(nextStreak);
      setBestStreak((current) => Math.max(current, nextStreak));
      addEffect('good', x, y, `+${letterPoints}`);
      playSound('pop');
      removeBalloonLater(balloon.id);

      if (nextStreak % rewardEvery === 0) awardReward();

      if (nextSlots.every(Boolean)) {
        completeWord(nextSlots);
      } else {
        setStatus('Correct! Next letter is coming!');
        schedule(() => spawnWave(word, nextSlots), 450);
      }
      return;
    }

    setPopped((current) => ({ ...current, [balloon.id]: 'wrong' }));
    setStreak(0);
    removeBalloonLater(balloon.id);

    if (shield) {
      setShield(false);
      addEffect('shield', x, y, '🛡️ Blocked!');
      playSound('hit');
      setStatus('Wrong balloon! Your shield blocked it.');
      return;
    }

    const nextHearts = heartsRef.current - 1;
    heartsRef.current = nextHearts;
    setHearts(nextHearts);
    shake();
    playSound('hurt');
    addEffect('bad', x, y, '-1 ❤️');

    if (nextHearts <= 0) {
      setIsGameOver(true);
      setStatus('Out of hearts!');
      showBanner('💔 Out of hearts!', 'lose', 1200);
      playSound('lose');
      schedule(() => {
        setBalloons([]);
        setScreen('gameover');
      }, 1200);
      return;
    }

    setStatus(`Oops! ${balloon.letter} is not in the word.`);
  };

  const claimReward = (reward) => {
    if (wordDone || isGameOver) return;

    const rewardIndex = rewards.indexOf(reward);
    if (rewardIndex === -1) return;
    setRewards((current) => current.filter((_, index) => index !== rewardIndex));

    if (reward === 'shield') {
      setShield(true);
      playSound('powerUp');
      setStatus('🛡️ Shield ready: one wrong balloon will not cost a heart.');
      return;
    }

    if (reward === 'heal') {
      const nextHearts = Math.min(maxHearts, heartsRef.current + 1);
      heartsRef.current = nextHearts;
      setHearts(nextHearts);
      playSound('heal');
      setStatus('❤️ Heart restored!');
      return;
    }

    const nextIndex = slots.findIndex((slot) => !slot);
    if (nextIndex === -1) return;
    const nextSlots = [...slots];
    nextSlots[nextIndex] = word.target[nextIndex].toUpperCase();
    setSlots(nextSlots);
    playSound('sparkle');
    setStatus('✨ A letter was revealed!');

    if (nextSlots.every(Boolean)) {
      completeWord(nextSlots);
    } else {
      spawnWave(word, nextSlots);
    }
  };

  const startGame = () => {
    clearAllTimers();
    stopSpeech();
    heartsRef.current = maxHearts;
    setHearts(maxHearts);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setWordsSpelled(0);
    setShield(false);
    setRewards([]);
    setEffects([]);
    setBanner(null);
    setIsGameOver(false);
    setScreen('playing');
    showBanner('🎈 Ready... POP!', 'start', 1300);
    playSound('start');
    beginWord(pickRandomWord(word.target));
  };

  const handleClose = () => {
    clearAllTimers();
    stopSpeech();
    if (typeof onClose === 'function') onClose();
  };

  const renderTopbar = () => (
    <div className="bp-topbar">
      <div className="bp-brand">
        <span className="bp-brand-icon" aria-hidden="true">🎈</span>
        <div>
          <h1>Balloon Pop</h1>
          <span>Pop the letters, spell the word!</span>
        </div>
      </div>
      <div className="bp-topbar-actions">
        <SoundToggle />
        {typeof onClose === 'function' ? (
          <button type="button" className="bp-ghost-btn" onClick={handleClose}>
            ← Return to CVC Words
          </button>
        ) : null}
      </div>
    </div>
  );

  const renderIntro = () => (
    <section className="bp-card bp-intro">
      <div className="bp-hero" aria-hidden="true">
        {['C', 'A', 'T'].map((letter, i) => (
          <span key={letter} className="bp-hero-balloon" style={{ '--c': balloonColors[i], '--i': i }}>
            {letter}
          </span>
        ))}
      </div>

      <div className="bp-intro-header">
        <p className="bp-kicker">CVC spelling game</p>
        <h2>Pop the balloons to spell the word!</h2>
      </div>

      <div className="bp-rules">
        <div className="bp-rule"><span>🔊</span>Listen to the word hint</div>
        <div className="bp-rule"><span>🎈</span>Pop balloons with the word&apos;s letters</div>
        <div className="bp-rule"><span>🔀</span>Letters can go in any order</div>
        <div className="bp-rule"><span>💔</span>A wrong balloon costs 1 heart</div>
        <div className="bp-rule"><span>🎁</span>Pop 3 in a row to earn a reward</div>
        <div className="bp-rule"><span>⚡</span>Balloons get faster as you go</div>
      </div>

      <div className="bp-actions">
        <button type="button" className="bp-secondary-btn" onClick={speakInstructions} aria-pressed={isReadingInstructions}>
          {isReadingInstructions ? '⏹ Stop Reading' : '🔊 Read Instructions Aloud'}
        </button>
        <button type="button" className="bp-primary-btn bp-pulse" onClick={startGame}>
          Start Popping 🎈
        </button>
      </div>
    </section>
  );

  const renderGame = () => (
    <section className={`bp-game ${isShaking ? 'is-shaking' : ''} ${hearts === 1 ? 'is-danger' : ''} ${wordDone ? 'is-complete' : ''}`}>
      <div className="bp-hud">
        <div className="bp-hud-block">
          <span className="bp-hud-label">Hearts</span>
          <div className="bp-hearts">
            {Array.from({ length: maxHearts }).map((_, i) => (
              <span key={i} className={`bp-heart ${i < hearts ? 'full' : 'empty'}`}>❤️</span>
            ))}
            {shield ? <span className="bp-shield" title="Shield ready">🛡️</span> : null}
          </div>
        </div>

        <div className="bp-hud-block">
          <span className="bp-hud-label">Score</span>
          <strong key={score} className="bp-pop">⭐ {score}</strong>
        </div>

        <div className="bp-hud-block">
          <span className="bp-hud-label">Streak {streak >= 3 ? '🔥' : ''}</span>
          <div className="bp-streak-meter" aria-label={`${streak % rewardEvery} of ${rewardEvery} toward next reward`}>
            {Array.from({ length: rewardEvery }).map((_, i) => (
              <span key={i} className={i < streak % rewardEvery || (streak > 0 && streak % rewardEvery === 0) ? 'on' : ''} />
            ))}
            <em>🎁</em>
          </div>
        </div>

        <div className="bp-hud-block">
          <span className="bp-hud-label">Words</span>
          <strong key={wordsSpelled} className="bp-pop">🏆 {wordsSpelled}</strong>
        </div>
      </div>

      <div className="bp-word-panel">
        <div key={word.target} className="bp-word-icon" aria-hidden="true">{word.icon}</div>
        <div className="bp-word-hint">
          <p>{word.description}</p>
          <button type="button" className="bp-hint-btn" onClick={toggleHint}>
            {isReadingHint ? '⏹ Stop Hint' : '🔊 Hear Hint'}
          </button>
        </div>
        <div className="bp-slots" aria-label="Word progress">
          {slots.map((slot, index) => (
            <div
              key={`${word.target}-${index}-${slot}`}
              className={`bp-slot ${slot ? 'filled' : ''}`}
              style={{ '--i': index }}
            >
              {slot || '?'}
            </div>
          ))}
        </div>
      </div>

      <div className="bp-field" ref={fieldRef} aria-label="Letter balloons">
        {banner ? <div key={banner.id} className={`bp-banner ${banner.kind}`} aria-live="polite">{banner.text}</div> : null}

        {balloons.map((balloon) => (
          <button
            key={balloon.id}
            type="button"
            className={`bp-balloon ${popped[balloon.id] ? `popped ${popped[balloon.id]}` : ''}`}
            style={{
              '--lane': balloon.lane,
              '--delay': `${balloon.delay}s`,
              '--rise': `${riseDuration}ms`,
              '--c': balloon.color,
            }}
            onClick={(event) => handlePop(balloon, event)}
            disabled={wordDone || isGameOver}
            aria-label={`Letter ${balloon.letter}`}
          >
            <span className="bp-balloon-body">
              <span className="bp-balloon-letter">{balloon.letter}</span>
            </span>
            <span className="bp-balloon-string" aria-hidden="true" />
          </button>
        ))}

        {effects.map((effect) => (
          <div key={effect.id} className={`bp-fx ${effect.type}`} style={{ left: effect.x, top: effect.y }} aria-hidden="true">
            {effect.type === 'good'
              ? burstAngles.map((angle) => <span key={angle} className="bp-particle" style={{ '--angle': `${angle}deg` }} />)
              : null}
            {effect.type === 'bad' ? <span className="bp-boom">💥</span> : null}
            <span className="bp-fx-text">{effect.text}</span>
          </div>
        ))}

        {celebrateId > 0 && wordDone ? (
          <div key={celebrateId} className="bp-confetti" aria-hidden="true">
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
      </div>

      <div className="bp-bottom">
        <p key={status} className="bp-status" aria-live="polite">{status}</p>
        <div className="bp-rewards" aria-label="Streak rewards">
          {Object.entries(rewardInfo).map(([reward, info]) => {
            const count = rewards.filter((item) => item === reward).length;
            return (
              <button
                key={reward}
                type="button"
                className={`bp-reward ${count ? 'ready' : ''}`}
                disabled={!count || wordDone || isGameOver}
                onClick={() => claimReward(reward)}
                title={info.detail}
              >
                <span className="bp-reward-icon">{info.icon}</span>
                <span className="bp-reward-label">{info.label}</span>
                {count ? <b key={count}>{count}</b> : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );

  const renderGameOver = () => (
    <section className="bp-card bp-gameover">
      <div className="bp-gameover-emoji" aria-hidden="true">💔</div>
      <p className="bp-kicker">Game Over</p>
      <h2>All the hearts popped!</h2>
      <div className="bp-stats">
        <div><span>Score</span><strong>⭐ {score}</strong></div>
        <div><span>Words spelled</span><strong>🏆 {wordsSpelled}</strong></div>
        <div><span>Best streak</span><strong>🔥 {bestStreak}</strong></div>
      </div>
      <div className="bp-actions">
        {typeof onClose === 'function' ? (
          <button type="button" className="bp-secondary-btn" onClick={handleClose}>
            Return to CVC Words
          </button>
        ) : null}
        <button type="button" className="bp-primary-btn bp-pulse" onClick={startGame}>
          ↻ Play Again
        </button>
      </div>
    </section>
  );

  return (
    <div className="cvc-balloon-sky" aria-label="Balloon Pop game">
      <div className="bp-scenery" aria-hidden="true">
        <span className="bp-sun" />
        <span className="bp-cloud c1" />
        <span className="bp-cloud c2" />
        <span className="bp-cloud c3" />
        <span className="bp-hills" />
      </div>

      <div className="bp-content">
        {renderTopbar()}
        {screen === 'intro' ? renderIntro() : null}
        {screen === 'playing' ? renderGame() : null}
        {screen === 'gameover' ? renderGameOver() : null}
      </div>
    </div>
  );
}
