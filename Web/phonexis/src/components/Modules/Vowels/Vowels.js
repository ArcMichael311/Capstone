import { useEffect, useState } from 'react';
import './Vowels.css';
import DoubleVowelLesson from './DoubleVowelLesson';

const vowels = [
  { letter: 'A', sound: 'ah', word: 'Apple', icon: '🍎' },
  { letter: 'E', sound: 'eh', word: 'Elephant', icon: '🐘' },
  { letter: 'I', sound: 'ih', word: 'Ice cream', icon: '🍦' },
  { letter: 'O', sound: 'oh', word: 'Octopus', icon: '🐙' },
  { letter: 'U', sound: 'uh', word: 'Umbrella', icon: '☂️' },
];

const pretestActivityDeck = [
  { letter: 'A', prompt: '_pple', icon: '🍎', choices: ['A', 'E', 'I', 'O', 'U'] },
  { letter: 'E', prompt: '_lephant', icon: '🐘', choices: ['A', 'E', 'I', 'O', 'U'] },
  { letter: 'I', prompt: '_ce cream', icon: '🍦', choices: ['A', 'E', 'I', 'O', 'U'] },
  { letter: 'O', prompt: '_ctopus', icon: '🐙', choices: ['A', 'E', 'I', 'O', 'U'] },
  { letter: 'U', prompt: '_mbrella', icon: '☂️', choices: ['A', 'E', 'I', 'O', 'U'] },
];

const videos = [
  {
    id: 1,
    title: 'Introduction to Vowels',
    description: 'Learn about the 5 main vowel sounds and how they are pronounced.',
    url: '/vowels-videos/video1.mp4',
    duration: '5:30',
  },
  {
    id: 2,
    title: 'Vowel Sounds in Words',
    description: 'Practice identifying vowel sounds in common words.',
    url: '/vowels-videos/video2.mp4',
    duration: '6:45',
  },
  {
    id: 3,
    title: 'Double Letter Vowels',
    description: 'Learn about double letter vowel combinations and their sounds.',
    url: '/vowels-videos/video3.mp4',
    duration: '7:00',
  },
];

export default function Vowels({ onComplete, onBack, initialVideosWatched = [], onVideosWatchedChange }) {
  const [mode, setMode] = useState('learning');
  const [selectedLetter, setSelectedLetter] = useState(vowels[0].letter);
  const [pretestIndex, setPretestIndex] = useState(0);
  const [pretestChoice, setPretestChoice] = useState('');
  const [pretestResult, setPretestResult] = useState(null);
  const [pretestMessage, setPretestMessage] = useState('Choose the correct answer.');
  const [feedback, setFeedback] = useState('Choose a vowel to hear its sound.');
  const [videosWatched, setVideosWatched] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);
  useEffect(() => {
    setVideosWatched(Array.isArray(initialVideosWatched) ? initialVideosWatched : []);
  }, [initialVideosWatched]);

  const selectedItem = vowels.find((item) => item.letter === selectedLetter) ?? vowels[0];
  const currentPretest = pretestActivityDeck[pretestIndex];
  const allVideosWatched = videosWatched.length === videos.length;

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

  const resetPretest = () => {
    setPretestIndex(0);
    setPretestChoice('');
    setPretestResult(null);
    setPretestMessage('Choose the correct answer.');
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    if (nextMode === 'lesson') {
      setFeedback('Choose a vowel to hear its sound.');
    }
    resetPretest();
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

  const handlePick = (letter) => {
    const nextItem = vowels.find((item) => item.letter === letter) ?? vowels[0];
    setSelectedLetter(nextItem.letter);
    setFeedback(`Selected ${nextItem.letter} - ${nextItem.word}.`);
  };

  const speakCurrent = () => {
    speakText(`${selectedItem.letter}, ${selectedItem.sound}`, `Speaking ${selectedItem.letter} sound.`);
  };

  const handlePretestCheck = () => {
    if (!pretestChoice) {
      setPretestResult('wrong');
      setPretestMessage('Wrong answer. Choose a letter first.');
      return;
    }

    if (pretestChoice !== currentPretest.letter) {
      setPretestResult('wrong');
      setPretestMessage('Wrong answer. Try again.');
      return;
    }

    setPretestResult('correct');
    setPretestMessage('Correct!');
  };

  const handleNextPretestQuestion = () => {
    const nextIndex = pretestIndex + 1;

    if (nextIndex >= pretestActivityDeck.length) {
      if (typeof onComplete === 'function') {
        onComplete();
      }
      return;
    }

    setPretestIndex(nextIndex);
    setPretestChoice('');
    setPretestResult(null);
    setPretestMessage('Choose the correct answer.');
  };

  return (
    <div className="module-detail vowels-detail">
      <div className="vowels-topbar">
        <button type="button" className="vowels-back" onClick={onBack}>
          ← BACK TO DASHBOARD
        </button>
      </div>

      <div className="vowels-switch" role="tablist" aria-label="Vowels modes">
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
          aria-selected={mode === 'lesson'}
          className={`mode-pill${mode === 'lesson' ? ' active' : ''}${!allVideosWatched ? ' locked' : ''}`}
          onClick={() => {
            if (allVideosWatched) {
              handleModeChange('lesson');
            }
          }}
          disabled={!allVideosWatched}
        >
          Lesson
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'pretest'}
          className={`mode-pill${mode === 'pretest' ? ' active' : ''}${!allVideosWatched ? ' locked' : ''}`}
          onClick={() => {
            if (allVideosWatched) {
              handleModeChange('pretest');
            }
          }}
          disabled={!allVideosWatched}
        >
          Pretest
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
                <p>Watch all videos to unlock Lesson and Pretest modes</p>
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
                    ✓ Lesson and Pretest modes unlocked! Click the Lesson or Pretest tab to proceed.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      ) : mode === 'lesson' ? (
        <div className="lesson-stage">
          <div className="lesson-header">
            <h3>Vowel Sounds Lesson</h3>
            <p>Click on a vowel to hear its sound</p>
          </div>

          <div className="vowels-picker" aria-label="Vowel choices">
            {vowels.map((item) => (
              <button
                key={item.letter}
                type="button"
                className={item.letter === selectedLetter ? 'vowel-tile active' : 'vowel-tile'}
                onClick={() => handlePick(item.letter)}
              >
                <span className="vowel-tile-letter">{item.letter}</span>
                <span className="vowel-tile-icon" aria-hidden="true">
                  {item.icon}
                </span>
              </button>
            ))}
          </div>

          <div className="vowels-stage">
            <span className="vowels-letter">{selectedItem.letter}</span>

            <div className="vowels-object">
              <span className="vowels-object-icon" aria-hidden="true">
                {selectedItem.icon}
              </span>
              <p className="vowels-object-word">{selectedItem.word}</p>
              <p className="vowels-object-sound">Sound: "{selectedItem.sound}"</p>
            </div>

            <button type="button" className="vowels-listen" onClick={speakCurrent}>
              🔊 LISTEN TO SOUND
            </button>

            <DoubleVowelLesson onFeedback={setFeedback} />

            <p className="game-feedback">{feedback}</p>
          </div>
        </div>
      ) : (
        <div className="pretest-stage">
          <div className="pretest-header">
            <h3>Pretest: Fill in the Missing Vowel</h3>
            <p>Complete the word by adding the correct vowel</p>
          </div>

          <div className="pretest-card">
            <span className="pretest-card-icon" aria-hidden="true">
              {currentPretest.icon}
            </span>
            <p className="pretest-word">{currentPretest.prompt}</p>

            <div className="pretest-answer-row" aria-label="Answer selection">
              <div className="pretest-letter-box" aria-label="Missing letter answer">
                <span>{pretestChoice || '\u00A0'}</span>
              </div>

              <button type="button" className="pretest-check" onClick={handlePretestCheck}>
                ✓ CHECK ANSWER
              </button>
            </div>

            <div className="pretest-choice-row" role="group" aria-label="Vowel options">
              {currentPretest.choices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={choice === pretestChoice ? 'pretest-choice active' : 'pretest-choice'}
                  onClick={() => {
                    setPretestChoice(choice);
                    setPretestResult(null);
                    setPretestMessage('Choose the correct answer.');
                  }}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <div className={pretestResult === 'correct' ? 'pretest-result correct' : 'pretest-result wrong'} aria-live="polite">
            {pretestResult ? pretestMessage : ''}
          </div>

          {pretestResult === 'correct' ? (
            <button type="button" className="pretest-next" onClick={handleNextPretestQuestion}>
              NEXT QUESTION
            </button>
          ) : null}

          <div className="pretest-dots" aria-label="Pretest progress">
            {pretestActivityDeck.map((item, index) => (
              <span key={item.letter || item.letters} className={index === pretestIndex ? 'pretest-dot active' : 'pretest-dot'} />
            ))}
          </div>

          <p className="game-feedback">{pretestResult ? '' : pretestMessage}</p>
        </div>
      )}
    </div>
  );
}
