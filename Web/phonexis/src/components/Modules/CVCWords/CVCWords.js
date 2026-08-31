import { useEffect, useMemo, useState } from 'react';
import './CVCWords.css';

const cvcTypes = [
  { id: 'learning', label: 'Learning Video Materials' },
  { id: 'families', label: 'Word Families' },
  { id: 'selection', label: 'Word Selection' },
  { id: 'building', label: 'Word Building' },
];

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
];

const wordBuildingDeck = [
  {
    target: 'cat',
    icon: '🐱',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['', 'A', 'T'],
    choices: ['C', 'A', 'T', 'O', 'E'],
    description: 'A small pet that says meow.',
  },
  {
    target: 'dog',
    icon: '🐶',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['D', '', 'G'],
    choices: ['D', 'O', 'G', 'A', 'U'],
    description: 'A pet that barks.',
  },
  {
    target: 'sun',
    icon: '☀️',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['S', 'U', ''],
    choices: ['S', 'U', 'N', 'A', 'E'],
    description: 'The bright star in the sky.',
  },
  {
    target: 'pig',
    icon: '🐷',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['', 'I', 'G'],
    choices: ['P', 'I', 'G', 'O', 'E'],
    description: 'A farm animal that oinks.',
  },
  {
    target: 'bat',
    icon: '🦇',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['B', '', 'T'],
    choices: ['B', 'A', 'T', 'I', 'O'],
    description: 'A night flyer with tiny wings.',
  },
  {
    target: 'man',
    icon: '🧑',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['M', 'A', ''],
    choices: ['M', 'A', 'N', 'E', 'I'],
    description: 'A grown-up person.',
  },
  {
    target: 'fan',
    icon: '🪭',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['', 'A', 'N'],
    choices: ['F', 'A', 'N', 'O', 'U'],
    description: 'It moves air when it spins.',
  },
  {
    target: 'pen',
    icon: '🖊️',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['P', '', 'N'],
    choices: ['P', 'E', 'N', 'A', 'O'],
    description: 'A tool used for writing.',
  },
  {
    target: 'cup',
    icon: '🥤',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['C', 'U', ''],
    choices: ['C', 'U', 'P', 'A', 'O'],
    description: 'A container used for drinking.',
  },
];

const getRandomBuildingWord = () => wordBuildingDeck[Math.floor(Math.random() * wordBuildingDeck.length)];

export default function CVCWords({ onComplete, onBack, initialVideosWatched = [], onVideosWatchedChange, initialType = 'learning' }) {
  const [activeType, setActiveType] = useState(initialType);
  const [selectedFamily, setSelectedFamily] = useState(wordFamilies[0].family);
  const [selectedWord, setSelectedWord] = useState(wordSelection[0]);
  const [selectionIndex, setSelectionIndex] = useState(0);
  const [selectionResult, setSelectionResult] = useState(null);
  const [selectionMessage, setSelectionMessage] = useState('');
  const [buildingWord, setBuildingWord] = useState(getRandomBuildingWord());
  const [builtSlots, setBuiltSlots] = useState(buildingWord.slots);
  const [buildingChoice, setBuildingChoice] = useState(buildingWord.choices[0]);
  const [buildingResult, setBuildingResult] = useState(null);
  const [buildingMessage, setBuildingMessage] = useState('Choose the missing letter.');
  const [feedback, setFeedback] = useState('Watch the learning materials video to unlock the CVC activities.');
  const [videosWatched, setVideosWatched] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);

  useEffect(() => {
    setVideosWatched(Array.isArray(initialVideosWatched) ? initialVideosWatched : []);
  }, [initialVideosWatched]);

  const allVideosWatched = videosWatched.length === videos.length;

  useEffect(() => {
    setActiveType(initialType);
  }, [initialType]);

  const pickRandomBuildingWord = (excludeTarget) => {
    const availableWords = wordBuildingDeck.filter((item) => item.target !== excludeTarget);
    const source = availableWords.length > 0 ? availableWords : wordBuildingDeck;
    return source[Math.floor(Math.random() * source.length)];
  };

  const speakWord = (word) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setFeedback(`Hear the word: ${word}.`);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    setFeedback(`Speaking ${word}.`);
  };

  const activeFamily = useMemo(
    () => wordFamilies.find((item) => item.family === selectedFamily) ?? wordFamilies[0],
    [selectedFamily]
  );

  const handleTypeChange = (typeId) => {
    if (typeId !== 'learning' && !allVideosWatched) {
      setActiveType('learning');
      setFeedback('Watch the learning materials video to unlock the CVC activities.');
      return;
    }

    setActiveType(typeId);

    if (typeId === 'learning') {
      setFeedback('Watch the CVC introduction video to unlock the activities.');
      return;
    }

    if (typeId === 'families') {
      setFeedback('Choose a family and match the words.');
      return;
    }

    if (typeId === 'selection') {
      setFeedback('Choose the correct word for the picture.');
      return;
    }

    const nextBuildingWord = pickRandomBuildingWord();
    setBuildingWord(nextBuildingWord);
    setBuiltSlots(nextBuildingWord.slots);
    setBuildingChoice(nextBuildingWord.choices[0]);
    setBuildingResult(null);
    setBuildingMessage('Choose the missing letter.');
    setFeedback('Build the word by choosing the correct letter.');
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

  const handleFamilyPick = (family) => {
    setSelectedFamily(family);
    const nextFamily = wordFamilies.find((item) => item.family === family) ?? wordFamilies[0];
    setSelectedWord(nextFamily.words[0]);
    setFeedback(`Selected ${family} family.`);
  };

  const handleWordPick = (item) => {
    setSelectedWord(item);
    setFeedback(`${item.word} selected.`);
  };

  const currentSelection = wordSelection[selectionIndex];

  const handleSelectionPick = (choice) => {
    if (choice !== currentSelection.correct) {
      setSelectionResult('wrong');
      setSelectionMessage('Wrong answer. Try again.');
      setFeedback('');
      return;
    }

    setSelectionResult('correct');
    setSelectionMessage('Correct!');
    setFeedback('');
  };

  const handleNextSelection = () => {
    const nextIndex = selectionIndex + 1;

    if (nextIndex >= wordSelection.length) {
      if (typeof onComplete === 'function') {
        onComplete();
      }
      return;
    }

    setSelectionIndex(nextIndex);
    setSelectedWord(wordSelection[nextIndex]);
    setSelectionResult(null);
    setSelectionMessage('');
    setFeedback('');
  };

  const handleBuildLetter = (letter) => {
    setBuildingChoice(letter);
    setBuildingResult(null);
    setBuildingMessage('Choose the missing letter.');
    setFeedback(`Letter ${letter} selected.`);
  };

  const handleCheckBuild = () => {
    const blankIndex = buildingWord.slots.findIndex((slot) => slot === '');
    const nextSlots = [...buildingWord.slots];
    nextSlots[blankIndex] = buildingChoice;
    setBuiltSlots(nextSlots);

    if (nextSlots.join('').toLowerCase() === buildingWord.target) {
      setBuildingResult('correct');
      setBuildingMessage('Correct!');
      setFeedback('Correct!');
      return;
    }

    setBuildingResult('wrong');
    setBuildingMessage('Wrong answer. Try again.');
    setFeedback('Try again.');
  };

  const handleNextBuildingWord = () => {
    const nextBuildingWord = pickRandomBuildingWord(buildingWord.target);
    setBuildingWord(nextBuildingWord);
    setBuiltSlots(nextBuildingWord.slots);
    setBuildingChoice(nextBuildingWord.choices[0]);
    setBuildingResult(null);
    setBuildingMessage('Choose the missing letter.');
    setFeedback('Build the word by choosing the correct letter.');
  };

  const renderFamilies = () => (
    <div className="cvc-stage cvc-family-stage">
      <div className="cvc-family-grid" aria-label="Word family selector">
        {wordFamilies.map((familyItem) => (
          <button
            key={familyItem.family}
            type="button"
            className={familyItem.family === selectedFamily ? 'cvc-family-card active' : 'cvc-family-card'}
            onClick={() => handleFamilyPick(familyItem.family)}
            style={{
              '--family-accent': familyItem.family === '-ab' ? '#f4b942' :
                familyItem.family === '-ag' ? '#f65a4a' :
                familyItem.family === '-an' ? '#49b9d8' :
                familyItem.family === '-at' ? '#f39b4a' :
                familyItem.family === '-en' ? '#f1c65d' :
                familyItem.family === '-et' ? '#f65a4a' :
                familyItem.family === '-ip' ? '#eb7e3b' :
                familyItem.family === '-ot' ? '#c88d52' :
                familyItem.family === '-ug' ? '#e67ca7' :
                '#f0c865',
            }}
          >
            <span className="cvc-family-label">-{familyItem.family.replace('-', '')}</span>
            <div className="cvc-family-word-list">
              {familyItem.words.map((item) => (
                <span
                  key={`${familyItem.family}-${item.word}`}
                  className={item.word === selectedWord.word && familyItem.family === selectedFamily ? 'cvc-family-word active' : 'cvc-family-word'}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleWordPick(item);
                  }}
                >
                  {item.word}
                </span>
              ))}
            </div>
            <span className="cvc-family-footer">phonics practice</span>
          </button>
        ))}
      </div>

      <div className="cvc-centered-panel">
        <span className="cvc-centered-icon" aria-hidden="true">
          {selectedWord.icon}
        </span>
        <h3>{selectedWord.word}</h3>
        <p>{selectedWord.description}</p>
        <button type="button" className="cvc-action-button" onClick={() => speakWord(selectedWord.word)}>
          Hear the Word
        </button>
      </div>
    </div>
  );

  const renderLearningMaterials = () => (
    <div className="cvc-learning-materials">
      {currentVideoIndex !== null ? (
        <div className="cvc-video-player-modal">
          <button type="button" className="cvc-video-close-btn" onClick={closeVideoPlayer}>
            ✕
          </button>
          <div className="cvc-video-player-container">
            <div className="cvc-video-player">
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
            <div className="cvc-video-player-info">
              <h3>{videos[currentVideoIndex].title}</h3>
              <p>{videos[currentVideoIndex].description}</p>
              <div className="cvc-video-watched-notice">
                <p className="cvc-watched-notice-text">
                  The video will be marked as watched once you finish watching it completely.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {currentVideoIndex === null ? (
        <>
          <div className="cvc-learning-header">
            <h3>Learning Video Materials</h3>
            <p>Watch the CVC video to unlock the activities below.</p>
          </div>

          <div className="cvc-videos-grid">
            {videos.map((video, index) => (
              <div key={video.id} className="cvc-video-card">
                <div className="cvc-video-thumbnail">
                  <span className="cvc-video-icon">🎬</span>
                  {videosWatched.includes(video.id) ? <span className="cvc-video-watched-badge">✓ Watched</span> : null}
                </div>
                <div className="cvc-video-info">
                  <h4>{video.title}</h4>
                  <p>{video.description}</p>
                  <span className="cvc-video-duration">{video.duration}</span>
                </div>
                <button
                  type="button"
                  className={`cvc-video-play-btn${videosWatched.includes(video.id) ? ' watched' : ''}`}
                  onClick={() => handlePlayVideo(index)}
                >
                  ▶ {videosWatched.includes(video.id) ? 'REWATCH' : 'PLAY'}
                </button>
              </div>
            ))}
          </div>

          <div className="cvc-learning-progress">
            <div className="cvc-progress-bar">
              <div className="cvc-progress-fill" style={{ width: `${(videosWatched.length / videos.length) * 100}%` }} />
            </div>
            <p className="cvc-progress-label">{videosWatched.length} of {videos.length} videos watched</p>
          </div>
        </>
      ) : null}
    </div>
  );

  const renderSelection = () => (
    <div className="cvc-stage cvc-selection-stage">
      <div className="cvc-selection-header">
        <h3>Choose the Correct Word</h3>
        <p>{currentSelection.prompt}</p>
      </div>

      <div className="cvc-selection-card-shell">
        <div className="cvc-selection-image" aria-hidden="true">
          {currentSelection.icon}
        </div>

        <div className="cvc-selection-answer-area">
          <div className="cvc-selection-choices" aria-label="Word selection choices">
            {currentSelection.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                className={selectionResult === 'correct' && choice === currentSelection.correct ? 'cvc-selection-option correct' : choice === currentSelection.correct && selectionResult === 'wrong' ? 'cvc-selection-option correct' : 'cvc-selection-option'}
                onClick={() => handleSelectionPick(choice)}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>

        <div className={selectionResult === 'correct' ? 'cvc-selection-message correct' : 'cvc-selection-message wrong'} aria-live="polite">
          {selectionMessage}
        </div>

        {selectionResult === 'correct' ? (
          <button type="button" className="cvc-action-button cvc-next-button" onClick={handleNextSelection}>
            Next
          </button>
        ) : null}
      </div>

      <div className="cvc-dots" aria-label="Selection progress">
        {wordSelection.map((item, index) => (
          <span key={item.word} className={index === selectionIndex ? 'cvc-dot active' : index < selectionIndex ? 'cvc-dot done' : 'cvc-dot'} />
        ))}
      </div>
    </div>
  );

  const renderBuilding = () => (
    <div className="cvc-stage">
      <div className="cvc-building-shell">
        <div className="cvc-building-hint" aria-label="Word clue">
          <span className="cvc-building-hint-label">Object clue</span>
          <span className="cvc-building-hint-icon" aria-hidden="true">
            {buildingWord.icon}
          </span>
          <p>{buildingWord.description}</p>
        </div>

        <span className="cvc-centered-icon" aria-hidden="true">
          {buildingWord.icon}
        </span>
        <h3>Word Building</h3>
        <p>{buildingWord.prompt}</p>

        <div className="cvc-build-word" aria-label="Built word">
          {builtSlots.map((slot, index) => (
            <div key={`${index}-${slot}`} className={slot ? 'cvc-build-slot filled' : 'cvc-build-slot'}>
              {slot || '_'}
            </div>
          ))}
        </div>

        <div className="cvc-letter-choices" aria-label="Letter choices">
          {buildingWord.choices.map((letter) => (
            <button
              key={letter}
              type="button"
              className={letter === buildingChoice ? 'cvc-letter-choice active' : 'cvc-letter-choice'}
              onClick={() => handleBuildLetter(letter)}
            >
              {letter}
            </button>
          ))}
        </div>

        <button type="button" className="cvc-action-button" onClick={handleCheckBuild}>
          Check Word
        </button>

        {buildingResult === 'correct' ? (
          <button type="button" className="cvc-action-button cvc-next-button" onClick={handleNextBuildingWord}>
            Next Word
          </button>
        ) : null}

        <div className={buildingResult === 'correct' ? 'cvc-selection-message correct' : 'cvc-selection-message wrong'} aria-live="polite">
          {buildingMessage}
        </div>
      </div>
    </div>
  );

  return (
    <div className="module-detail cvc-detail">
      <div className="cvc-topbar">
      </div>

      {activeType === 'learning' ? renderLearningMaterials() : null}
      {activeType === 'families' ? renderFamilies() : null}
      {activeType === 'selection' ? renderSelection() : null}
      {activeType === 'building' ? renderBuilding() : null}

      <div className="cvc-feedback" aria-live="polite">
        {activeType === 'selection' || activeType === 'building' ? '' : feedback}
      </div>
    </div>
  );
}
