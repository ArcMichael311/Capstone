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

const levelConfig = {
  1: { label: 'Starter', blankCount: 1, maxTiles: 4 },
  2: { label: 'Explorer', blankCount: 2, maxTiles: 4 },
  3: { label: 'Challenger', blankCount: 3, maxTiles: 4 },
  4: { label: 'Expert', blankCount: 'all', maxTiles: 5 },
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

const firstBlankPosition = getBlankPositions(wordDeck[0].word, levelConfig[1])[0];

export default function WordBlast({ onClose }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [choices, setChoices] = useState(() => createChoices(wordDeck[0].word[firstBlankPosition], levelConfig[1].maxTiles));
  const [blankIndex, setBlankIndex] = useState(0);
  const [filledLetters, setFilledLetters] = useState({});
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(10);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [eliminatedChoice, setEliminatedChoice] = useState(null);
  const [message, setMessage] = useState('Listen to the word, then blast its missing consonant.');
  const [gameOver, setGameOver] = useState(false);
  const [isReadingInstructions, setIsReadingInstructions] = useState(false);
  const nextRoundTimer = useRef(null);

  const round = wordDeck[roundIndex % wordDeck.length];
  const level = Math.floor(roundIndex / 5) + 1;
  const config = levelConfig[Math.min(level, 4)];
  const blankPositions = getBlankPositions(round.word, config);
  const instructionText = 'Welcome to Word Blast. Listen to the word. Choose the missing consonant from the letter blocks. Correct answers give you ten points. Wrong answers remove one heart. You can use ten points for a hint or to restore one heart.';

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsReadingInstructions(false);
  };

  useEffect(() => () => {
    window.clearTimeout(nextRoundTimer.current);
    stopSpeech();
  }, []);

  const speakWord = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setMessage(`The word is ${round.word}. Fill the missing letters.`);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(round.word);
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
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
    setRoundIndex(nextIndex);
    const nextRound = wordDeck[nextIndex % wordDeck.length];
    const nextLevel = levelConfig[Math.min(Math.floor(nextIndex / 5) + 1, 4)];
    const nextBlankPositions = getBlankPositions(nextRound.word, nextLevel);
    setChoices(createChoices(nextRound.word[nextBlankPositions[0]], nextLevel.maxTiles));
    setBlankIndex(0);
    setFilledLetters({});
    setSelectedChoice(null);
    setEliminatedChoice(null);
    setMessage('Listen to the next word, then fill the missing consonants.');
  };

  const chooseLetter = (letter) => {
    if (gameOver || selectedChoice || letter === eliminatedChoice) return;

    setSelectedChoice(letter);
    const correctLetter = round.word[blankPositions[blankIndex]];
    if (letter === correctLetter) {
      const nextFilledLetters = { ...filledLetters, [blankPositions[blankIndex]]: letter };
      setFilledLetters(nextFilledLetters);

      if (blankIndex === blankPositions.length - 1) {
        setScore((currentScore) => currentScore + 10);
        setMessage(`💥 Word blasted! All ${blankPositions.length} answer tile${blankPositions.length > 1 ? 's are' : ' is'} correct. +10 points.`);
        nextRoundTimer.current = window.setTimeout(goToNextRound, 850);
        return;
      }

      setBlankIndex((currentIndex) => currentIndex + 1);
      setChoices(createChoices(round.word[blankPositions[blankIndex + 1]], config.maxTiles));
      setSelectedChoice(null);
      setEliminatedChoice(null);
      setMessage(`Great block! Now place the next missing letter (${blankIndex + 2} of ${blankPositions.length}).`);
      return;
    }

    if (letter !== correctLetter) {
      const nextHearts = hearts - 1;
      setHearts(nextHearts);
      if (nextHearts === 0) {
        setGameOver(true);
        setMessage('No hearts left. Your WordBlast run is over.');
        return;
      }

      setMessage(`Not quite. -1 heart. ${nextHearts} hearts remaining.`);
      nextRoundTimer.current = window.setTimeout(() => {
        setSelectedChoice(null);
        setMessage('Listen again and choose carefully.');
      }, 850);
    }
  };

  const useHint = () => {
    if (score < 10 || eliminatedChoice || selectedChoice || gameOver) return;
    const wrongChoices = choices.filter((choice) => choice !== round.word[blankPositions[blankIndex]]);
    setScore((currentScore) => currentScore - 10);
    setEliminatedChoice(wrongChoices[0]);
    setMessage('Hint activated. One incorrect block is out.');
  };

  const restoreHeart = () => {
    if (score < 10 || hearts >= 10 || selectedChoice || gameOver) return;
    setScore((currentScore) => currentScore - 10);
    setHearts((currentHearts) => currentHearts + 1);
    setMessage('❤️ One heart restored.');
  };

  const restart = () => {
    window.clearTimeout(nextRoundTimer.current);
    setRoundIndex(0);
    setChoices(createChoices(wordDeck[0].word[firstBlankPosition], levelConfig[1].maxTiles));
    setBlankIndex(0);
    setFilledLetters({});
    setScore(0);
    setHearts(10);
    setSelectedChoice(null);
    setEliminatedChoice(null);
    setGameOver(false);
    setMessage('Listen to the word, then blast its missing consonant.');
  };

  return (
    <section className="wordblast" aria-label="WordBlast game">
      <header className="wordblast-header">
        <div>
          <p className="wordblast-kicker">Listening + spelling challenge</p>
          <h2>WordBlast</h2>
          <p>Listen. Think. Blast the Word!</p>
          <button type="button" className="wordblast-instructions" onClick={speakInstructions} aria-pressed={isReadingInstructions}>
            {isReadingInstructions ? '⏹ Stop Reading' : '🔊 Read Instructions Aloud'}
          </button>
        </div>
        <div className="wordblast-score"><span>Points</span><strong>{score}</strong></div>
      </header>

      {typeof onClose === 'function' ? (
        <button type="button" className="wordblast-close" onClick={() => {
          stopSpeech();
          onClose();
        }}>
          ← Return to Consonants
        </button>
      ) : null}

      <div className="wordblast-progress">
        <span>Round {roundIndex + 1} <b>Level {Math.min(level, 4)}: {config.label}</b></span>
        <span className="wordblast-tile-limit">Max tiles: {config.maxTiles}</span>
        <span className="wordblast-hearts" aria-label={`${hearts} of 10 hearts`}>{'❤️'.repeat(hearts)}<span>{'♡'.repeat(10 - hearts)}</span></span>
      </div>

      <div className="wordblast-board">
        <div className="wordblast-listen-side">
          <div className="wordblast-emoji" aria-label={round.word}>{round.emoji}</div>
          <h3>What word did you hear?</h3>
          <button type="button" className="wordblast-listen" onClick={speakWord} disabled={gameOver}>🔊 Listen to word</button>
          <p aria-live="polite">{message}</p>
        </div>

        <div className="wordblast-answer-side">
          <div className="wordblast-word" aria-label="Word answer pattern">
            {round.word.split('').map((letter, index) => (
              <strong key={`${letter}-${index}`} className={blankPositions.includes(index) ? 'wordblast-blank' : 'wordblast-fixed'}>
                {blankPositions.includes(index) ? (filledLetters[index] || '?') : letter.toLowerCase()}
              </strong>
            ))}
          </div>
          <p>Fill {config.blankCount === 'all' ? 'all the blanks' : `${config.blankCount} blank${config.blankCount > 1 ? 's' : ''}`} from the blocks</p>
          <div className={`wordblast-blocks${config.maxTiles === 5 ? ' expert-blocks' : ''}`} role="group" aria-label={`${config.maxTiles} letter choices`}>
            {choices.map((choice) => (
              <button
                key={choice}
                type="button"
                className={`wordblast-block${choice === selectedChoice ? (choice === round.word[blankPositions[blankIndex]] ? ' correct' : ' incorrect') : ''}${choice === eliminatedChoice ? ' eliminated' : ''}`}
                onClick={() => chooseLetter(choice)}
                disabled={gameOver || Boolean(selectedChoice) || choice === eliminatedChoice}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="wordblast-shop" aria-label="WordBlast shop">
        <div className="wordblast-shop-title"><span>🛒 Shop</span><small>Use points to power up</small></div>
        <button type="button" className="wordblast-shop-item" onClick={useHint} disabled={score < 10 || Boolean(eliminatedChoice) || Boolean(selectedChoice) || gameOver}>
          <strong>💡 Hint</strong><span>Remove one wrong choice</span><b>10 pts</b>
        </button>
        <button type="button" className="wordblast-shop-item" onClick={restoreHeart} disabled={score < 10 || hearts >= 10 || Boolean(selectedChoice) || gameOver}>
          <strong>❤️ Health</strong><span>Restore one heart</span><b>10 pts</b>
        </button>
      </section>

      {gameOver ? <button type="button" className="wordblast-restart" onClick={restart}>↻ Restart WordBlast</button> : null}
    </section>
  );
}