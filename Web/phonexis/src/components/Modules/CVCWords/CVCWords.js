import { useEffect, useRef, useState } from 'react';
import './CVCWords.css';
import { speakText } from './speechUtils';
import VoicePractice from '../../VoicePractice/VoicePractice';

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
  {
    target: 'bag',
    icon: '👜',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['B', 'A', ''],
    choices: ['B', 'A', 'G', 'D', 'R'],
    description: 'A container you carry your things in.',
  },
  {
    target: 'car',
    icon: '🚗',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['C', 'A', ''],
    choices: ['C', 'A', 'R', 'T', 'M'],
    description: 'A vehicle with four wheels.',
  },
  {
    target: 'bus',
    icon: '🚌',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['B', 'U', 'S'],
    choices: ['B', 'U', 'S', 'T', 'P'],
    description: 'A large vehicle that carries many people.',
  },
];

const getRandomBuildingWord = () => wordBuildingDeck[Math.floor(Math.random() * wordBuildingDeck.length)];

const createBalloonSet = (word, builtSlots = [], previousLanes = {}, round = 0) => {
  const remainingTargetLetters = word.target
    .toUpperCase()
    .split('')
    .filter((_, index) => !builtSlots[index]);
  const targetLetter = remainingTargetLetters.length > 0
    ? remainingTargetLetters[Math.floor(Math.random() * remainingTargetLetters.length)]
    : null;
  const distractorPool = word.choices.filter((letter) => !remainingTargetLetters.includes(letter));
  const distractorCount = 3;
  const distractors = Array.from({ length: distractorCount }, (_, index) => (
    distractorPool[index % distractorPool.length]
  ));
  const letters = shuffleItems(targetLetter ? [targetLetter, ...distractors] : distractors);
  const availableLanes = shuffleItems([0, 1, 2, 3]);

  return letters.map((letter, index) => {
    const previousLane = previousLanes[letter];
    const laneOptions = availableLanes.filter((lane) => lane !== previousLane);
    const lane = laneOptions.length > 0 ? laneOptions[0] : availableLanes[0];
    availableLanes.splice(availableLanes.indexOf(lane), 1);
    previousLanes[letter] = lane;

    return {
      id: `${word.target}-${round}-${index}-${letter}`,
      letter,
      lane,
      delay: `${(index % 5) * 0.35}s`,
    };
  });
};

export default function CVCWords({ onComplete, initialVideosWatched = [], onVideosWatchedChange, initialType = 'learning' }) {
  const [activeType, setActiveType] = useState(initialType);
  const [selectedFamily, setSelectedFamily] = useState(wordFamilies[0].family);
  const [selectedWord, setSelectedWord] = useState(wordSelection[0]);
  const [selectionDeck, setSelectionDeck] = useState(createSelectionDeck);
  const [selectionIndex, setSelectionIndex] = useState(0);
  const [selectionResult, setSelectionResult] = useState(null);
  const [selectionMessage, setSelectionMessage] = useState('');
  const [buildingWord, setBuildingWord] = useState(getRandomBuildingWord());
  const [builtSlots, setBuiltSlots] = useState(['', '', '']);
  const balloonLaneHistoryRef = useRef({});
  const balloonRoundRef = useRef(0);
  const [balloons, setBalloons] = useState(() => createBalloonSet(buildingWord, [], balloonLaneHistoryRef.current));
  const [balloonHearts, setBalloonHearts] = useState(4);
  const [balloonStreak, setBalloonStreak] = useState(0);
  const [balloonShield, setBalloonShield] = useState(false);
  const [balloonRewards, setBalloonRewards] = useState([]);
  const [balloonStatus, setBalloonStatus] = useState('Pop the balloons in order to spell the word.');
  const [balloonGameOver, setBalloonGameOver] = useState(false);
  const [poppedBalloons, setPoppedBalloons] = useState({});
  const [feedback, setFeedback] = useState('Watch the learning materials video to unlock the CVC activities.');
  const [videosWatched, setVideosWatched] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);
  const [showVoicePractice, setShowVoicePractice] = useState(false);
  const [isReadingInstructions, setIsReadingInstructions] = useState(false);
  const [isReadingHint, setIsReadingHint] = useState(false);
  const [isReadingSelectionWord, setIsReadingSelectionWord] = useState(false);
  useEffect(() => {
    setVideosWatched(Array.isArray(initialVideosWatched) ? initialVideosWatched : []);
  }, [initialVideosWatched]);

  useEffect(() => {
    setActiveType(initialType);
  }, [initialType]);

  const pickRandomBuildingWord = (excludeTarget) => {
    const availableWords = wordBuildingDeck.filter((item) => item.target !== excludeTarget);
    const source = availableWords.length > 0 ? availableWords : wordBuildingDeck;
    return source[Math.floor(Math.random() * source.length)];
  };

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

  const speakBalloonInstructions = () => {
    const instructions = 'Listen carefully. Pop the one balloon with a letter from the word. You can choose the letters in any order. Wrong balloons take away one heart.';

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setBalloonStatus('Speech is not available. Please ask for help reading the instructions.');
      return;
    }

    if (isReadingInstructions) {
      stopSpeech();
      setBalloonStatus('Stopped reading the game instructions.');
      return;
    }

    speakText(instructions, {
      rate: 0.85,
      onend: () => setIsReadingInstructions(false),
      onerror: () => setIsReadingInstructions(false),
    });
    setIsReadingInstructions(true);
    setBalloonStatus('Speaking the game instructions.');
  };

  const speakBalloonHint = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setBalloonStatus('Speech is not available. Please ask for help reading the hint.');
      return;
    }

    if (isReadingHint) {
      stopSpeech();
      setBalloonStatus('Stopped reading the hint.');
      return;
    }

    speakText(buildingWord.description, {
      rate: 0.85,
      onend: () => setIsReadingHint(false),
      onerror: () => setIsReadingHint(false),
    });
    setIsReadingHint(true);
    setBalloonStatus('Speaking the word hint.');
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsReadingInstructions(false);
    setIsReadingHint(false);
  };

  useEffect(() => {
    if (activeType !== 'building') {
      stopSpeech();
    }
  }, [activeType]);

  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsReadingInstructions(false);
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

  const handleFamilyPick = (family) => {
    setSelectedFamily(family);
    const nextFamily = wordFamilies.find((item) => item.family === family) ?? wordFamilies[0];
    setSelectedWord(nextFamily.words[0]);
    setFeedback(`Selected ${family} family.`);
  };

  const handleWordPick = (item) => {
    setSelectedWord(item);
    speakText(item.word, { rate: 0.9 });
  };

  const currentSelection = selectionDeck[selectionIndex];

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

    if (nextIndex >= selectionDeck.length) {
      const nextDeck = createSelectionDeck();
      setSelectionDeck(nextDeck);
      setSelectionIndex(0);
      setSelectionResult(null);
      setSelectionMessage('');
      setFeedback('New word set ready!');

      if (typeof onComplete === 'function') {
        onComplete();
      }
      return;
    }

    setSelectionIndex(nextIndex);
  setSelectedWord(selectionDeck[nextIndex]);
    setSelectionResult(null);
    setSelectionMessage('');
    setIsReadingSelectionWord(false);
    setFeedback('');
  };

  const handleNextBuildingWord = () => {
    const nextBuildingWord = pickRandomBuildingWord(buildingWord.target);
    setBuildingWord(nextBuildingWord);
    setBuiltSlots(['', '', '']);
    balloonLaneHistoryRef.current = {};
    balloonRoundRef.current += 1;
    setBalloons(createBalloonSet(nextBuildingWord, [], balloonLaneHistoryRef.current, balloonRoundRef.current));
    setBalloonGameOver(false);
    setPoppedBalloons({});
    setBalloonStatus('Pop the balloons in order to spell the word.');
  };

  const awardBalloonReward = () => {
    const rewardTypes = ['shield', 'heal', 'reveal'];
    const reward = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
    setBalloonRewards((currentRewards) => [...currentRewards, reward]);
    setBalloonStatus(`Streak reward: ${reward === 'shield' ? 'Shield' : reward === 'heal' ? 'Extra heart' : 'Reveal letter'} earned!`);
  };

  const claimBalloonReward = (reward) => {
    setBalloonRewards((currentRewards) => {
      const rewardIndex = currentRewards.indexOf(reward);
      if (rewardIndex === -1) return currentRewards;
      return currentRewards.filter((_, index) => index !== rewardIndex);
    });

    if (reward === 'shield') {
      setBalloonShield(true);
      setBalloonStatus('Shield ready: one wrong balloon will not cost a heart.');
      return;
    }

    if (reward === 'heal') {
      setBalloonHearts((currentHearts) => Math.min(4, currentHearts + 1));
      setBalloonStatus('Heart restored!');
      return;
    }

    const nextIndex = builtSlots.findIndex((slot) => !slot);
    if (nextIndex === -1) return;
    const nextSlots = [...builtSlots];
    nextSlots[nextIndex] = buildingWord.target[nextIndex].toUpperCase();
    setBuiltSlots(nextSlots);
    setBalloonStatus('The next letter was revealed!');
  };

  const handleBalloonClick = (balloon) => {
    if (balloonGameOver || builtSlots.every(Boolean) || poppedBalloons[balloon.id]) return;

    speakText(balloon.letter);

    const targetIndex = buildingWord.target
      .toUpperCase()
      .split('')
      .findIndex((letter, index) => letter === balloon.letter && !builtSlots[index]);
    if (targetIndex !== -1) {
      const nextSlots = [...builtSlots];
      nextSlots[targetIndex] = balloon.letter;
      const nextStreak = balloonStreak + 1;
      setPoppedBalloons((currentPopped) => ({ ...currentPopped, [balloon.id]: 'correct' }));
      setBuiltSlots(nextSlots);
      setBalloonStreak(nextStreak);

      if (nextSlots.every(Boolean)) {
        const completedWord = nextSlots.join('');
        setBalloonStatus('Correct! Word complete!');
        speakText(completedWord, { rate: 0.8 });
      } else {
        const nextRound = createBalloonSet(buildingWord, nextSlots, balloonLaneHistoryRef.current, balloonRoundRef.current + 1);
        setBalloonStatus('Correct! Next letter is coming!');
        window.setTimeout(() => {
          setBalloons((currentBalloons) => currentBalloons.filter((item) => item.id !== balloon.id));
          setPoppedBalloons((currentPopped) => {
            const nextPopped = { ...currentPopped };
            delete nextPopped[balloon.id];
            return nextPopped;
          });
          balloonRoundRef.current += 1;
          setBalloons(nextRound);
        }, 400);
      }

      if (nextSlots.every(Boolean)) {
        window.setTimeout(() => {
          setBalloons((currentBalloons) => currentBalloons.filter((item) => item.id !== balloon.id));
          setPoppedBalloons((currentPopped) => {
            const nextPopped = { ...currentPopped };
            delete nextPopped[balloon.id];
            return nextPopped;
          });
        }, 400);
      }
      if (nextStreak > 0 && nextStreak % 3 === 0) awardBalloonReward();
      return;
    }

    if (balloonShield) {
      setPoppedBalloons((currentPopped) => ({ ...currentPopped, [balloon.id]: 'wrong' }));
      setBalloonShield(false);
      setBalloonStatus('Wrong balloon! Shield blocked it.');
      window.setTimeout(() => {
        setBalloons((currentBalloons) => currentBalloons.filter((item) => item.id !== balloon.id));
        setPoppedBalloons((currentPopped) => {
          const nextPopped = { ...currentPopped };
          delete nextPopped[balloon.id];
          return nextPopped;
        });
      }, 400);
      return;
    }

    setPoppedBalloons((currentPopped) => ({ ...currentPopped, [balloon.id]: 'wrong' }));
    setBalloonHearts((currentHearts) => {
      const nextHearts = currentHearts - 1;
      if (nextHearts <= 0) {
        setBalloonGameOver(true);
        setBalloonStatus('Out of hearts. Try the word again.');
      } else {
        setBalloonStatus('Wrong! That letter is not in the word.');
      }
      return nextHearts;
    });
    setBalloonStreak(0);
    window.setTimeout(() => {
      setBalloons((currentBalloons) => currentBalloons.filter((item) => item.id !== balloon.id));
      setPoppedBalloons((currentPopped) => {
        const nextPopped = { ...currentPopped };
        delete nextPopped[balloon.id];
        return nextPopped;
      });
    }, 400);
  };

  const handleBalloonCycle = () => {
    if (balloonGameOver || builtSlots.every(Boolean)) return;

    balloonRoundRef.current += 1;
    setBalloons(createBalloonSet(buildingWord, builtSlots, balloonLaneHistoryRef.current, balloonRoundRef.current));
    setBalloonStatus('New balloons are here! Find the one letter from the word.');
  };

  const restartBalloonGame = () => {
    setBalloonHearts(4);
    setBalloonStreak(0);
    setBalloonShield(false);
    setBalloonRewards([]);
    setBalloonGameOver(false);
    setBuiltSlots(['', '', '']);
    setPoppedBalloons({});
    balloonLaneHistoryRef.current = {};
    balloonRoundRef.current += 1;
    setBalloons(createBalloonSet(buildingWord, [], balloonLaneHistoryRef.current, balloonRoundRef.current));
    setBalloonStatus('Pop the balloons in order to spell the word.');
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
        <div className="cvc-button-group">
          <button 
            type="button" 
            className="cvc-voice-practice-btn"
            onClick={() => setShowVoicePractice(!showVoicePractice)}
            aria-expanded={showVoicePractice}
          >
            🎤 Practice Pronunciation
          </button>
        </div>
        {showVoicePractice && (
          <div className="cvc-voice-practice-wrapper">
            <VoicePractice 
              targetWord={selectedWord.word}
              onResult={(result) => {
                if (result.success) {
                  setFeedback(`Great! You pronounced "${selectedWord.word}" correctly!`);
                } else {
                  setFeedback(`Try again. You said "${result.recognized}", but aim for "${result.target}".`);
                }
              }}
              showTranscript={true}
            />
          </div>
        )}
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
        <button
          type="button"
          className={`cvc-selection-image${isReadingSelectionWord ? ' speaking' : ''}`}
          onClick={speakSelectionWord}
          aria-label={`Hear the word ${currentSelection.word}`}
          title="Click to hear the word"
        >
          {currentSelection.icon}
        </button>

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
        {selectionDeck.map((item, index) => (
          <span key={item.word} className={index === selectionIndex ? 'cvc-dot active' : index < selectionIndex ? 'cvc-dot done' : 'cvc-dot'} />
        ))}
      </div>
    </div>
  );

  const renderBuilding = () => (
    <div className="cvc-stage cvc-balloon-stage">
      <div className="cvc-balloon-header">
        <div className="cvc-balloon-hint">
          <span className="cvc-building-hint-label">Balloon spelling</span>
          <h3>{buildingWord.icon} Pop the CVC word</h3>
          <div className="cvc-building-hint-icon" aria-hidden="true">{buildingWord.icon}</div>
          <p className="cvc-balloon-hint-sentence">{buildingWord.description}</p>
          <button type="button" className="cvc-instructions-button" onClick={speakBalloonHint}>
            {isReadingHint ? '⏹ Stop Hint' : '🔊 Hear Hint'}
          </button>
          <p className="cvc-balloon-instructions">
            Click the one balloon letter from the word. You can choose letters in any order.
          </p>
          <button type="button" className="cvc-instructions-button" onClick={speakBalloonInstructions}>
            {isReadingInstructions ? '⏹ Stop Instructions' : '🔊 Hear Instructions'}
          </button>
        </div>
        <div className="cvc-balloon-stats" aria-label="Game status">
          <strong>{'♥'.repeat(balloonHearts)}{'♡'.repeat(4 - balloonHearts)}</strong>
          <span>Streak {balloonStreak}</span>
          {balloonShield ? <span className="cvc-shield-badge">🛡 Shield ready</span> : null}
        </div>
      </div>

      <div className="cvc-build-word" aria-label="Word progress">
        {builtSlots.map((slot, index) => (
          <div key={`${index}-${slot}`} className={slot ? 'cvc-build-slot filled' : 'cvc-build-slot'}>{slot || '_'}</div>
        ))}
      </div>

      <div className="cvc-balloon-sky" aria-label="Letter balloons" onAnimationIteration={handleBalloonCycle}>
        {balloons.map((balloon) => (
          <button
            key={balloon.id}
            type="button"
            className={`cvc-balloon${poppedBalloons[balloon.id] ? ` popped ${poppedBalloons[balloon.id]}` : ''}`}
            style={{ '--balloon-lane': balloon.lane, '--balloon-delay': balloon.delay }}
            onClick={() => handleBalloonClick(balloon)}
            disabled={balloonGameOver || builtSlots.every(Boolean)}
            aria-label={`Letter ${balloon.letter}`}
          >
            {balloon.letter}
          </button>
        ))}
      </div>

      <div className="cvc-balloon-message" aria-live="polite">{balloonStatus}</div>
      <div className="cvc-reward-tray" aria-label="Streak rewards">
        <span>Rewards:</span>
        {['shield', 'heal', 'reveal'].map((reward) => {
          const count = balloonRewards.filter((item) => item === reward).length;
          return (
            <button key={reward} type="button" disabled={!count || balloonGameOver} onClick={() => claimBalloonReward(reward)}>
              {reward === 'shield' ? '🛡 Shield' : reward === 'heal' ? '♥ Heal' : '✨ Reveal'} {count ? `(${count})` : ''}
            </button>
          );
        })}
      </div>

      {builtSlots.every(Boolean) ? <button type="button" className="cvc-action-button" onClick={handleNextBuildingWord}>Next Word</button> : null}

      {balloonGameOver ? (
        <div className="cvc-game-over-modal" role="dialog" aria-modal="true" aria-labelledby="cvc-game-over-title">
          <div className="cvc-game-over-card">
            <div className="cvc-game-over-icon" aria-hidden="true">💔</div>
            <h3 id="cvc-game-over-title">Game Over</h3>
            <p>You ran out of hearts. Try the word again!</p>
            <button type="button" className="cvc-action-button" onClick={restartBalloonGame}>Try Again</button>
          </div>
        </div>
      ) : null}
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
