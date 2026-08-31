import { useEffect, useState } from 'react';
import './Vowels.css';
import DoubleVowelLesson from './DoubleVowelLesson';
import VowelRush from './VowelRush';

const vowels = [
  { letter: 'A', sound: 'ah', word: 'Apple', icon: '🍎' },
  { letter: 'E', sound: 'eh', word: 'Elephant', icon: '🐘' },
  { letter: 'I', sound: 'ih', word: 'Ice cream', icon: '🍦' },
  { letter: 'O', sound: 'oh', word: 'Octopus', icon: '🐙' },
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

export default function Vowels({ onComplete, onBack, initialVideosWatched = [], onVideosWatchedChange, initialMode = 'learning' }) {
  const [mode, setMode] = useState(initialMode);
  const [selectedLetter, setSelectedLetter] = useState(vowels[0].letter);
  const [teacherActivityTitle, setTeacherActivityTitle] = useState('Vowel team word sort');
  const [teacherActivityFocus, setTeacherActivityFocus] = useState('A, E, I, O, U');
  const [teacherActivityInstructions, setTeacherActivityInstructions] = useState('Ask students to sort picture cards by vowel sound and read each word aloud.');
  const [teacherActivities, setTeacherActivities] = useState([
    {
      id: 1,
      title: 'Missing vowel challenge',
      focus: 'A and E',
      instructions: 'Students fill in missing vowels to complete each word, then read the word to the class.',
    },
  ]);
  const [feedback, setFeedback] = useState('Choose a vowel to hear its sound.');
  const [videosWatched, setVideosWatched] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);
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

    if (nextMode === 'pretest') {
      setFeedback('Teacher activity panel: create vowel tasks for students.');
      return;
    }

    if (!allVideosWatched) {
      setFeedback('Watch all videos to unlock Lesson and Teacher Activity.');
    }
  };

  const handleAddPretestActivity = () => {
    const title = teacherActivityTitle.trim();
    const focus = teacherActivityFocus.trim();
    const instructions = teacherActivityInstructions.trim();

    if (!title || !focus || !instructions) {
      setFeedback('Complete title, focus vowels, and instructions before adding an activity.');
      return;
    }

    const nextActivity = {
      id: Date.now(),
      title,
      focus,
      instructions,
    };

    setTeacherActivities((current) => [nextActivity, ...current]);
    setFeedback('Teacher activity added for the vowel pretest section.');

    if (typeof onComplete === 'function') {
      onComplete();
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

  const handlePick = (letter) => {
    const nextItem = vowels.find((item) => item.letter === letter) ?? vowels[0];
    setSelectedLetter(nextItem.letter);
    setFeedback(`Selected ${nextItem.letter} - ${nextItem.word}.`);
  };

  const speakCurrent = () => {
    speakText(`${selectedItem.letter}, ${selectedItem.sound}`, `Speaking ${selectedItem.letter} sound.`);
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

  return (
    <div className="module-detail vowels-detail">
      <div className="vowels-topbar">
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
                <h3>Learning Video Materials</h3>
                <p>Watch all videos to unlock Basics of the Vowels and Teacher Activity</p>
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
                    ✓ Basics of the Vowels and Teacher Activity unlocked! Click the Lesson or Teacher Activity tab to proceed.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      ) : mode === 'lesson' ? (
        <div className="lesson-stage">
          <div className="lesson-header">
            <h3>Basics of the Vowels</h3>
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

            <div className="vowel-team-board" aria-label={`${selectedItem.letter} vowel team examples`}>
              <p className="vowel-team-kicker">Pair Vowels</p>
              <h4 className="vowel-team-heading">{selectedItem.letter} Vowel Pairs</h4>

              <div className="vowel-team-grid">
                {selectedPairs.map((item) => {
                  const pairLetters = getPairLetters(item.team, item.word);

                  return (
                    <button
                      key={`${selectedItem.letter}-${item.team}`}
                      type="button"
                      className="vowel-team-card"
                      onClick={() => speakText(item.word, `Listening to ${item.word}.`)}
                      aria-label={`Listen to the word ${item.word}`}
                    >
                      <span className="vowel-team-chunk">{item.team}</span>
                      <span className="vowel-team-word">{renderHighlightedWord(item.word, pairLetters)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="button" className="vowels-listen" onClick={speakCurrent}>
              🔊 LISTEN TO SOUND
            </button>

            <DoubleVowelLesson onFeedback={setFeedback} />

            <p className="game-feedback">{feedback}</p>
          </div>
        </div>
      ) : mode === 'pretest' ? (
        <div className="pretest-stage">
          <div className="pretest-teacher-panel-stage">
            <div className="pretest-header">
              <h3>Pretest Teacher Activity</h3>
              <p>Create vowel activities to give students before assessment.</p>
            </div>

            <div className="pretest-teacher-panel-form">
              <label className="pretest-teacher-field">
                <span>Activity title</span>
                <input
                  type="text"
                  value={teacherActivityTitle}
                  onChange={(event) => setTeacherActivityTitle(event.target.value)}
                  placeholder="Example: Vowel sound matching"
                />
              </label>

              <label className="pretest-teacher-field">
                <span>Focus vowels</span>
                <input
                  type="text"
                  value={teacherActivityFocus}
                  onChange={(event) => setTeacherActivityFocus(event.target.value)}
                  placeholder="Example: A, E, I"
                />
              </label>

              <label className="pretest-teacher-field">
                <span>Student instructions</span>
                <textarea
                  value={teacherActivityInstructions}
                  onChange={(event) => setTeacherActivityInstructions(event.target.value)}
                  rows={4}
                  placeholder="Write clear vowel activity instructions for students."
                />
              </label>

              <button type="button" className="pretest-teacher-create" onClick={handleAddPretestActivity}>
                + ADD ACTIVITY
              </button>
            </div>

            <div className="pretest-teacher-activity-list" aria-label="Vowel teacher activity list">
              {teacherActivities.map((activity) => (
                <article key={activity.id} className="pretest-teacher-activity-item">
                  <h4>{activity.title}</h4>
                  <p className="pretest-teacher-activity-focus">Focus: {activity.focus}</p>
                  <p className="pretest-teacher-activity-instructions">{activity.instructions}</p>
                </article>
              ))}
            </div>

            <p className="game-feedback">{feedback}</p>
          </div>
        </div>
      ) : mode === 'vowelrush' ? (
        <div className="vowelrush-stage">
          <VowelRush onClose={() => handleModeChange('learning')} />
        </div>
      ) : null}
    </div>
  );
}
