import { useEffect, useState } from 'react';
import './Consonants.css';

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
  { letter: 'X', word: 'Xylophone', icon: '🎹' },
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

export default function Consonants({ onComplete, onBack, initialVideosWatched = [], onVideosWatchedChange, isCompleted = false }) {
  const [mode, setMode] = useState('learning');
  const [selectedLetter, setSelectedLetter] = useState(consonants[0].letter);
  const [feedback, setFeedback] = useState('Choose a consonant to hear the object name.');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);
  const [completionNotified, setCompletionNotified] = useState(false);

  const selectedItem = consonants.find((item) => item.letter === selectedLetter) ?? consonants[0];
  const videosWatched = Array.isArray(initialVideosWatched) ? initialVideosWatched : [];
  const allVideosWatched = videosWatched.length === videos.length;

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
    window.speechSynthesis.speak(utterance);
    setFeedback(message);
  };

  const handleModeChange = (nextMode) => {
    if (nextMode === 'explore' && !allVideosWatched) {
      setFeedback('Watch all learning materials to unlock Explore.');
      return;
    }

    setMode(nextMode);
    if (nextMode === 'explore') {
      setFeedback('Choose a consonant to hear the object name.');
    } else {
      setFeedback('Watch all learning materials to unlock Explore.');
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

  const handleVideoEnd = (videoId) => {
    handleVideoWatched(videoId);
  };

  const handlePick = (letter) => {
    const nextItem = consonants.find((item) => item.letter === letter) ?? consonants[0];
    setSelectedLetter(nextItem.letter);
    speakText(nextItem.word, `Speaking ${nextItem.word}.`);
  };

  const speakCurrent = () => {
    speakText(selectedItem.word, `Speaking ${selectedItem.word}.`);
  };

  return (
    <div className="module-detail consonants-detail">
      <div className="consonants-topbar">
        <button type="button" className="consonants-back" onClick={onBack}>
          ← RETURN TO LEARNING PATH
        </button>
      </div>

      <div className="consonants-switch" role="tablist" aria-label="Consonants modes">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'learning'}
          className={mode === 'learning' ? 'mode-pill active' : 'mode-pill'}
          onClick={() => handleModeChange('learning')}
        >
          Learning Materials
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'explore'}
          className={`mode-pill${mode === 'explore' ? ' active' : ''}${!allVideosWatched ? ' locked' : ''}`}
          onClick={() => handleModeChange('explore')}
          disabled={!allVideosWatched}
        >
          Explore
        </button>
      </div>

      {mode === 'learning' ? (
        <div className="learning-materials">
          {currentVideoIndex !== null ? (
            <div className="video-player-modal">
              <button
                type="button"
                className="video-close-btn"
                onClick={closeVideoPlayer}
              >
                ✕
              </button>
              <div className="video-player-container">
                <div className="video-player">
                  <video
                    key={`video-${videos[currentVideoIndex].id}`}
                    width="100%"
                    height="100%"
                    controls
                    autoPlay
                    onEnded={() => handleVideoEnd(videos[currentVideoIndex].id)}
                  >
                    <source src={videos[currentVideoIndex].url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="video-player-info">
                  <h3>{videos[currentVideoIndex].title}</h3>
                  <p>{videos[currentVideoIndex].description}</p>
                  <div className="video-watched-notice">
                    <p className="watched-notice-text">
                      ✓ The video will be marked as watched once you finish watching it completely.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="learning-header">
                <h3>Learning Materials</h3>
                <p>Watch all 6 videos to unlock Explore mode</p>
              </div>

              <div className="videos-grid">
                {videos.map((video, index) => (
                  <div key={video.id} className="video-card">
                    <div className="video-thumbnail">
                      <span className="video-icon">🎬</span>
                      {videosWatched.includes(video.id) && (
                        <span className="video-watched-badge">✓ Watched</span>
                      )}
                    </div>
                    <div className="video-info">
                      <h4>{video.title}</h4>
                      <p>{video.description}</p>
                      <span className="video-duration">{video.duration}</span>
                    </div>
                    <button
                      type="button"
                      className={`video-play-btn${videosWatched.includes(video.id) ? ' watched' : ''}`}
                      onClick={() => handlePlayVideo(index)}
                    >
                      ▶ {videosWatched.includes(video.id) ? 'REWATCH' : 'PLAY'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="learning-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(videosWatched.length / videos.length) * 100}%` }}
                  />
                </div>
                <p>
                  {videosWatched.length} of {videos.length} videos watched
                </p>
                {allVideosWatched && (
                  <p className="progress-unlocked">
                    ✓ Explore mode unlocked! Click the Explore tab to continue.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="consonants-picker" aria-label="Consonant choices">
            {consonants.map((item) => (
              <button
                key={item.letter}
                type="button"
                className={item.letter === selectedLetter ? 'consonant-tile active' : 'consonant-tile'}
                onClick={() => handlePick(item.letter)}
              >
                <span className="consonant-tile-letter">{item.letter}</span>
                <span className="consonant-tile-icon" aria-hidden="true">
                  {item.icon}
                </span>
              </button>
            ))}
          </div>

          <div className="consonants-stage">
            <span className="consonants-letter">{selectedItem.letter}</span>

            <div className="consonants-object">
              <span className="consonants-object-icon" aria-hidden="true">
                {selectedItem.icon}
              </span>
              <p className="consonants-object-word">{selectedItem.word}</p>
              <p className="consonants-object-sound">Say the object name.</p>
            </div>

            <button type="button" className="consonants-listen" onClick={speakCurrent}>
              🔊 LISTEN TO OBJECT
            </button>

            <p className="game-feedback">{feedback}</p>
          </div>
        </>
      )}
    </div>
  );
}
