import { useEffect, useState } from 'react';
import './Consonants.css';
import { configureFemaleVoice } from '../../../lib/speechUtils';
import './ConsonantsPage.css';
import WordBlast from './WordBlast';
import VoicePractice from '../../VoicePractice/VoicePractice';
import VideoEpisodes from '../shared/VideoEpisodes';

const consonants = [
  { letter: 'B', word: 'Ball', icon: '⚽' },
  { letter: 'C', word: 'Cat', icon: '🐱' },
  { letter: 'D', word: 'Dog', icon: '🐶' },
  { letter: 'F', word: 'Fish', icon: '🐟' },
  { letter: 'G', word: 'Gift', icon: '🎁' },
  { letter: 'H', word: 'Hat', icon: '🎩' },
  { letter: 'J', word: 'Jam', icon: '🍓' },
  { letter: 'K', word: 'Kite', icon: '🪁' },
  { letter: 'L', word: 'Lion', icon: '🦁' },
  { letter: 'M', word: 'Moon', icon: '🌙' },
  { letter: 'N', word: 'Nest', icon: '🪺' },
  { letter: 'P', word: 'Pig', icon: '🐷' },
  { letter: 'Q', word: 'Queen', icon: '👑' },
  { letter: 'R', word: 'Rabbit', icon: '🐰' },
  { letter: 'S', word: 'Sun', icon: '☀️' },
  { letter: 'T', word: 'Tiger', icon: '🐯' },
  { letter: 'W', word: 'Wolf', icon: '🐺' },
  { letter: 'X', word: 'X-ray', icon: '🩻' },
  { letter: 'Y', word: 'Yoyo', icon: '🪀' },
  { letter: 'Z', word: 'Zebra', icon: '🦓' },
];

const videos = [
  {
    id: 1,
    title: 'br, dr, gr l Double-Letter Consonants',
    description: 'Source: A*List! English Learning Videos for Kids (YouTube)',
    url: '/consonants-videos/video1.mp4',
    duration: '1:47',
  },
  {
    id: 2,
    title: 'ch, sh l Double-Letter Consonants',
    description: 'Source: A*List! English Learning Videos for Kids (YouTube)',
    url: '/consonants-videos/video2.mp4',
    duration: '1:30',
  },
  {
    id: 3,
    title: 'cl, gl, pl l Double-Letter Consonants',
    description: 'Source: A*List! English Learning Videos for Kids (YouTube)',
    url: '/consonants-videos/video3.mp4',
    duration: '1:44',
  },
  {
    id: 4,
    title: 'kn, mb l Double-Letter Consonants',
    description: 'Source: A*List! English Learning Videos for Kids (YouTube)',
    url: '/consonants-videos/video4.mp4',
    duration: '1:21',
  },
  {
    id: 5,
    title: 'kn, mb l Double-Letter Consonants',
    description: 'Source: A*List! English Learning Videos for Kids (YouTube)',
    url: '/consonants-videos/video5.mp4',
    duration: '1:20',
  },
  {
    id: 6,
    title: 'sm, sn, st l Double-Letter Consonants',
    description: 'Source: A*List! English Learning Videos for Kids (YouTube)',
    url: '/consonants-videos/video6.mp4',
    duration: '1:48',
  },
];

export default function Consonants({ onComplete, onBack, onNavigate, initialVideosWatched = [], onVideosWatchedChange, isCompleted = false, initialMode = 'learning' }) {
  const [mode, setMode] = useState(initialMode);
  const [selectedLetter, setSelectedLetter] = useState(consonants[0].letter);
  const [feedback, setFeedback] = useState('Choose a consonant to hear the object name.');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);
  const [completionNotified, setCompletionNotified] = useState(false);
  const [showVoicePractice, setShowVoicePractice] = useState(false);
  const [exploredConsonants, setExploredConsonants] = useState([consonants[0].letter]);
  const [letterTap, setLetterTap] = useState(0);

  const selectedItem = consonants.find((item) => item.letter === selectedLetter) ?? consonants[0];
  const videosWatched = Array.isArray(initialVideosWatched) ? initialVideosWatched : [];
  const allVideosWatched = videosWatched.length === videos.length;

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!allVideosWatched || isCompleted || completionNotified || typeof onComplete !== 'function') {
      return;
    }

    setCompletionNotified(true);
    onComplete();
  }, [allVideosWatched, completionNotified, onComplete, isCompleted]);

  const speakText = (text, message) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setFeedback(message);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    configureFemaleVoice(utterance);
    window.speechSynthesis.speak(utterance);
    setFeedback(message);
  };

  const handleModeChange = (nextMode) => {
    if (nextMode === 'explore' && !allVideosWatched) {
      setFeedback('Watch all learning video materials to unlock Explore Consonants.');
      return;
    }

    setMode(nextMode);
    if (nextMode === 'explore') {
      setFeedback('Choose a consonant to hear the object name.');
      return;
    }

    if (!allVideosWatched) {
      setFeedback('Watch all learning video materials to unlock Explore Consonants.');
    } else {
      setFeedback('Learning video materials review mode.');
    }
  };


  const handlePlayVideo = (index) => {
    setCurrentVideoIndex(index);
  };

  const handleVideoWatched = (videoId) => {
    const nextVideos = (() => {
      const currentVideos = Array.isArray(initialVideosWatched) ? initialVideosWatched : [];

      if (currentVideos.includes(videoId)) {
        return currentVideos;
      }

      return [...currentVideos, videoId];
    })();

    if (typeof onVideosWatchedChange === 'function') {
      onVideosWatchedChange(nextVideos);
    }
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

  const handleVideoEnd = (videoId) => {
    handleVideoWatched(videoId);
  };

  const speakLetterOnly = (letterToSpeak = selectedItem) => {
    speakText(letterToSpeak.letter, `Speaking letter: ${letterToSpeak.letter}.`);
  };

  const speakLetterAndWord = (letterToSpeak = selectedItem) => {
    speakText(`${letterToSpeak.letter} ... ${letterToSpeak.word}.`, `Speaking ${letterToSpeak.letter}: ${letterToSpeak.word}.`);
  };

  const markExplored = (letter) => {
    setExploredConsonants((current) => (current.includes(letter) ? current : [...current, letter]));
  };

  const handlePick = (letter) => {
    const nextItem = consonants.find((item) => item.letter === letter) ?? consonants[0];
    setSelectedLetter(nextItem.letter);
    markExplored(nextItem.letter);
    setShowVoicePractice(false);
    speakLetterAndWord(nextItem);
  };

  const goToRelative = (offset) => {
    const currentIndex = consonants.findIndex((item) => item.letter === selectedItem.letter);
    const nextItem = consonants[(currentIndex + offset + consonants.length) % consonants.length];
    setSelectedLetter(nextItem.letter);
    markExplored(nextItem.letter);
    setShowVoicePractice(false);
    setFeedback(`Selected ${nextItem.letter} - ${nextItem.word}.`);
  };

  const speakCurrent = () => {
    speakText(selectedItem.word, `Speaking ${selectedItem.word}.`);
  };

  if (mode === 'wordblast') {
    return <WordBlast onClose={() => handleModeChange('learning')} />;
  }

  const goToExplore = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('consonants', 'explore');
      return;
    }
    handleModeChange('explore');
  };

  const renderHero = ({ icon, title, subtitle, stat }) => (
    <header className="cn-hero">
      <span className="cn-hero-icon" aria-hidden="true">{icon}</span>
      <div className="cn-hero-copy">
        <span className="cn-kicker">🗺️ Consonant Canyon</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {stat}
    </header>
  );

  const renderLearning = () => {
    const watchedCount = videosWatched.length;

    return (
      <>
        {renderHero({
          icon: '🎬',
          title: 'Learning Videos',
          subtitle: `Watch all ${videos.length} episodes to unlock Explore Consonants!`,
          stat: (
            <div className="cn-hero-stat">
              <strong key={watchedCount} className="cn-pop">{watchedCount}<small>/{videos.length}</small></strong>
              <span>Videos watched</span>
              <div className="cn-meter"><div style={{ '--p': `${(watchedCount / videos.length) * 100}%` }} /></div>
            </div>
          ),
        })}

        <VideoEpisodes
          videos={videos}
          watchedIds={videosWatched}
          currentIndex={currentVideoIndex}
          onPlay={handlePlayVideo}
          onClose={closeVideoPlayer}
          onPrevious={handlePreviousVideo}
          onNext={handleNextVideo}
          onEnded={handleVideoEnd}
          unlockTitle="Explore Consonants"
          unlockActionLabel="Go Explore ▶"
          onUnlockAction={goToExplore}
        />
      </>
    );
  };

  const renderExplore = () => (
    <>
      {renderHero({
        icon: '🧩',
        title: 'Explore Consonants',
        subtitle: 'Tap a consonant to hear it and meet its word friend!',
        stat: (
          <div className="cn-hero-stat">
            <strong key={exploredConsonants.length} className="cn-pop">
              {exploredConsonants.length}<small>/{consonants.length}</small>
            </strong>
            <span>Consonants explored</span>
            <div className="cn-meter">
              <div style={{ '--p': `${(exploredConsonants.length / consonants.length) * 100}%` }} />
            </div>
          </div>
        ),
      })}

      <section className="cn-spotlight">
        <button
          type="button"
          className="cn-arrow"
          onClick={() => goToRelative(-1)}
          aria-label="Previous consonant"
        >
          ‹
        </button>

        <div className="cn-cards">
          <button
            type="button"
            className="cn-letter-card"
            onClick={() => {
              setLetterTap((current) => current + 1);
              speakLetterOnly();
            }}
            aria-label={`Read the letter ${selectedItem.letter}`}
          >
            {letterTap > 0 ? <span key={letterTap} className="cn-ripple" aria-hidden="true" /> : null}
            <span key={selectedItem.letter} className="cn-big-letter">
              {selectedItem.letter}<small>{selectedItem.letter.toLowerCase()}</small>
            </span>
            <span className="cn-tap-hint">🔊 Tap to hear</span>
          </button>

          <div
            className="cn-object-card"
            onClick={() => speakCurrent()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                speakCurrent();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Read the word ${selectedItem.word}`}
          >
            <span key={`${selectedItem.letter}-icon`} className="cn-object-icon" aria-hidden="true">
              {selectedItem.icon}
            </span>
            <p key={`${selectedItem.letter}-word`} className="cn-object-word">
              <b>{selectedItem.word.charAt(0)}</b>{selectedItem.word.slice(1)}
            </p>
            <span className="cn-object-sound">Say the object name.</span>
          </div>
        </div>

        <button
          type="button"
          className="cn-arrow"
          onClick={() => goToRelative(1)}
          aria-label="Next consonant"
        >
          ›
        </button>
      </section>

      <div className="cn-actions">
        <p key={feedback} className="cn-feedback" aria-live="polite">{feedback}</p>
        <button type="button" className="cn-btn" onClick={speakCurrent}>
          🔊 Listen to Object
        </button>
        <button
          type="button"
          className={`cn-btn cn-btn-mic ${showVoicePractice ? 'active' : ''}`}
          onClick={() => setShowVoicePractice(!showVoicePractice)}
          aria-expanded={showVoicePractice}
        >
          🎤 {showVoicePractice ? 'Hide Practice' : 'Practice Pronunciation'}
        </button>
      </div>

      {showVoicePractice && (
        <div className="cn-voice-panel">
          <VoicePractice
            targetWord={selectedItem.word}
            onResult={(result) => {
              if (result.success) {
                setFeedback(`Great! You pronounced "${selectedItem.word}" correctly!`);
              } else {
                setFeedback(result.feedback);
              }
            }}
            showTranscript={true}
          />
        </div>
      )}

      <section className="cn-grid-panel">
        <div className="cn-grid-head">
          <h2>🧩 Pick a consonant</h2>
          <span>✓ = already explored</span>
        </div>
        <div className="cn-picker" aria-label="Consonant choices">
          {consonants.map((item, index) => (
            <button
              key={item.letter}
              type="button"
              className={[
                'cn-tile',
                `cn-c${index % 5}`,
                item.letter === selectedLetter ? 'active' : '',
                exploredConsonants.includes(item.letter) ? 'explored' : '',
              ].join(' ')}
              style={{ '--i': index }}
              onClick={() => handlePick(item.letter)}
            >
              <span className="cn-tile-letter">{item.letter}</span>
              <span className="cn-tile-icon" aria-hidden="true">{item.icon}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );

  return (
    <div className="cn-page">
      {mode === 'explore' ? renderExplore() : renderLearning()}
    </div>
  );
}
