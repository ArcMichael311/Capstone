import { useEffect, useState } from 'react';
import './CVCWords.css';
import './CVCPage.css';
import { speakText } from './speechUtils';
import VoicePractice from '../../VoicePractice/VoicePractice';
import VideoEpisodes from '../shared/VideoEpisodes';
import BalloonPop from './BalloonPop';

const videos = [
  {
    id: 1,
    title: 'CVC Phonics Song',
    description: 'Source: KidsTV123 (YouTube)',
    url: '/cvc-video/video1.mp4',
    duration: '5:36',
  },
];

const wordFamilies = [
  {
    family: '-ab',
    icon: '🚙',
    words: [
      { word: 'cab', icon: '🚕', description: 'A taxi for carrying people' },
      { word: 'jab', icon: '🪓', description: 'A quick poke or hit' },
      { word: 'dab', icon: '🎨', description: 'A quick touch or stroke' },
      { word: 'tab', icon: '📑', description: 'A small label or flap' },
      { word: 'gab', icon: '💬', description: 'A talk or chat' },
      { word: 'nab', icon: '🖐️', description: 'To grab quickly' },
    ],
  },
  {
    family: '-ag',
    icon: '👜',
    words: [
      { word: 'bag', icon: '👜', description: 'A container for carrying items' },
      { word: 'tag', icon: '🏷️', description: 'A label attached to something' },
      { word: 'wag', icon: '🐕', description: 'A side-to-side movement' },
      { word: 'nag', icon: '🗣️', description: 'To keep complaining' },
      { word: 'rag', icon: '🧼', description: 'A cloth used for cleaning' },
      { word: 'lag', icon: '🕒', description: 'A delay in moving' },
    ],
  },
  {
    family: '-an',
    icon: '🐻',
    words: [
      { word: 'man', icon: '🧑', description: 'A grown-up person' },
      { word: 'fan', icon: '🪭', description: 'It moves air when it spins' },
      { word: 'pan', icon: '🍳', description: 'Used for cooking food' },
      { word: 'can', icon: '🥫', description: 'A metal container' },
      { word: 'van', icon: '🚐', description: 'A vehicle for carrying people' },
      { word: 'ran', icon: '🏃', description: 'Moved quickly on foot' },
    ],
  },
  {
    family: '-at',
    icon: '🐱',
    words: [
      { word: 'cat', icon: '🐱', description: 'A funny pet that says meow' },
      { word: 'bat', icon: '🦇', description: 'A night flyer with tiny wings' },
      { word: 'hat', icon: '🎩', description: 'Something you wear on your head' },
      { word: 'mat', icon: '🧶', description: 'A soft pad on the floor' },
      { word: 'rat', icon: '🐭', description: 'A small mouse-like animal' },
      { word: 'sat', icon: '🪑', description: 'Rested in a seated position' },
    ],
  },
  {
    family: '-en',
    icon: '🖊️',
    words: [
      { word: 'den', icon: '🦊', description: 'A small animal shelter' },
      { word: 'pen', icon: '🖊️', description: 'A tool used for writing' },
      { word: 'hen', icon: '🐔', description: 'A chicken that lays eggs' },
      { word: 'ten', icon: '🔟', description: 'The number after nine' },
      { word: 'men', icon: '🧑‍🤝‍🧑', description: 'More than one man' },
      { word: 'net', icon: '🎣', description: 'A tool used to catch fish' },
    ],
  },
  {
    family: '-et',
    icon: '✈️',
    words: [
      { word: 'bet', icon: '🎲', description: 'A guess about a result' },
      { word: 'met', icon: '🤝', description: 'Reached or encountered' },
      { word: 'get', icon: '🏃', description: 'To receive or fetch' },
      { word: 'jet', icon: '✈️', description: 'A fast flying plane' },
      { word: 'pet', icon: '🐶', description: 'A friendly animal kept at home' },
      { word: 'wet', icon: '💧', description: 'Covered in water' },
    ],
  },
  {
    family: '-ip',
    icon: '💋',
    words: [
      { word: 'dip', icon: '🥄', description: 'To put something down briefly' },
      { word: 'hip', icon: '🦴', description: 'The top part of the leg' },
      { word: 'lip', icon: '💋', description: 'The soft part around the mouth' },
      { word: 'tip', icon: '🧭', description: 'The end or point of something' },
      { word: 'zip', icon: '⚡', description: 'To close quickly with a fastener' },
      { word: 'sip', icon: '🥤', description: 'To drink in a small amount' },
    ],
  },
  {
    family: '-ot',
    icon: '🌱',
    words: [
      { word: 'cot', icon: '🛏️', description: 'A small bed for a baby' },
      { word: 'dot', icon: '•', description: 'A tiny round mark' },
      { word: 'hot', icon: '🔥', description: 'Very warm or heated' },
      { word: 'pot', icon: '🍲', description: 'A cooking container' },
      { word: 'lot', icon: '🎫', description: 'A group of things' },
      { word: 'not', icon: '🚫', description: 'A word meaning no' },
    ],
  },
  {
    family: '-ug',
    icon: '🐞',
    words: [
      { word: 'bug', icon: '🐞', description: 'A tiny insect' },
      { word: 'mug', icon: '☕', description: 'A cup for hot drinks' },
      { word: 'hug', icon: '🤗', description: 'To hold tightly' },
      { word: 'tug', icon: '🧵', description: 'A strong pull' },
      { word: 'rug', icon: '🧶', description: 'A soft floor covering' },
      { word: 'dug', icon: '⛏️', description: 'Made a hole in the ground' },
    ],
  },
  {
    family: '-un',
    icon: '☀️',
    words: [
      { word: 'bun', icon: '🥯', description: 'A sweet bread roll' },
      { word: 'run', icon: '🏃', description: 'Move quickly on foot' },
      { word: 'sun', icon: '☀️', description: 'The bright star in the sky' },
      { word: 'fun', icon: '🎉', description: 'Something enjoyable' },
      { word: 'nun', icon: '👩‍🦳', description: 'A religious woman' },
      { word: 'gun', icon: '🔫', description: 'A weapon that fires bullets' },
    ],
  },
];

const wordSelection = [
  { word: 'dog', icon: '🐶', prompt: 'A pet that barks', choices: ['Log', 'Dog', 'Fog'], correct: 'Dog' },
  { word: 'cat', icon: '🐱', prompt: 'A funny pet that says meow', choices: ['Hat', 'Cat', 'Mat'], correct: 'Cat' },
  { word: 'pig', icon: '🐷', prompt: 'A farm animal that oinks', choices: ['Pig', 'Fig', 'Dig'], correct: 'Pig' },
  { word: 'bat', icon: '🦇', prompt: 'A night flyer with tiny wings', choices: ['Bat', 'Rat', 'Hat'], correct: 'Bat' },
  { word: 'sun', icon: '☀️', prompt: 'The bright star in the sky', choices: ['Sun', 'Run', 'Fun'], correct: 'Sun' },
  { word: 'map', icon: '🗺️', prompt: 'A picture that shows where places are', choices: ['Map', 'Mop', 'Cap'], correct: 'Map' },
  { word: 'hen', icon: '🐔', prompt: 'A female chicken', choices: ['Hen', 'Pen', 'Ten'], correct: 'Hen' },
  { word: 'fox', icon: '🦊', prompt: 'A clever animal with a bushy tail', choices: ['Fox', 'Box', 'Fix'], correct: 'Fox' },
  { word: 'jam', icon: '🍓', prompt: 'A sweet spread made from fruit', choices: ['Jam', 'Ham', 'Jet'], correct: 'Jam' },
  { word: 'bed', icon: '🛏️', prompt: 'A place where you sleep', choices: ['Bed', 'Red', 'Bad'], correct: 'Bed' },
  { word: 'bag', icon: '👜', prompt: 'A container you carry your things in', choices: ['Bag', 'Tag', 'Bug'], correct: 'Bag' },
  { word: 'car', icon: '🚗', prompt: 'A vehicle with four wheels', choices: ['Car', 'Cat', 'Cap'], correct: 'Car' },
  { word: 'bus', icon: '🚌', prompt: 'A big vehicle that carries many people', choices: ['Bus', 'Bun', 'Bug'], correct: 'Bus' },
  { word: 'tree', icon: '🌳', prompt: 'A tall plant with branches and leaves', choices: ['Tree', 'Three', 'Bee'], correct: 'Tree' },
];

const shuffleItems = (items) => {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[randomIndex]] = [shuffledItems[randomIndex], shuffledItems[index]];
  }

  return shuffledItems;
};

const createSelectionDeck = () => shuffleItems(wordSelection).map((item) => ({
  ...item,
  choices: shuffleItems(item.choices),
}));

const familyColors = {
  '-ab': '#f4b942',
  '-ag': '#f65a4a',
  '-an': '#49b9d8',
  '-at': '#f39b4a',
  '-en': '#e0b43f',
  '-et': '#ef5da8',
  '-ip': '#eb7e3b',
  '-ot': '#c88d52',
  '-ug': '#e67ca7',
  '-un': '#8b5cf6',
};

const confettiColors = ['#f97316', '#fbbf24', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'];
const confettiPieces = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 29) % 100,
  delay: (i % 10) * 0.12,
  duration: 2.2 + (i % 5) * 0.35,
  color: confettiColors[i % confettiColors.length],
}));

// Split a word into its onset and family ending ("cab" -> ["c", "ab"]) when it belongs to the family.
const splitByFamily = (word, family) => {
  const rime = family.replace('-', '');
  return word.endsWith(rime) ? [word.slice(0, word.length - rime.length), rime] : [word, ''];
};

const getQuizStars = (score, total) => {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  if (ratio > 0) return 1;
  return 0;
};

export default function CVCWords({ onComplete, onNavigate, initialVideosWatched = [], onVideosWatchedChange, initialType = 'learning' }) {
  const [activeType, setActiveType] = useState(initialType);
  const [selectedFamily, setSelectedFamily] = useState(wordFamilies[0].family);
  const [selectedWord, setSelectedWord] = useState(wordFamilies[0].words[0]);
  const [selectionDeck, setSelectionDeck] = useState(createSelectionDeck);
  const [selectionIndex, setSelectionIndex] = useState(0);
  const [selectionResult, setSelectionResult] = useState(null);
  const [selectionMessage, setSelectionMessage] = useState('');
  const [feedback, setFeedback] = useState('Tap a word to hear it.');
  const [videosWatched, setVideosWatched] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);
  const [showVoicePractice, setShowVoicePractice] = useState(false);
  const [isReadingSelectionWord, setIsReadingSelectionWord] = useState(false);

  // Gamification state
  const [exploredFamilies, setExploredFamilies] = useState([wordFamilies[0].family]);
  const [heardWords, setHeardWords] = useState([]);
  const [wrongPicks, setWrongPicks] = useState([]);
  const [firstTryScore, setFirstTryScore] = useState(0);
  const [selectionStreak, setSelectionStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selectionDone, setSelectionDone] = useState(false);
  const [wordTap, setWordTap] = useState(0);

  useEffect(() => {
    setVideosWatched(Array.isArray(initialVideosWatched) ? initialVideosWatched : []);
  }, [initialVideosWatched]);

  useEffect(() => {
    setActiveType(initialType);
  }, [initialType]);

  const currentSelection = selectionDeck[selectionIndex];
  const currentFamily = wordFamilies.find((item) => item.family === selectedFamily) ?? wordFamilies[0];
  const totalFamilyWords = wordFamilies.reduce((sum, family) => sum + family.words.length, 0);

  const speakSelectionWord = () => {
    const didSpeak = speakText(currentSelection.word, {
      rate: 0.85,
      onend: () => setIsReadingSelectionWord(false),
      onerror: () => setIsReadingSelectionWord(false),
    });

    if (!didSpeak) {
      setIsReadingSelectionWord(false);
      setFeedback(`Hear the word: ${currentSelection.word}.`);
      return;
    }

    setIsReadingSelectionWord(true);
    setFeedback(`Listening to ${currentSelection.word}.`);
  };

  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const handleVideoWatched = (videoId) => {
    setVideosWatched((currentVideos) => {
      if (currentVideos.includes(videoId)) {
        return currentVideos;
      }

      const nextVideos = [...currentVideos, videoId];

      if (typeof onVideosWatchedChange === 'function') {
        onVideosWatchedChange(nextVideos);
      }

      return nextVideos;
    });
  };

  const handlePlayVideo = (index) => {
    setCurrentVideoIndex(index);
  };

  const handleVideoEnd = (videoId) => {
    handleVideoWatched(videoId);
  };

  const closeVideoPlayer = () => {
    setCurrentVideoIndex(null);
  };

  const markHeard = (familyKey, word) => {
    const key = `${familyKey}-${word}`;
    setHeardWords((current) => (current.includes(key) ? current : [...current, key]));
  };

  const handleFamilyPick = (family) => {
    setSelectedFamily(family);
    setExploredFamilies((current) => (current.includes(family) ? current : [...current, family]));
    const nextFamily = wordFamilies.find((item) => item.family === family) ?? wordFamilies[0];
    setSelectedWord(nextFamily.words[0]);
    setShowVoicePractice(false);
    setFeedback(`Selected ${family} family.`);
  };

  const handleWordPick = (item) => {
    setSelectedWord(item);
    setWordTap((current) => current + 1);
    markHeard(selectedFamily, item.word);
    speakText(item.word, { rate: 0.9 });
    setFeedback(`Speaking ${item.word}.`);
  };

  const handleSelectionPick = (choice) => {
    if (selectionResult === 'correct' || wrongPicks.includes(choice)) return;

    if (choice !== currentSelection.correct) {
      setWrongPicks((current) => [...current, choice]);
      setSelectionResult('wrong');
      setSelectionMessage(`Oops! "${choice}" is not it. Try again.`);
      setSelectionStreak(0);
      setFeedback('');
      return;
    }

    const isFirstTry = wrongPicks.length === 0;
    if (isFirstTry) {
      const nextStreak = selectionStreak + 1;
      setFirstTryScore((current) => current + 1);
      setSelectionStreak(nextStreak);
      setBestStreak((current) => Math.max(current, nextStreak));
    }

    setSelectionResult('correct');
    setSelectionMessage(isFirstTry ? 'Correct! First try! ⭐' : 'Correct! You found it!');
    setFeedback('');
    speakText(currentSelection.correct, { rate: 0.85 });
  };

  const resetSelectionQuestion = () => {
    setSelectionResult(null);
    setSelectionMessage('');
    setWrongPicks([]);
    setIsReadingSelectionWord(false);
    setFeedback('');
  };

  const handleNextSelection = () => {
    const nextIndex = selectionIndex + 1;

    if (nextIndex >= selectionDeck.length) {
      setSelectionDone(true);

      if (typeof onComplete === 'function') {
        onComplete();
      }
      return;
    }

    setSelectionIndex(nextIndex);
    resetSelectionQuestion();
  };

  const restartSelection = () => {
    setSelectionDeck(createSelectionDeck());
    setSelectionIndex(0);
    setFirstTryScore(0);
    setSelectionStreak(0);
    setBestStreak(0);
    setSelectionDone(false);
    resetSelectionQuestion();
  };

  const goTo = (section) => {
    if (typeof onNavigate === 'function') {
      onNavigate('cvc', section);
      return;
    }
    setActiveType(section);
  };

  const renderHero = ({ icon, title, subtitle, stat }) => (
    <header className="cv-hero">
      <span className="cv-hero-icon" aria-hidden="true">{icon}</span>
      <div className="cv-hero-copy">
        <span className="cv-kicker">🗺️ Word Kingdom</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {stat}
    </header>
  );

  const renderStat = (value, total, label) => (
    <div className="cv-hero-stat">
      <strong key={value} className="cv-pop">{value}<small>/{total}</small></strong>
      <span>{label}</span>
      <div className="cv-meter"><div style={{ '--p': `${total > 0 ? (value / total) * 100 : 0}%` }} /></div>
    </div>
  );

  const renderLearningMaterials = () => (
    <>
      {renderHero({
        icon: '🎬',
        title: 'Learning Video',
        subtitle: 'Watch the CVC video to unlock the word activities!',
        stat: renderStat(videosWatched.length, videos.length, 'Videos watched'),
      })}

      <VideoEpisodes
        videos={videos}
        watchedIds={videosWatched}
        currentIndex={currentVideoIndex}
        onPlay={handlePlayVideo}
        onClose={closeVideoPlayer}
        onPrevious={() => setCurrentVideoIndex((index) => (index > 0 ? index - 1 : index))}
        onNext={() => setCurrentVideoIndex((index) => (index < videos.length - 1 ? index + 1 : index))}
        onEnded={handleVideoEnd}
        unlockTitle="CVC Word Activities"
        unlockActionLabel="Go to Word Families ▶"
        onUnlockAction={() => goTo('families')}
      />
    </>
  );

  const renderFamilies = () => {
    const [onset, rime] = splitByFamily(selectedWord.word, currentFamily.family);
    const heardInFamily = currentFamily.words.filter((item) => heardWords.includes(`${currentFamily.family}-${item.word}`)).length;

    return (
      <>
        {renderHero({
          icon: '👪',
          title: 'Simpler CVC Words',
          subtitle: 'Pick a word family and hear how the words rhyme!',
          stat: renderStat(heardWords.length, totalFamilyWords, 'Words heard'),
        })}

        <div className="cv-family-picker" aria-label="Word family selector">
          {wordFamilies.map((familyItem, index) => {
            const heardCount = familyItem.words.filter((item) => heardWords.includes(`${familyItem.family}-${item.word}`)).length;
            const isDone = heardCount === familyItem.words.length;
            return (
              <button
                key={familyItem.family}
                type="button"
                className={[
                  'cv-family-chip',
                  familyItem.family === selectedFamily ? 'active' : '',
                  exploredFamilies.includes(familyItem.family) ? 'explored' : '',
                ].join(' ')}
                style={{ '--c': familyColors[familyItem.family] || '#f97316', '--i': index }}
                onClick={() => handleFamilyPick(familyItem.family)}
              >
                <span className="cv-family-chip-icon" aria-hidden="true">{familyItem.icon}</span>
                <strong>{familyItem.family}</strong>
                <small>{isDone ? '🏅' : `${heardCount}/${familyItem.words.length}`}</small>
              </button>
            );
          })}
        </div>

        <section className="cv-family-stage" style={{ '--c': familyColors[currentFamily.family] || '#f97316' }}>
          <div className="cv-word-wall">
            <div className="cv-wall-head">
              <h2><span>{currentFamily.family}</span> family</h2>
              <span className="cv-chip">{heardInFamily === currentFamily.words.length ? '🏅 All heard!' : `🔊 ${heardInFamily}/${currentFamily.words.length} heard`}</span>
            </div>
            <div className="cv-word-grid">
              {currentFamily.words.map((item, index) => {
                const [itemOnset, itemRime] = splitByFamily(item.word, currentFamily.family);
                const heard = heardWords.includes(`${currentFamily.family}-${item.word}`);
                return (
                  <button
                    key={`${currentFamily.family}-${item.word}`}
                    type="button"
                    className={[
                      'cv-word-card',
                      item.word === selectedWord.word ? 'active' : '',
                      heard ? 'heard' : '',
                    ].join(' ')}
                    style={{ '--i': index }}
                    onClick={() => handleWordPick(item)}
                    aria-label={`Hear the word ${item.word}`}
                  >
                    <span className="cv-word-card-icon" aria-hidden="true">{item.icon}</span>
                    <span className="cv-word-card-text">
                      {itemOnset}<b>{itemRime}</b>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="cv-spotlight">
            {wordTap > 0 ? <span key={wordTap} className="cv-ripple" aria-hidden="true" /> : null}
            <button
              type="button"
              key={`${selectedWord.word}-icon`}
              className="cv-spotlight-icon"
              onClick={() => handleWordPick(selectedWord)}
              aria-label={`Hear the word ${selectedWord.word}`}
            >
              {selectedWord.icon}
            </button>
            <div key={selectedWord.word} className="cv-blocks" aria-label={selectedWord.word}>
              {[...onset].map((letter, index) => (
                <span key={`o-${index}`} className="cv-block onset" style={{ '--i': index }}>{letter}</span>
              ))}
              {[...rime].map((letter, index) => (
                <span key={`r-${index}`} className="cv-block rime" style={{ '--i': onset.length + index }}>{letter}</span>
              ))}
            </div>
            <p className="cv-spotlight-desc">{selectedWord.description}</p>
            <div className="cv-spotlight-actions">
              <button type="button" className="cv-btn" onClick={() => handleWordPick(selectedWord)}>
                🔊 Hear Word
              </button>
              <button
                type="button"
                className={`cv-btn cv-btn-mic ${showVoicePractice ? 'active' : ''}`}
                onClick={() => setShowVoicePractice(!showVoicePractice)}
                aria-expanded={showVoicePractice}
              >
                🎤 {showVoicePractice ? 'Hide Practice' : 'Practice'}
              </button>
            </div>
            <p key={feedback} className="cv-feedback" aria-live="polite">{feedback}</p>
          </div>
        </section>

        {showVoicePractice && (
          <div className="cv-voice-panel">
            <VoicePractice
              targetWord={selectedWord.word}
              onResult={(result) => {
                if (result.success) {
                  setFeedback(`Great! You pronounced "${selectedWord.word}" correctly!`);
                } else {
                  setFeedback(result.feedback);
                }
              }}
              showTranscript={true}
            />
          </div>
        )}
      </>
    );
  };

  const renderSelectionResult = () => {
    const total = selectionDeck.length;
    const stars = getQuizStars(firstTryScore, total);
    const titles = ['Keep practicing!', 'Good try!', 'Great job!', 'Word Wizard!'];
    const emojis = ['💪', '👍', '🎉', '🏆'];

    return (
      <section className="cv-result">
        {stars >= 2 ? (
          <div className="cv-confetti" aria-hidden="true">
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
        <span className="cv-result-emoji" aria-hidden="true">{emojis[stars]}</span>
        <span className="cv-kicker cv-kicker-dark">Word set complete</span>
        <h1>{titles[stars]}</h1>
        <div className="cv-result-stars" aria-label={`${stars} of 3 stars`}>
          {[1, 2, 3].map((value) => (
            <span key={value} className={value <= stars ? 'earned' : ''} style={{ '--i': value }}>★</span>
          ))}
        </div>
        <div className="cv-result-stats">
          <div><span>First-try correct</span><strong>⭐ {firstTryScore}/{total}</strong></div>
          <div><span>Best streak</span><strong>🔥 {bestStreak}</strong></div>
        </div>
        <div className="cv-result-actions">
          <button type="button" className="cv-btn cv-btn-soft" onClick={() => goTo('families')}>
            👪 Word Families
          </button>
          <button type="button" className="cv-btn" onClick={restartSelection}>
            ↻ Play Again
          </button>
        </div>
      </section>
    );
  };

  const renderSelection = () => {
    const isCorrect = selectionResult === 'correct';

    return (
      <>
        {renderHero({
          icon: '✅',
          title: 'CVC Word Selection',
          subtitle: 'Look at the picture and pick the right word!',
          stat: (
            <div className="cv-hero-stat">
              <strong key={firstTryScore} className="cv-pop">⭐ {firstTryScore}</strong>
              <span>First-try correct</span>
              {selectionStreak >= 2 ? <span key={selectionStreak} className="cv-streak">🔥 {selectionStreak} in a row</span> : null}
            </div>
          ),
        })}

        {selectionDone ? renderSelectionResult() : (
          <>
            <div className="cv-dots" aria-label={`Word ${selectionIndex + 1} of ${selectionDeck.length}`}>
              {selectionDeck.map((item, index) => (
                <span
                  key={item.word}
                  className={index === selectionIndex ? 'current' : index < selectionIndex ? 'done' : ''}
                />
              ))}
            </div>

            <section key={currentSelection.word} className={`cv-quiz ${isCorrect ? 'is-correct' : ''}`}>
              <span className="cv-quiz-count">Word {selectionIndex + 1} of {selectionDeck.length}</span>

              <button
                type="button"
                className={`cv-quiz-picture ${isReadingSelectionWord ? 'speaking' : ''}`}
                onClick={speakSelectionWord}
                aria-label={`Hear the word ${currentSelection.word}`}
                title="Click to hear the word"
              >
                <span className="cv-wave w1" aria-hidden="true" />
                <span className="cv-wave w2" aria-hidden="true" />
                <span className="cv-quiz-emoji">{currentSelection.icon}</span>
                <span className="cv-quiz-hear">🔊 Tap to hear</span>
              </button>

              <p className="cv-quiz-prompt">{currentSelection.prompt}</p>

              <div className="cv-choices" aria-label="Word selection choices">
                {currentSelection.choices.map((choice, index) => {
                  const isWrong = wrongPicks.includes(choice);
                  const isAnswer = isCorrect && choice === currentSelection.correct;
                  return (
                    <button
                      key={choice}
                      type="button"
                      className={['cv-choice', isWrong ? 'wrong' : '', isAnswer ? 'correct' : ''].join(' ')}
                      style={{ '--i': index }}
                      onClick={() => handleSelectionPick(choice)}
                      disabled={isWrong || isCorrect}
                    >
                      {isAnswer ? '✓ ' : isWrong ? '✗ ' : ''}{choice}
                    </button>
                  );
                })}
              </div>

              {selectionMessage ? (
                <p key={selectionMessage} className={`cv-quiz-message ${isCorrect ? 'correct' : 'wrong'}`} aria-live="polite">
                  {selectionMessage}
                </p>
              ) : <p className="cv-quiz-message" aria-hidden="true" />}

              {isCorrect ? (
                <>
                  <div className="cv-burst" aria-hidden="true">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                      <span key={angle} style={{ '--angle': `${angle}deg` }} />
                    ))}
                  </div>
                  <button type="button" className="cv-btn cv-next" onClick={handleNextSelection}>
                    {selectionIndex + 1 >= selectionDeck.length ? 'Finish 🏁' : 'Next Word ›'}
                  </button>
                </>
              ) : null}
            </section>
          </>
        )}
      </>
    );
  };

  if (activeType === 'building') {
    return <BalloonPop onClose={() => setActiveType('learning')} />;
  }

  return (
    <div className="cv-page">
      {activeType === 'families'
        ? renderFamilies()
        : activeType === 'selection'
          ? renderSelection()
          : renderLearningMaterials()}
    </div>
  );
}
