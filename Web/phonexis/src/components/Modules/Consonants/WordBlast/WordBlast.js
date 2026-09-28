import { useEffect, useRef, useState } from 'react';
import './WordBlast.css';

const wordDeck = [
  { word: 'CAT', emoji: '🐱' },
  { word: 'DOG', emoji: '🐶' },
  { word: 'SUN', emoji: '☀️' },
  { word: 'PIG', emoji: '🐷' },
  { word: 'FOX', emoji: '🦊' },
  { word: 'FISH', emoji: '🐟' },
  { word: 'BALL', emoji: '⚽' },
  { word: 'MOON', emoji: '🌙' },
  { word: 'KITE', emoji: '🪁' },
  { word: 'CAKE', emoji: '🎂' },
  { word: 'APPLE', emoji: '🍎' },
  { word: 'TIGER', emoji: '🐯' },
  { word: 'BREAD', emoji: '🍞' },
  { word: 'CLOUD', emoji: '☁️' },
  { word: 'SNAIL', emoji: '🐌' },
  { word: 'BANANA', emoji: '🍌' },
  { word: 'ROCKET', emoji: '🚀' },
  { word: 'PENCIL', emoji: '✏️' },
  { word: 'GUITAR', emoji: '🎸' },
  { word: 'CASTLE', emoji: '🏰' },
  { word: 'BIRD', emoji: '🐦' },
  { word: 'FROG', emoji: '🐸' },
  { word: 'LION', emoji: '🦁' },
  { word: 'RAIN', emoji: '🌧️' },
  { word: 'STAR', emoji: '⭐' },
  { word: 'GRAPE', emoji: '🍇' },
  { word: 'PIZZA', emoji: '🍕' },
  { word: 'HORSE', emoji: '🐴' },
  { word: 'TRAIN', emoji: '🚂' },
  { word: 'HOUSE', emoji: '🏠' },
  { word: 'TURTLE', emoji: '🐢' },
  { word: 'ORANGE', emoji: '🍊' },
  { word: 'PIRATE', emoji: '🏴‍☠️' },
  { word: 'BASKET', emoji: '🧺' },
  { word: 'DRAGON', emoji: '🐲' },
  { word: 'GARDEN', emoji: '🌻' },
  { word: 'JACKET', emoji: '🧥' },
  { word: 'MONKEY', emoji: '🐵' },
  { word: 'PLANET', emoji: '🪐' },
  { word: 'WIZARD', emoji: '🧙' },
  { word: 'ANT', emoji: '🐜' },
  { word: 'BEE', emoji: '🐝' },
  { word: 'SNAKE', emoji: '🐍' },
  { word: 'WHALE', emoji: '🐳' },
  { word: 'DOLPHIN', emoji: '🐬' },
  { word: 'OCTOPUS', emoji: '🐙' },
  { word: 'BUTTERFLY', emoji: '🦋' },
  { word: 'CHICKEN', emoji: '🐔' },
  { word: 'PANDA', emoji: '🐼' },
  { word: 'KOALA', emoji: '🐨' },
  { word: 'ZEBRA', emoji: '🦓' },
  { word: 'GIRAFFE', emoji: '🦒' },
  { word: 'ELEPHANT', emoji: '🐘' },
  { word: 'PENGUIN', emoji: '🐧' },
  { word: 'CHERRY', emoji: '🍒' },
  { word: 'LEMON', emoji: '🍋' },
  { word: 'WATERMELON', emoji: '🍉' },
  { word: 'STRAWBERRY', emoji: '🍓' },
  { word: 'PINEAPPLE', emoji: '🍍' },
  { word: 'PEAR', emoji: '🍐' },
  { word: 'PEACH', emoji: '🍑' },
  { word: 'CARROT', emoji: '🥕' },
  { word: 'CORN', emoji: '🌽' },
  { word: 'POTATO', emoji: '🥔' },
  { word: 'COOKIE', emoji: '🍪' },
  { word: 'DONUT', emoji: '🍩' },
  { word: 'CUPCAKE', emoji: '🧁' },
  { word: 'POPCORN', emoji: '🍿' },
  { word: 'BURGER', emoji: '🍔' },
  { word: 'TACO', emoji: '🌮' },
  { word: 'NOODLES', emoji: '🍜' },
  { word: 'SANDWICH', emoji: '🥪' },
  { word: 'MILK', emoji: '🥛' },
  { word: 'HONEY', emoji: '🍯' },
  { word: 'WATER', emoji: '💧' },
  { word: 'FLOWER', emoji: '🌸' },
  { word: 'ROSE', emoji: '🌹' },
  { word: 'TREE', emoji: '🌳' },
  { word: 'CACTUS', emoji: '🌵' },
  { word: 'LEAF', emoji: '🍃' },
  { word: 'RAINBOW', emoji: '🌈' },
  { word: 'SNOW', emoji: '❄️' },
  { word: 'FIRE', emoji: '🔥' },
  { word: 'WIND', emoji: '🌬️' },
  { word: 'THUNDER', emoji: '⚡' },
  { word: 'BEACH', emoji: '🏖️' },
  { word: 'MOUNTAIN', emoji: '⛰️' },
  { word: 'ISLAND', emoji: '🏝️' },
  { word: 'VOLCANO', emoji: '🌋' },
  { word: 'TENT', emoji: '⛺' },
  { word: 'BICYCLE', emoji: '🚲' },
  { word: 'BUS', emoji: '🚌' },
  { word: 'CAR', emoji: '🚗' },
  { word: 'TRUCK', emoji: '🚚' },
  { word: 'AIRPLANE', emoji: '✈️' },
  { word: 'BOAT', emoji: '⛵' },
  { word: 'HELICOPTER', emoji: '🚁' },
  { word: 'SUBWAY', emoji: '🚇' },
  { word: 'AMBULANCE', emoji: '🚑' },
  { word: 'ROBOT', emoji: '🤖' },
  { word: 'ALIEN', emoji: '👽' },
  { word: 'ASTRONAUT', emoji: '👨‍🚀' },
  { word: 'CROWN', emoji: '👑' },
  { word: 'GLASSES', emoji: '👓' },
  { word: 'SHOE', emoji: '👟' },
  { word: 'UMBRELLA', emoji: '☂️' },
  { word: 'CAMERA', emoji: '📷' },
  { word: 'PHONE', emoji: '📱' },
  { word: 'LAPTOP', emoji: '💻' },
  { word: 'CLOCK', emoji: '⏰' },
  { word: 'KEY', emoji: '🔑' },
  { word: 'LOCK', emoji: '🔒' },
  { word: 'MAGNET', emoji: '🧲' },
  { word: 'BOOK', emoji: '📖' },
  { word: 'MUSIC', emoji: '🎵' },
  { word: 'DRUM', emoji: '🥁' },
  { word: 'PIANO', emoji: '🎹' },
  { word: 'MICROPHONE', emoji: '🎤' },
  { word: 'PAINT', emoji: '🎨' },
  { word: 'GIFT', emoji: '🎁' },
  { word: 'BALLOON', emoji: '🎈' },
  { word: 'SOCCER', emoji: '⚽' },
  { word: 'BASKETBALL', emoji: '🏀' },
  { word: 'TENNIS', emoji: '🎾' },
  { word: 'MEDAL', emoji: '🏅' },
  { word: 'PUZZLE', emoji: '🧩' },
  { word: 'DICE', emoji: '🎲' },
  { word: 'GAME', emoji: '🎮' },
  { word: 'PARTY', emoji: '🥳' },
  { word: 'SMILE', emoji: '😊' },
  { word: 'HEART', emoji: '💖' },
  { word: 'STARFISH', emoji: '🌟' },
  { word: 'DIAMOND', emoji: '💎' },
  { word: 'ROCKETSHIP', emoji: '🚀' },
  { word: 'TREASURE', emoji: '💰' },
  { word: 'FARMER', emoji: '👨‍🌾' },
  { word: 'DOCTOR', emoji: '🧑‍⚕️' },
  { word: 'FIREWORK', emoji: '🎆' },
  { word: 'SNOWMAN', emoji: '⛄' },
  { word: 'GHOST', emoji: '👻' },
];

const consonantChoices = 'BCDFGHJKLMNPQRSTVWXYZ'.split('');
const maxHearts = 10;
const roundsPerLevel = 5;
const burstAngles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

const levelConfig = {
  1: { label: 'Starter', icon: '🌱', blankCount: 1, maxTiles: 4 },
  2: { label: 'Explorer', icon: '🧭', blankCount: 2, maxTiles: 4 },
  3: { label: 'Challenger', icon: '⚔️', blankCount: 3, maxTiles: 4 },
  4: { label: 'Expert', icon: '👑', blankCount: 'all', maxTiles: 5 },
};

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const createChoices = (correct, maxTiles) => {
  const wrongChoices = shuffle(consonantChoices.filter((letter) => letter !== correct)).slice(0, maxTiles - 1);
  return shuffle([correct, ...wrongChoices]);
};

const getBlankPositions = (word, config) => {
  const consonantPositions = word
    .split('')
    .map((letter, index) => (consonantChoices.includes(letter) ? index : null))
    .filter((index) => index !== null);

  if (config.blankCount === 'all') return consonantPositions;

  const preferredPositions = config.blankCount === 1
    ? [consonantPositions[0]]
    : consonantPositions;
  return [...new Set(preferredPositions)].slice(0, Math.min(config.blankCount, consonantPositions.length));
};

const getLevelNumber = (index) => Math.min(Math.floor(index / roundsPerLevel) + 1, 4);

const firstBlankPosition = getBlankPositions(wordDeck[0].word, levelConfig[1])[0];

export default function WordBlast({ onClose }) {
  const [screen, setScreen] = useState('intro'); // intro, playing, gameover
  const [roundIndex, setRoundIndex] = useState(0);
  const [choices, setChoices] = useState(() => createChoices(wordDeck[0].word[firstBlankPosition], levelConfig[1].maxTiles));
  const [blankIndex, setBlankIndex] = useState(0);
  const [filledLetters, setFilledLetters] = useState({});
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(maxHearts);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [eliminatedChoice, setEliminatedChoice] = useState(null);
  const [message, setMessage] = useState('Listen to the word, then blast its missing consonant.');
  const [gameOver, setGameOver] = useState(false);
  const [isReadingInstructions, setIsReadingInstructions] = useState(false);

  // Gamification + animation state
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [wordsBlasted, setWordsBlasted] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isBlasting, setIsBlasting] = useState(false);
  const [banner, setBanner] = useState(null);
  const [floaters, setFloaters] = useState([]);
  const timersRef = useRef([]);
  const fxIdRef = useRef(0);
  const mistakeThisWordRef = useRef(false);

  const round = wordDeck[roundIndex % wordDeck.length];
  const level = getLevelNumber(roundIndex);
  const config = levelConfig[level];
  const blankPositions = getBlankPositions(round.word, config);
  const levelProgress = level < 4 ? roundIndex % roundsPerLevel : roundsPerLevel;
  const instructionText = 'Welcome to Word Blast. Listen to the word. Choose the missing consonant from the letter blocks. Correct answers give you ten points. Wrong answers remove one heart. You can use ten points for a hint or to restore one heart.';

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
    setIsSpeaking(false);
  };

  useEffect(() => () => {
    clearAllTimers();
    stopSpeech();
  }, []);

  const addFloater = (text, anchor, kind) => {
    fxIdRef.current += 1;
    const id = fxIdRef.current;
    setFloaters((current) => [...current, { id, text, anchor, kind }]);
    schedule(() => setFloaters((current) => current.filter((floater) => floater.id !== id)), 1100);
  };

  const showBanner = (text, kind, duration = 1300) => {
    fxIdRef.current += 1;
    const id = fxIdRef.current;
    setBanner({ id, text, kind });
    schedule(() => setBanner((current) => (current && current.id === id ? null : current)), duration);
  };

  const shake = () => {
    setIsShaking(true);
    schedule(() => setIsShaking(false), 450);
  };

  const speak = (word) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setMessage(`The word is ${word}. Fill the missing letters.`);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const speakWord = () => {
    speak(round.word);
    setMessage('Now choose the missing consonant sound you heard.');
  };

  const speakInstructions = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setMessage('Speech is not available. Please ask for help reading the instructions.');
      return;
    }

    if (isReadingInstructions) {
      stopSpeech();
      setMessage('Stopped reading the WordBlast instructions.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(instructionText);
    utterance.rate = 0.8;
    utterance.onend = () => setIsReadingInstructions(false);
    utterance.onerror = () => setIsReadingInstructions(false);
    window.speechSynthesis.speak(utterance);
    setIsReadingInstructions(true);
    setMessage('Reading the WordBlast instructions.');
  };

  const goToNextRound = () => {
    const nextIndex = roundIndex + 1;
    const nextRound = wordDeck[nextIndex % wordDeck.length];
    const nextLevelNumber = getLevelNumber(nextIndex);
    const nextLevel = levelConfig[nextLevelNumber];
    const nextBlankPositions = getBlankPositions(nextRound.word, nextLevel);
    setRoundIndex(nextIndex);
    setChoices(createChoices(nextRound.word[nextBlankPositions[0]], nextLevel.maxTiles));
    setBlankIndex(0);
    setFilledLetters({});
    setSelectedChoice(null);
    setEliminatedChoice(null);
    setIsBlasting(false);
    mistakeThisWordRef.current = false;
    setMessage('Listen to the next word, then fill the missing consonants.');

    if (nextLevelNumber > level) {
      showBanner(`${nextLevel.icon} LEVEL UP! ${nextLevel.label}`, 'levelup', 1600);
    }

    schedule(() => speak(nextRound.word), 450);
  };

  const chooseLetter = (letter) => {
    if (gameOver || isBlasting || selectedChoice || letter === eliminatedChoice) return;

    setSelectedChoice(letter);
    const correctLetter = round.word[blankPositions[blankIndex]];
    if (letter === correctLetter) {
      const nextFilledLetters = { ...filledLetters, [blankPositions[blankIndex]]: letter };
      setFilledLetters(nextFilledLetters);

      if (blankIndex === blankPositions.length - 1) {
        const nextStreak = mistakeThisWordRef.current ? 0 : streak + 1;
        setScore((currentScore) => currentScore + 10);
        setWordsBlasted((current) => current + 1);
        setStreak(nextStreak);
        setBestStreak((current) => Math.max(current, nextStreak));
        setIsBlasting(true);
        addFloater('+10', 'score', 'coin');
        showBanner(nextStreak >= 3 ? `🔥 ${nextStreak} IN A ROW!` : '💥 BLASTED!', 'blast', 1100);
        setMessage(`💥 Word blasted! All ${blankPositions.length} answer tile${blankPositions.length > 1 ? 's are' : ' is'} correct. +10 points.`);
        schedule(goToNextRound, 1200);
        return;
      }

      addFloater('✓', 'word', 'good');
      schedule(() => {
        setBlankIndex((currentIndex) => currentIndex + 1);
        setChoices(createChoices(round.word[blankPositions[blankIndex + 1]], config.maxTiles));
        setSelectedChoice(null);
        setEliminatedChoice(null);
      }, 350);
      setMessage(`Great block! Now place the next missing letter (${blankIndex + 2} of ${blankPositions.length}).`);
      return;
    }

    const nextHearts = hearts - 1;
    mistakeThisWordRef.current = true;
    setHearts(nextHearts);
    setStreak(0);
    shake();
    addFloater('-1 ❤️', 'hearts', 'bad');

    if (nextHearts === 0) {
      setGameOver(true);
      setMessage('No hearts left. Your WordBlast run is over.');
      schedule(() => setScreen('gameover'), 1000);
      return;
    }

    setMessage(`Not quite. -1 heart. ${nextHearts} hearts remaining.`);
    schedule(() => {
      setSelectedChoice(null);
      setMessage('Listen again and choose carefully.');
    }, 850);
  };

  const useHint = () => {
    if (score < 10 || eliminatedChoice || selectedChoice || gameOver) return;
    const wrongChoices = choices.filter((choice) => choice !== round.word[blankPositions[blankIndex]]);
    setScore((currentScore) => currentScore - 10);
    setEliminatedChoice(wrongChoices[0]);
    addFloater('-10', 'score', 'spend');
    setMessage('💡 Hint activated. One incorrect block is out.');
  };

  const restoreHeart = () => {
    if (score < 10 || hearts >= maxHearts || selectedChoice || gameOver) return;
    setScore((currentScore) => currentScore - 10);
    setHearts((currentHearts) => currentHearts + 1);
    addFloater('-10', 'score', 'spend');
    addFloater('+1 ❤️', 'hearts', 'heal');
    setMessage('❤️ One heart restored.');
  };

  const restart = () => {
    clearAllTimers();
    stopSpeech();
    setRoundIndex(0);
    setChoices(createChoices(wordDeck[0].word[firstBlankPosition], levelConfig[1].maxTiles));
    setBlankIndex(0);
    setFilledLetters({});
    setScore(0);
    setHearts(maxHearts);
    setSelectedChoice(null);
    setEliminatedChoice(null);
    setGameOver(false);
    setStreak(0);
    setBestStreak(0);
    setWordsBlasted(0);
    setIsBlasting(false);
    setIsShaking(false);
    setBanner(null);
    setFloaters([]);
    mistakeThisWordRef.current = false;
    setMessage('Listen to the word, then blast its missing consonant.');
  };

  const startGame = () => {
    restart();
    setScreen('playing');
    showBanner(`${levelConfig[1].icon} LEVEL 1: ${levelConfig[1].label}`, 'levelup', 1400);
    schedule(() => speak(wordDeck[0].word), 600);
  };

  const renderFloaters = (anchor) => floaters
    .filter((floater) => floater.anchor === anchor)
    .map((floater) => (
      <span key={floater.id} className={`wb-floater ${floater.kind}`} aria-hidden="true">{floater.text}</span>
    ));

  const renderTopbar = () => (
    <div className="wb-topbar">
      <div className="wb-brand">
        <span className="wb-brand-icon" aria-hidden="true">💥</span>
        <div>
          <h1>WordBlast</h1>
          <span>Listen. Think. Blast the Word!</span>
        </div>
      </div>
      {typeof onClose === 'function' ? (
        <button
          type="button"
          className="wb-ghost-btn"
          onClick={() => {
            clearAllTimers();
            stopSpeech();
            onClose();
          }}
        >
          ← Return to Consonants
        </button>
      ) : null}
    </div>
  );

  const renderIntro = () => (
    <section className="wb-card wb-intro">
      <div className="wb-hero" aria-hidden="true">
        <span className="wb-hero-tile t1">C</span>
        <span className="wb-hero-tile t2">?</span>
        <span className="wb-hero-tile t3">T</span>
        <span className="wb-hero-boom">💥</span>
      </div>

      <div className="wb-intro-header">
        <p className="wb-kicker">Listening + spelling challenge</p>
        <h2>Blast the missing consonants!</h2>
      </div>

      <div className="wb-rules">
        <div className="wb-rule"><span>🔊</span>Listen to the word</div>
        <div className="wb-rule"><span>🧱</span>Pick the missing consonant block</div>
        <div className="wb-rule"><span>🪙</span>Blast a word to earn 10 points</div>
        <div className="wb-rule"><span>💔</span>A wrong block costs 1 heart</div>
        <div className="wb-rule"><span>🛒</span>Spend points on hints or hearts</div>
        <div className="wb-rule"><span>🚀</span>Level up every 5 words</div>
      </div>

      <div className="wb-levels">
        {Object.entries(levelConfig).map(([key, item]) => (
          <div key={key} className="wb-level-chip">
            <span>{item.icon}</span>
            <strong>{item.label}</strong>
            <small>{item.blankCount === 'all' ? 'All blanks' : `${item.blankCount} blank${item.blankCount > 1 ? 's' : ''}`}</small>
          </div>
        ))}
      </div>

      <div className="wb-actions">
        <button type="button" className="wb-secondary-btn" onClick={speakInstructions} aria-pressed={isReadingInstructions}>
          {isReadingInstructions ? '⏹ Stop Reading' : '🔊 Read Instructions Aloud'}
        </button>
        <button type="button" className="wb-primary-btn wb-pulse" onClick={startGame}>
          Start Blasting 💥
        </button>
      </div>
    </section>
  );

  const renderGame = () => {
    const currentBlank = blankPositions[blankIndex];

    return (
      <section className={`wb-game ${isShaking ? 'is-shaking' : ''} ${isBlasting ? 'is-blasting' : ''} ${hearts <= 2 ? 'is-danger' : ''}`}>
        <div className="wb-hud">
          <div className="wb-hud-block wb-hud-level">
            <span className="wb-hud-label">Level {level}</span>
            <strong>{config.icon} {config.label}</strong>
            <div className="wb-level-dots" aria-label={`Level progress ${levelProgress} of ${roundsPerLevel}`}>
              {Array.from({ length: roundsPerLevel }).map((_, i) => (
                <span key={i} className={i < levelProgress ? 'on' : ''} />
              ))}
            </div>
          </div>

          <div className="wb-hud-block wb-hud-hearts">
            <span className="wb-hud-label">Hearts {hearts}/{maxHearts}</span>
            <div className="wb-hearts" aria-label={`${hearts} of ${maxHearts} hearts`}>
              {Array.from({ length: maxHearts }).map((_, i) => (
                <span key={i} className={`wb-heart ${i < hearts ? 'full' : 'empty'}`}>❤️</span>
              ))}
            </div>
            {renderFloaters('hearts')}
          </div>

          <div className="wb-hud-block">
            <span className="wb-hud-label">Streak</span>
            <strong key={streak} className={`wb-pop ${streak >= 3 ? 'wb-on-fire' : ''}`}>
              {streak >= 3 ? '🔥 ' : '⚡ '}{streak}
            </strong>
          </div>

          <div className="wb-hud-block wb-hud-score">
            <span className="wb-hud-label">Points</span>
            <strong key={score} className="wb-pop">🪙 {score}</strong>
            {renderFloaters('score')}
          </div>
        </div>

        <div className="wb-arena">
          {banner ? (
            <div key={banner.id} className={`wb-banner ${banner.kind}`} aria-live="polite">{banner.text}</div>
          ) : null}

          <div className="wb-panel wb-listen-panel">
            <p className="wb-panel-label">Word {roundIndex + 1}</p>
            <div className={`wb-emoji-ring ${isSpeaking ? 'is-speaking' : ''}`}>
              <span className="wb-wave w1" aria-hidden="true" />
              <span className="wb-wave w2" aria-hidden="true" />
              <span className="wb-wave w3" aria-hidden="true" />
              <div key={roundIndex} className="wb-emoji" aria-label={round.word}>{round.emoji}</div>
            </div>
            <h3>What word did you hear?</h3>
            <button type="button" className="wb-listen-btn" onClick={speakWord} disabled={gameOver}>
              🔊 {isSpeaking ? 'Listening...' : 'Listen to word'}
            </button>
            <p key={message} className="wb-message" aria-live="polite">{message}</p>
          </div>

          <div className="wb-panel wb-blast-panel">
            <p className="wb-panel-label">
              Fill {config.blankCount === 'all' ? 'all the blanks' : `${config.blankCount} blank${config.blankCount > 1 ? 's' : ''}`}
              {blankPositions.length > 1 ? ` · ${Math.min(blankIndex + 1, blankPositions.length)} of ${blankPositions.length}` : ''}
            </p>

            <div className="wb-word" aria-label="Word answer pattern">
              {round.word.split('').map((letter, index) => {
                const isBlank = blankPositions.includes(index);
                const isFilled = Boolean(filledLetters[index]);
                const isTarget = isBlank && !isFilled && index === currentBlank && !isBlasting;
                const className = [
                  'wb-tile',
                  isBlank ? 'blank' : 'fixed',
                  isFilled ? 'filled' : '',
                  isTarget ? 'target' : '',
                ].join(' ');

                return (
                  <strong
                    key={`${roundIndex}-${index}-${isFilled ? 'f' : 'e'}`}
                    className={className}
                    style={{ '--i': index }}
                  >
                    {isBlank ? (filledLetters[index] || '?') : letter.toLowerCase()}
                  </strong>
                );
              })}
              {isBlasting ? (
                <div className="wb-burst" aria-hidden="true">
                  {burstAngles.map((angle) => (
                    <span key={angle} style={{ '--angle': `${angle}deg` }} />
                  ))}
                </div>
              ) : null}
              {renderFloaters('word')}
            </div>

            <div
              className={`wb-blocks${config.maxTiles === 5 ? ' expert' : ''}`}
              role="group"
              aria-label={`${config.maxTiles} letter choices`}
            >
              {choices.map((choice, i) => {
                const isSelected = choice === selectedChoice;
                const isCorrect = isSelected && choice === round.word[currentBlank];
                return (
                  <button
                    key={`${roundIndex}-${blankIndex}-${choice}`}
                    type="button"
                    className={[
                      'wb-block',
                      isSelected ? (isCorrect ? 'correct' : 'incorrect') : '',
                      choice === eliminatedChoice ? 'eliminated' : '',
                    ].join(' ')}
                    style={{ '--i': i }}
                    onClick={() => chooseLetter(choice)}
                    disabled={gameOver || isBlasting || Boolean(selectedChoice) || choice === eliminatedChoice}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <section className="wb-shop" aria-label="WordBlast shop">
          <div className="wb-shop-title"><span>🛒 Power-ups</span><small>Spend points to power up</small></div>
          <button
            type="button"
            className="wb-shop-item"
            onClick={useHint}
            disabled={score < 10 || Boolean(eliminatedChoice) || Boolean(selectedChoice) || gameOver}
          >
            <span className="wb-shop-icon">💡</span>
            <span className="wb-shop-text"><strong>Hint</strong><small>Remove one wrong block</small></span>
            <b>🪙 10</b>
          </button>
          <button
            type="button"
            className="wb-shop-item"
            onClick={restoreHeart}
            disabled={score < 10 || hearts >= maxHearts || Boolean(selectedChoice) || gameOver}
          >
            <span className="wb-shop-icon">❤️</span>
            <span className="wb-shop-text"><strong>Health</strong><small>Restore one heart</small></span>
            <b>🪙 10</b>
          </button>
        </section>
      </section>
    );
  };

  const renderGameOver = () => (
    <section className="wb-card wb-gameover">
      <div className="wb-gameover-emoji" aria-hidden="true">💔</div>
      <p className="wb-kicker">Game Over</p>
      <h2>Out of hearts!</h2>
      <p className="wb-gameover-sub">You reached Level {level}: {config.icon} {config.label}</p>
      <div className="wb-stats">
        <div><span>Points</span><strong>🪙 {score}</strong></div>
        <div><span>Words blasted</span><strong>💥 {wordsBlasted}</strong></div>
        <div><span>Best streak</span><strong>🔥 {bestStreak}</strong></div>
      </div>
      <div className="wb-actions">
        {typeof onClose === 'function' ? (
          <button type="button" className="wb-secondary-btn" onClick={() => { stopSpeech(); onClose(); }}>
            Return to Consonants
          </button>
        ) : null}
        <button type="button" className="wb-primary-btn wb-pulse" onClick={startGame}>
          ↻ Play Again
        </button>
      </div>
    </section>
  );

  return (
    <div className="wordblast" aria-label="WordBlast game">
      <div className="wb-shell">
        {renderTopbar()}
        {screen === 'intro' ? renderIntro() : null}
        {screen === 'playing' ? renderGame() : null}
        {screen === 'gameover' ? renderGameOver() : null}
      </div>
    </div>
  );
}
