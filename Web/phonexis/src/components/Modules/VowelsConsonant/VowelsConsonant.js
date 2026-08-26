import { useState } from 'react';
import './VowelsConsonant.css';

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
];

const activityDeck = [
  { letter: 'A', prompt: '_pple', icon: '🍎', choices: ['A', 'E', 'I', 'O', 'U'] },
  { letter: 'E', prompt: '_lephant', icon: '🐘', choices: ['A', 'E', 'I', 'O', 'U'] },
  { letter: 'I', prompt: '_ce cream', icon: '🍦', choices: ['A', 'E', 'I', 'O', 'U'] },
  { letter: 'O', prompt: '_ctopus', icon: '🐙', choices: ['A', 'E', 'I', 'O', 'U'] },
  { letter: 'U', prompt: '_mbrella', icon: '☂️', choices: ['A', 'E', 'I', 'O', 'U'] },
];

export default function VowelsConsonant({ onComplete, onBack }) {
  const [mode, setMode] = useState('vowels');
  const [selectedLetter, setSelectedLetter] = useState(vowels[0].letter);
  const [activityIndex, setActivityIndex] = useState(0);
  const [activityChoice, setActivityChoice] = useState('');
  const [activityResult, setActivityResult] = useState(null);
  const [activityMessage, setActivityMessage] = useState('Choose the correct vowel.');
  const [feedback, setFeedback] = useState('Choose a vowel to hear its sound.');

  const activeList = mode === 'vowels' ? vowels : consonants;
  const selectedItem = activeList.find((item) => item.letter === selectedLetter) ?? activeList[0];
  const selectedPairs = vowelTeamBoards[selectedItem.letter] ?? [];
  const currentActivity = activityDeck[activityIndex];

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

  const resetActivity = () => {
    setActivityIndex(0);
    setActivityChoice('');
    setActivityResult(null);
    setActivityMessage('Choose the correct vowel.');
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);

    if (nextMode === 'vowels') {
      setSelectedLetter(vowels[0].letter);
      setFeedback('Choose a vowel to hear its sound.');
      return;
    }

    if (nextMode === 'consonants') {
      setSelectedLetter(consonants[0].letter);
      setFeedback('Choose a consonant to hear the object name.');
      return;
    }

    resetActivity();
    setFeedback('Practice matching the letter with the object.');
  };

  const handlePick = (letter) => {
    const nextItem = activeList.find((item) => item.letter === letter) ?? activeList[0];
    setSelectedLetter(nextItem.letter);

    if (mode === 'vowels') {
      setFeedback(`Selected ${nextItem.letter} - ${nextItem.word}.`);
      return;
    }

    speakText(nextItem.word, `Speaking ${nextItem.word}.`);
  };

  const speakCurrent = () => {
    if (mode === 'vowels') {
      speakText(`${selectedItem.letter}, ${selectedItem.sound}`, `Speaking ${selectedItem.letter} sound.`);
      return;
    }

    speakText(selectedItem.word, `Speaking ${selectedItem.word}.`);
  };

  const handleActivityCheck = () => {
    if (!activityChoice) {
      setActivityResult('wrong');
      setActivityMessage('Wrong answer. Choose a letter first.');
      return;
    }

    if (activityChoice !== currentActivity.letter) {
      setActivityResult('wrong');
      setActivityMessage('Wrong answer. Try again.');
      return;
    }

    setActivityResult('correct');
    setActivityMessage('Correct!');
  };

  const handleNextQuestion = () => {
    const nextIndex = activityIndex + 1;

    if (nextIndex >= activityDeck.length) {
      if (typeof onComplete === 'function') {
        onComplete();
      }
      return;
    }

    setActivityIndex(nextIndex);
    setActivityChoice('');
    setActivityResult(null);
    setActivityMessage('Choose the correct vowel.');
  };

  return (
    <div className="module-detail vowels-consonant-detail">
      <div className="vowels-topbar">
        <button type="button" className="vowels-back" onClick={onBack}>
          ← BACK TO DASHBOARD
        </button>
      </div>

      <div className="vowels-switch" role="tablist" aria-label="Vowels and consonants">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'vowels'}
          className={mode === 'vowels' ? 'mode-pill active' : 'mode-pill'}
          onClick={() => handleModeChange('vowels')}
        >
          Vowels
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'consonants'}
          className={mode === 'consonants' ? 'mode-pill active' : 'mode-pill'}
          onClick={() => handleModeChange('consonants')}
        >
          Consonants
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'activity'}
          className={mode === 'activity' ? 'mode-pill active' : 'mode-pill'}
          onClick={() => handleModeChange('activity')}
        >
          Activity
        </button>
      </div>

      {mode !== 'activity' ? (
        <div className="vowels-picker" aria-label={mode === 'vowels' ? 'Vowel choices' : 'Consonant choices'}>
          {activeList.map((item) => (
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
      ) : null}

      {mode !== 'activity' ? (
        <div className="vowels-stage">
          <span className="vowels-letter">{selectedItem.letter}</span>

          <div className="vowels-object">
            <span className="vowels-object-icon" aria-hidden="true">
              {selectedItem.icon}
            </span>
            <p className="vowels-object-word">{selectedItem.word}</p>
            <p className="vowels-object-sound">{mode === 'vowels' ? `Sound: "${selectedItem.sound}"` : 'Say the object name.'}</p>

            {mode === 'vowels' ? (
              <div className="vc-vowel-team-board" aria-label={`${selectedItem.letter} vowel team examples`}>
                <p className="vc-vowel-team-kicker">I can read</p>
                <h4 className="vc-vowel-team-heading">{selectedItem.letter} Vowel Teams</h4>

                <div className="vc-vowel-team-grid">
                  {selectedPairs.map((item) => (
                    <div key={`${selectedItem.letter}-${item.team}`} className="vc-vowel-team-card">
                      <span className="vc-vowel-team-chunk">{item.team}</span>
                      <span className="vc-vowel-team-word">{item.word}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <button type="button" className="vowels-listen" onClick={speakCurrent}>
            🔊 {mode === 'vowels' ? 'LISTEN TO SOUND' : 'LISTEN TO OBJECT'}
          </button>

          <p className="game-feedback">{feedback}</p>
        </div>
      ) : (
        <div className="activity-stage">
          <div className="activity-header">
            <h3>Fill in the Missing Vowel</h3>
            <p>Complete the word by adding the correct vowel</p>
          </div>

          <div className="activity-card">
            <span className="activity-card-icon" aria-hidden="true">
              {currentActivity.icon}
            </span>
            <p className="activity-word">{currentActivity.prompt}</p>

            <div className="activity-answer-row" aria-label="Answer selection">
              <div className="activity-letter-box" aria-label="Missing letter answer">
                <span>{activityChoice || '\u00A0'}</span>
              </div>

              <button type="button" className="activity-check" onClick={handleActivityCheck}>
                ✓ CHECK ANSWER
              </button>
            </div>

            <div className="activity-choice-row" role="group" aria-label="Vowel options">
              {currentActivity.choices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={choice === activityChoice ? 'activity-choice active' : 'activity-choice'}
                  onClick={() => {
                    setActivityChoice(choice);
                    setActivityResult(null);
                    setActivityMessage('Choose the correct vowel.');
                  }}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <div className={activityResult === 'correct' ? 'activity-result correct' : 'activity-result wrong'} aria-live="polite">
            {activityResult ? activityMessage : ''}
          </div>

          {activityResult === 'correct' ? (
            <button type="button" className="activity-next" onClick={handleNextQuestion}>
              NEXT QUESTION
            </button>
          ) : null}

          <div className="activity-dots" aria-label="Activity progress">
            {activityDeck.map((item, index) => (
              <span key={item.letter} className={index === activityIndex ? 'activity-dot active' : 'activity-dot'} />
            ))}
          </div>

          <p className="game-feedback">{activityResult ? '' : activityMessage}</p>
        </div>
      )}
    </div>
  );
}
