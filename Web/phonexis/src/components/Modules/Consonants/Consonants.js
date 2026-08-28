import { useEffect, useState } from 'react';
import './Consonants.css';
import WordBlast from './WordBlast';

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

const teacherActivityDeck = [
  { letter: 'B', prompt: '_all', icon: '⚽', choices: ['B', 'C', 'D', 'F'] },
  { letter: 'C', prompt: '_at', icon: '🐱', choices: ['B', 'C', 'H', 'M'] },
  { letter: 'D', prompt: '_og', icon: '🐶', choices: ['D', 'G', 'J', 'T'] },
  { letter: 'F', prompt: '_ish', icon: '🐟', choices: ['F', 'P', 'R', 'S'] },
  { letter: 'M', prompt: '_oon', icon: '🌙', choices: ['M', 'N', 'P', 'T'] },
  { letter: 'S', prompt: '_un', icon: '☀️', choices: ['S', 'T', 'W', 'Z'] },
];

export default function Consonants({ onComplete, onBack, initialVideosWatched = [], onVideosWatchedChange, isCompleted = false, initialMode = 'learning' }) {
  const [mode, setMode] = useState(initialMode);
  const [selectedLetter, setSelectedLetter] = useState(consonants[0].letter);
  const [feedback, setFeedback] = useState('Choose a consonant to hear the object name.');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);
  const [completionNotified, setCompletionNotified] = useState(false);
  const [teacherActivityTitle, setTeacherActivityTitle] = useState('Beginning consonant sorting');
  const [teacherActivityFocus, setTeacherActivityFocus] = useState('B, C, D, F');
  const [teacherActivityInstructions, setTeacherActivityInstructions] = useState('Give students picture cards and ask them to group cards by beginning consonant sound.');
  const [teacherActivities, setTeacherActivities] = useState([
    {
      id: 1,
      title: 'Consonant sound hunt',
      focus: 'M, N, P, S',
      instructions: 'Students find 2 objects per consonant sound at home or in class and say each word aloud.',
    },
  ]);
  const [teacherIndex, setTeacherIndex] = useState(0);
  const [teacherChoice, setTeacherChoice] = useState('');
  const [teacherResult, setTeacherResult] = useState(null);
  const [teacherMessage, setTeacherMessage] = useState('Pick the correct starting consonant.');

  const selectedItem = consonants.find((item) => item.letter === selectedLetter) ?? consonants[0];
  const videosWatched = Array.isArray(initialVideosWatched) ? initialVideosWatched : [];
  const allVideosWatched = videosWatched.length === videos.length;
  const currentTeacherActivity = teacherActivityDeck[teacherIndex];

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
    window.speechSynthesis.speak(utterance);
    setFeedback(message);
  };

  const handleModeChange = (nextMode) => {
    if ((nextMode === 'explore' || nextMode === 'game') && !allVideosWatched) {
      setFeedback('Watch all learning materials to unlock Explore and Game.');
      return;
    }

    setMode(nextMode);
    if (nextMode === 'explore') {
      setFeedback('Choose a consonant to hear the object name.');
      return;
    }

    if (nextMode === 'teacher') {
      setFeedback('Teacher panel: create consonant activities for students.');
      return;
    }

    if (nextMode === 'game') {
      setTeacherIndex(0);
      setTeacherChoice('');
      setTeacherResult(null);
      setTeacherMessage('Pick the correct starting consonant.');
      setFeedback('Game mode: choose the missing consonant to complete the word.');
      return;
    }

    if (!allVideosWatched) {
      setFeedback('Watch all learning materials to unlock Explore and Game.');
    } else {
      setFeedback('Learning materials review mode.');
    }
  };

  const handleAddTeacherActivity = () => {
    const title = teacherActivityTitle.trim();
    const focus = teacherActivityFocus.trim();
    const instructions = teacherActivityInstructions.trim();

    if (!title || !focus || !instructions) {
      setFeedback('Complete title, focus consonants, and instructions before adding an activity.');
      return;
    }

    const nextActivity = {
      id: Date.now(),
      title,
      focus,
      instructions,
    };

    setTeacherActivities((current) => [nextActivity, ...current]);
    setFeedback('Teacher activity added. You can now share it with your students.');
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

  const handleTeacherCheck = () => {
    if (!teacherChoice) {
      setTeacherResult('wrong');
      setTeacherMessage('Choose a consonant first.');
      return;
    }

    if (teacherChoice !== currentTeacherActivity.letter) {
      setTeacherResult('wrong');
      setTeacherMessage('Not quite. Try again.');
      return;
    }

    setTeacherResult('correct');
    setTeacherMessage('Great job! That is correct.');
  };

  const handleTeacherNext = () => {
    const nextIndex = teacherIndex + 1;

    if (nextIndex >= teacherActivityDeck.length) {
      setTeacherIndex(0);
      setTeacherChoice('');
      setTeacherResult(null);
      setTeacherMessage('Awesome work! You finished this activity.');
      return;
    }

    setTeacherIndex(nextIndex);
    setTeacherChoice('');
    setTeacherResult(null);
    setTeacherMessage('Pick the correct starting consonant.');
  };

  return (
    <div className="module-detail consonants-detail">
      <div className="consonants-topbar">
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
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'teacher'}
          className={`mode-pill${mode === 'teacher' ? ' active' : ''}${!allVideosWatched ? ' locked' : ''}`}
          onClick={() => handleModeChange('teacher')}
        >
          Teacher Activity
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'game'}
          className={`mode-pill${mode === 'game' ? ' active' : ''}${!allVideosWatched ? ' locked' : ''}`}
          onClick={() => handleModeChange('game')}
          disabled={!allVideosWatched}
        >
          Game
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'wordblast'}
          className={`mode-pill${mode === 'wordblast' ? ' active' : ''}${!allVideosWatched ? ' locked' : ''}`}
          onClick={() => handleModeChange('wordblast')}
          disabled={!allVideosWatched}
        >
          WordBlast
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
      ) : mode === 'explore' ? (
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
      ) : mode === 'teacher' ? (
        <div className="teacher-panel-stage">
          <div className="teacher-panel-header">
            <h3>Teacher Activity</h3>
            <p>Create and prepare consonant activities you can give to students.</p>
          </div>

          <div className="teacher-panel-form">
            <label className="teacher-field">
              <span>Activity title</span>
              <input
                type="text"
                value={teacherActivityTitle}
                onChange={(event) => setTeacherActivityTitle(event.target.value)}
                placeholder="Example: Consonant sound sorting"
              />
            </label>

            <label className="teacher-field">
              <span>Focus consonants</span>
              <input
                type="text"
                value={teacherActivityFocus}
                onChange={(event) => setTeacherActivityFocus(event.target.value)}
                placeholder="Example: B, C, D, F"
              />
            </label>

            <label className="teacher-field">
              <span>Student instructions</span>
              <textarea
                value={teacherActivityInstructions}
                onChange={(event) => setTeacherActivityInstructions(event.target.value)}
                rows={4}
                placeholder="Write clear instructions for students."
              />
            </label>

            <button type="button" className="teacher-create" onClick={handleAddTeacherActivity}>
              + ADD ACTIVITY
            </button>
          </div>

          <div className="teacher-activity-list" aria-label="Teacher activity list">
            {teacherActivities.map((activity) => (
              <article key={activity.id} className="teacher-activity-item">
                <h4>{activity.title}</h4>
                <p className="teacher-activity-focus">Focus: {activity.focus}</p>
                <p className="teacher-activity-instructions">{activity.instructions}</p>
              </article>
            ))}
          </div>
        </div>
      ) : mode === 'wordblast' ? (
        <WordBlast onClose={() => handleModeChange('learning')} />
      ) : (
        <div className="teacher-activity-stage">
          <div className="teacher-activity-header">
            <h3>Consonant Game</h3>
            <p>Complete each word by choosing the correct starting consonant.</p>
          </div>

          <div className="teacher-activity-card">
            <span className="teacher-activity-icon" aria-hidden="true">
              {currentTeacherActivity.icon}
            </span>
            <p className="teacher-activity-word">{currentTeacherActivity.prompt}</p>

            <div className="teacher-answer-row" aria-label="Teacher activity answer">
              <div className="teacher-letter-box" aria-label="Selected consonant">
                <span>{teacherChoice || '\u00A0'}</span>
              </div>

              <button type="button" className="teacher-check" onClick={handleTeacherCheck}>
                ✓ CHECK ANSWER
              </button>
            </div>

            <div className="teacher-choice-row" role="group" aria-label="Consonant choices">
              {currentTeacherActivity.choices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={choice === teacherChoice ? 'teacher-choice active' : 'teacher-choice'}
                  onClick={() => {
                    setTeacherChoice(choice);
                    setTeacherResult(null);
                    setTeacherMessage('Pick the correct starting consonant.');
                  }}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <div className={teacherResult === 'correct' ? 'teacher-result correct' : 'teacher-result wrong'} aria-live="polite">
            {teacherResult ? teacherMessage : ''}
          </div>

          {teacherResult === 'correct' ? (
            <button type="button" className="teacher-next" onClick={handleTeacherNext}>
              NEXT WORD
            </button>
          ) : null}

          <div className="teacher-dots" aria-label="Teacher activity progress">
            {teacherActivityDeck.map((item, index) => (
              <span key={`${item.letter}-${index}`} className={index === teacherIndex ? 'teacher-dot active' : 'teacher-dot'} />
            ))}
          </div>

          <p className="game-feedback">{teacherResult ? '' : teacherMessage}</p>
        </div>
      )}
    </div>
  );
}
