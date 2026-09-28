import { useEffect, useState } from 'react';
import './Vowels.css';
import './VowelsPage.css';
import DoubleVowelLesson from './DoubleVowelLesson';
import VowelRush from './VowelRush';
import VoicePractice from '../../VoicePractice/VoicePractice';

const vowels = [
  { letter: 'A', sound: 'ah', word: 'Cat', icon: '🐱' },
  { letter: 'E', sound: 'eh', word: 'Egg', icon: '🥚' },
  { letter: 'I', sound: 'ih', word: 'Ice', icon: '🧊' },
  { letter: 'O', sound: 'oh', word: 'Owl', icon: '🦉' },
  { letter: 'U', sound: 'uh', word: 'Umbrella', icon: '☂️' },
];

const vowelTeamBoards = {
  A: [
    { team: 'ain', word: 'rain' },
    { team: 'ail', word: 'tail' },
    { team: 'aid', word: 'maid' },
    { team: 'ait', word: 'bait' },
    { team: 'ake', word: 'cake' },
    { team: 'ate', word: 'gate' },
    { team: 'ame', word: 'game' },
    { team: 'ane', word: 'plane' },
  ],
  E: [
    { team: 'each', word: 'peach' },
    { team: 'eat', word: 'meat' },
    { team: 'ead', word: 'bread' },
    { team: 'eam', word: 'team' },
    { team: 'eep', word: 'sleep' },
    { team: 'ean', word: 'bean' },
    { team: 'eel', word: 'wheel' },
    { team: 'ear', word: 'pear' },
  ],
  I: [
    { team: 'igh', word: 'light' },
    { team: 'ice', word: 'rice' },
    { team: 'ide', word: 'slide' },
    { team: 'ime', word: 'time' },
    { team: 'ine', word: 'pine' },
    { team: 'ipe', word: 'pipe' },
    { team: 'ire', word: 'fire' },
    { team: 'ite', word: 'kite' },
  ],
  O: [
    { team: 'oat', word: 'boat' },
    { team: 'oak', word: 'oak' },
    { team: 'oap', word: 'soap' },
    { team: 'oad', word: 'road' },
    { team: 'oar', word: 'oar' },
    { team: 'oal', word: 'goal' },
    { team: 'ore', word: 'shore' },
    { team: 'one', word: 'stone' },
  ],
  U: [
    { team: 'ue', word: 'blue' },
    { team: 'ui', word: 'fruit' },
    { team: 'ew', word: 'stew' },
    { team: 'u_e', word: 'cube' },
    { team: 'ute', word: 'flute' },
    { team: 'une', word: 'tune' },
    { team: 'ule', word: 'mule' },
    { team: 'uit', word: 'suit' },
  ],
};

const vowelTeamIcons = {
  rain: '🌧️',
  tail: '🐒',
  maid: '🧹',
  bait: '🎣',
  cake: '🎂',
  gate: '🚪',
  game: '🎮',
  plane: '✈️',
  peach: '🍑',
  meat: '🥩',
  bread: '🍞',
  team: '👥',
  sleep: '😴',
  bean: '🫘',
  wheel: '🛞',
  pear: '🍐',
  light: '💡',
  rice: '🍚',
  slide: '🛝',
  time: '⏰',
  pine: '🌲',
  pipe: '🪈',
  fire: '🔥',
  kite: '🪁',
  boat: '⛵',
  oak: '🌳',
  soap: '🧼',
  road: '🛣️',
  oar: '🚣',
  goal: '🥅',
  shore: '🏖️',
  stone: '🪨',
  blue: '🔵',
  fruit: '🍇',
  stew: '🍲',
  cube: '🧊',
  flute: '🎶',
  tune: '🎵',
  mule: '🫏',
  suit: '👔',
};

const videos = [
  {
    id: 1,
    title: 'Introduction to Vowels',
    description: 'Source: A*List! English Learning Videos for Kids (YouTube)',
    url: '/vowels-videos/video1.mp4',
    duration: '2:07',
  },
  {
    id: 2,
    title: 'Introduction to Double Letter Vowels',
    description: 'Source: A*List! English Learning Videos for Kids (YouTube)',
    url: '/vowels-videos/video2.mp4',
    duration: '1:57',
  },
  {
    id: 3,
    title: 'Introduction to Long Vowel Song',
    description: 'Source: A*List! English Learning Videos for Kids (YouTube)',
    url: '/vowels-videos/video3.mp4',
    duration: '1:39',
  },
];

export default function Vowels({ onComplete, onBack, onNavigate, initialVideosWatched = [], onVideosWatchedChange, initialMode = 'learning' }) {
  const [mode, setMode] = useState(initialMode);
  const [selectedLetter, setSelectedLetter] = useState(vowels[0].letter);
  const [feedback, setFeedback] = useState('Choose a vowel to hear its sound.');
  const [videosWatched, setVideosWatched] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);
  const [showDoubleVowelModal, setShowDoubleVowelModal] = useState(false);
  const [showVoicePractice, setShowVoicePractice] = useState(false);
  const [exploredVowels, setExploredVowels] = useState([vowels[0].letter]);
  const [heardPairs, setHeardPairs] = useState([]);
  const [letterTap, setLetterTap] = useState(0);
  useEffect(() => {
    setVideosWatched(Array.isArray(initialVideosWatched) ? initialVideosWatched : []);
  }, [initialVideosWatched]);

  const selectedItem = vowels.find((item) => item.letter === selectedLetter) ?? vowels[0];
  const selectedPairs = vowelTeamBoards[selectedItem.letter] ?? [];
  const allVideosWatched = videosWatched.length === videos.length;

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const speakText = (text, message) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setFeedback(message);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    setFeedback(message);
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    if (nextMode === 'lesson') {
      setFeedback('Choose a vowel to hear its sound.');
      return;
    }

    if (!allVideosWatched) {
      setFeedback('Watch all videos to unlock the Lesson.');
    }
  };

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

  const handlePreviousVideo = () => {
    setCurrentVideoIndex((index) => (index > 0 ? index - 1 : index));
  };

  const handleNextVideo = () => {
    setCurrentVideoIndex((index) => (index < videos.length - 1 ? index + 1 : index));
  };

  const handlePick = (letter) => {
    const nextItem = vowels.find((item) => item.letter === letter) ?? vowels[0];
    setSelectedLetter(nextItem.letter);
    setExploredVowels((current) => (current.includes(nextItem.letter) ? current : [...current, nextItem.letter]));
    setShowVoicePractice(false);
    setFeedback(`Selected ${nextItem.letter} - ${nextItem.word}.`);
  };

  const speakSelectedWord = () => {
    speakText(selectedItem.word, `Speaking word: ${selectedItem.word}`);
  };

  const getPairLetters = (team, word) => {
    const lowercaseTeam = team.toLowerCase();
    const pairLetters = [...lowercaseTeam].filter((letter) => /[aeiou]/.test(letter));

    if (pairLetters.length >= 2) {
      return pairLetters.join('');
    }

    const wordLetters = [...word.toLowerCase()].filter((letter) => /[aeiou]/.test(letter));
    return wordLetters.slice(0, 2).join('');
  };

  const renderHighlightedWord = (word, pairLetters) => {
    const letters = [...word];
    const highlightIndices = [];
    const pair = pairLetters.toLowerCase();
    let pairIndex = 0;

    for (let i = 0; i < letters.length && pairIndex < pair.length; i += 1) {
      if (letters[i].toLowerCase() === pair[pairIndex]) {
        highlightIndices.push(i);
        pairIndex += 1;
      }
    }

    return letters.map((letter, index) => {
      const isHighlighted = highlightIndices.includes(index);
      return (
        <span key={`${letter}-${index}`} className={isHighlighted ? 'vowel-pair-highlight' : 'vowel-pair-letter'}>
          {letter}
        </span>
      );
    });
  };

  if (mode === 'vowelrush') {
    return <VowelRush onClose={() => handleModeChange('learning')} />;
  }

  const goToLesson = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('vowels', 'lesson');
      return;
    }
    handleModeChange('lesson');
  };

  const renderHero = ({ icon, title, subtitle, stat }) => (
    <header className="vw-hero">
      <span className="vw-hero-icon" aria-hidden="true">{icon}</span>
      <div className="vw-hero-copy">
        <span className="vw-kicker">🗺️ Vowel Valley</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {stat}
    </header>
  );

  const renderVideoPlayer = () => {
    const video = videos[currentVideoIndex];
    const isWatched = videosWatched.includes(video.id);

    return (
      <div
        className="vw-modal-backdrop"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeVideoPlayer();
          }
        }}
      >
        <div className="vw-modal vw-player" role="dialog" aria-modal="true" aria-labelledby="vw-player-title">
          <div className="vw-modal-head">
            <div>
              <span className="vw-kicker">🎬 Episode {currentVideoIndex + 1} of {videos.length}</span>
              <h3 id="vw-player-title">{video.title}</h3>
            </div>
            <button type="button" className="vw-close" onClick={closeVideoPlayer} aria-label="Close video">
              ✕
            </button>
          </div>

          <div className="vw-video-frame">
            <video
              key={`video-${video.id}`}
              width="100%"
              height="100%"
              controls
              autoPlay
              onEnded={() => handleVideoEnd(video.id)}
            >
              <source src={video.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          <p className={`vw-watch-note ${isWatched ? 'done' : ''}`}>
            {isWatched
              ? '✓ Watched! Great job finishing this episode.'
              : '⏳ This video is marked as watched once you finish it completely.'}
          </p>

          <div className="vw-player-nav" aria-label="Video navigation">
            <button
              type="button"
              className="vw-btn vw-btn-soft"
              onClick={handlePreviousVideo}
              disabled={currentVideoIndex === 0}
            >
              ‹ Previous
            </button>
            <div className="vw-player-dots" aria-hidden="true">
              {videos.map((item, index) => (
                <span
                  key={item.id}
                  className={[
                    index === currentVideoIndex ? 'current' : '',
                    videosWatched.includes(item.id) ? 'watched' : '',
                  ].join(' ')}
                />
              ))}
            </div>
            <button
              type="button"
              className="vw-btn vw-btn-soft"
              onClick={handleNextVideo}
              disabled={currentVideoIndex === videos.length - 1}
            >
              Next ›
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderLearning = () => {
    const watchedCount = videosWatched.length;
    const remaining = videos.length - watchedCount;
    const upNextIndex = videos.findIndex((video) => !videosWatched.includes(video.id));

    return (
      <>
        {renderHero({
          icon: '🎬',
          title: 'Learning Videos',
          subtitle: 'Watch every episode to unlock Basics of the Vowels!',
          stat: (
            <div className="vw-hero-stat">
              <strong key={watchedCount} className="vw-pop">{watchedCount}<small>/{videos.length}</small></strong>
              <span>Videos watched</span>
              <div className="vw-meter"><div style={{ '--p': `${(watchedCount / videos.length) * 100}%` }} /></div>
            </div>
          ),
        })}

        <section className="vw-episodes">
          {videos.map((video, index) => {
            const isWatched = videosWatched.includes(video.id);
            const isUpNext = index === upNextIndex;

            return (
              <article
                key={video.id}
                className={`vw-episode ${isWatched ? 'watched' : ''} ${isUpNext ? 'up-next' : ''}`}
                style={{ '--i': index }}
              >
                {isUpNext ? <span className="vw-up-next" aria-hidden="true">⭐ Up next</span> : null}
                <button
                  type="button"
                  className="vw-thumb"
                  onClick={() => handlePlayVideo(index)}
                  aria-label={`${isWatched ? 'Rewatch' : 'Play'} ${video.title}`}
                >
                  <span className="vw-ep-badge">EP {index + 1}</span>
                  <span className="vw-duration">⏱ {video.duration}</span>
                  <span className="vw-play-circle" aria-hidden="true">▶</span>
                  {isWatched ? <span className="vw-stamp" aria-hidden="true">✓ Watched</span> : null}
                </button>
                <div className="vw-episode-body">
                  <h3>{video.title}</h3>
                  <p>{video.description}</p>
                  <button
                    type="button"
                    className={`vw-btn ${isWatched ? 'vw-btn-soft' : ''}`}
                    onClick={() => handlePlayVideo(index)}
                  >
                    {isWatched ? '↻ Rewatch' : '▶ Play'}
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section className={`vw-unlock ${allVideosWatched ? 'open' : ''}`}>
          <span className="vw-unlock-icon" aria-hidden="true">{allVideosWatched ? '🎁' : '🔒'}</span>
          <div className="vw-unlock-copy">
            <strong>{allVideosWatched ? 'Basics of the Vowels unlocked!' : 'Basics of the Vowels'}</strong>
            <span>
              {allVideosWatched
                ? 'You watched every episode. Time for the lesson!'
                : `Watch ${remaining} more video${remaining === 1 ? '' : 's'} to unlock the lesson.`}
            </span>
            <div className="vw-unlock-track">
              {videos.map((video) => (
                <span key={video.id} className={videosWatched.includes(video.id) ? 'on' : ''} />
              ))}
            </div>
          </div>
          {allVideosWatched ? (
            <button type="button" className="vw-btn vw-pulse" onClick={goToLesson}>
              Go to Lesson ▶
            </button>
          ) : null}
        </section>

        {currentVideoIndex !== null ? renderVideoPlayer() : null}
      </>
    );
  };

  const renderLesson = () => {
    const pairsHeardHere = selectedPairs.filter((item) => heardPairs.includes(`${selectedItem.letter}-${item.word}`)).length;

    return (
      <>
        {renderHero({
          icon: '🗣️',
          title: 'Basics of the Vowels',
          subtitle: 'Tap a vowel to meet its sound and word friends!',
          stat: (
            <div className="vw-hero-stat">
              <strong key={exploredVowels.length} className="vw-pop">{exploredVowels.length}<small>/5</small></strong>
              <span>Vowels explored</span>
              <div className="vw-meter"><div style={{ '--p': `${(exploredVowels.length / 5) * 100}%` }} /></div>
            </div>
          ),
        })}

        <div className="vw-picker" aria-label="Vowel choices">
          {vowels.map((item, index) => (
            <button
              key={item.letter}
              type="button"
              className={[
                'vw-vowel',
                `vw-v${index}`,
                item.letter === selectedLetter ? 'active' : '',
                exploredVowels.includes(item.letter) ? 'explored' : '',
              ].join(' ')}
              style={{ '--i': index }}
              onClick={() => handlePick(item.letter)}
            >
              <span className="vw-vowel-letter">{item.letter}</span>
              <span className="vw-vowel-icon" aria-hidden="true">{item.icon}</span>
            </button>
          ))}
        </div>

        <section className={`vw-spotlight vw-v${vowels.indexOf(selectedItem)}`}>
          <button
            type="button"
            className="vw-letter-card"
            onClick={() => {
              setLetterTap((current) => current + 1);
              speakText(selectedItem.letter, `Speaking vowel: ${selectedItem.letter}.`);
            }}
            aria-label={`Hear the vowel ${selectedItem.letter}`}
          >
            {letterTap > 0 ? <span key={letterTap} className="vw-ripple" aria-hidden="true" /> : null}
            <span key={selectedItem.letter} className="vw-big-letter">
              {selectedItem.letter}<small>{selectedItem.letter.toLowerCase()}</small>
            </span>
            <span key={`${selectedItem.letter}-sound`} className="vw-sound-bubble">says “{selectedItem.sound}”</span>
          </button>

          <div
            className="vw-object-card"
            onClick={speakSelectedWord}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                speakSelectedWord();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Read the word ${selectedItem.word}`}
          >
            <span key={`${selectedItem.letter}-icon`} className="vw-object-icon" aria-hidden="true">
              {selectedItem.icon}
            </span>
            <p key={`${selectedItem.letter}-word`} className="vw-object-word">
              {[...selectedItem.word].map((character, index) => (
                <span
                  key={`${character}-${index}`}
                  className={character.toUpperCase() === selectedItem.letter ? 'vw-hl' : undefined}
                >
                  {character}
                </span>
              ))}
            </p>
            <span className="vw-tap-hint">🔊 Tap to hear the word</span>
          </div>

          <div className="vw-actions">
            <p key={feedback} className="vw-feedback" aria-live="polite">{feedback}</p>
            <button
              type="button"
              className={`vw-btn vw-btn-mic ${showVoicePractice ? 'active' : ''}`}
              onClick={() => setShowVoicePractice(!showVoicePractice)}
              aria-expanded={showVoicePractice}
            >
              🎤 {showVoicePractice ? 'Hide Practice' : 'Practice Vowel Sound'}
            </button>
            <button
              type="button"
              className="vw-btn vw-btn-sparkle"
              onClick={() => setShowDoubleVowelModal(true)}
              aria-haspopup="dialog"
              aria-expanded={showDoubleVowelModal}
            >
              ✨ Explore Double Vowels
            </button>
          </div>
        </section>

        {showVoicePractice && (
          <div className="vw-voice-panel">
            <VoicePractice
              targetWord={selectedItem.letter}
              onResult={(result) => {
                if (result.success) {
                  setFeedback(`Great! You pronounced the vowel "${selectedItem.letter}" correctly!`);
                } else {
                  setFeedback(result.feedback);
                }
              }}
              showTranscript={true}
            />
          </div>
        )}

        <section className="vw-pairs" aria-label={`${selectedItem.letter} vowel team examples`}>
          <div className="vw-pairs-head">
            <div>
              <span className="vw-kicker vw-kicker-dark">Pair vowels</span>
              <h2>{selectedItem.letter} Vowel Pairs</h2>
            </div>
            <span className="vw-chip">
              {pairsHeardHere === selectedPairs.length ? '🏅 All heard!' : `🔊 ${pairsHeardHere}/${selectedPairs.length} heard`}
            </span>
          </div>

          <div className="vw-pair-grid">
            {selectedPairs.map((item, index) => {
              const pairLetters = getPairLetters(item.team, item.word);
              const key = `${selectedItem.letter}-${item.word}`;
              const heard = heardPairs.includes(key);

              return (
                <button
                  key={key}
                  type="button"
                  className={`vw-pair ${heard ? 'heard' : ''}`}
                  style={{ '--i': index }}
                  onClick={() => {
                    speakText(item.word, `Listening to ${item.word}.`);
                    setHeardPairs((current) => (current.includes(key) ? current : [...current, key]));
                  }}
                  aria-label={`Listen to the word ${item.word}`}
                >
                  <span className="vw-pair-chunk">{item.team}</span>
                  <span className="vw-pair-icon" aria-hidden="true">{vowelTeamIcons[item.word]}</span>
                  <span className="vw-pair-word">{renderHighlightedWord(item.word, pairLetters)}</span>
                </button>
              );
            })}
          </div>
        </section>

        {showDoubleVowelModal && (
          <div
            className="vw-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setShowDoubleVowelModal(false);
              }
            }}
          >
            <div
              className="vw-modal vw-double-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="double-vowels-modal-title"
            >
              <div className="vw-modal-head">
                <div>
                  <span className="vw-kicker">✨ Bonus lesson</span>
                  <h3 id="double-vowels-modal-title">Double Vowels</h3>
                </div>
                <button
                  type="button"
                  className="vw-close"
                  onClick={() => setShowDoubleVowelModal(false)}
                  aria-label="Close double vowels"
                >
                  ✕
                </button>
              </div>
              <div className="vw-modal-body">
                <DoubleVowelLesson
                  onFeedback={(message) => {
                    setFeedback(message);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="vw-page">
      {mode === 'lesson' ? renderLesson() : renderLearning()}
    </div>
  );
}
