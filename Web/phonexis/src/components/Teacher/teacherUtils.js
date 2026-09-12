export const MODULES = [
  { key: 'alphabet', title: 'Alphabet Recognition', subtitle: 'Letter mastery leaderboard', icon: '📘', accent: 'blue' },
  { key: 'vowels', title: 'Vowels', subtitle: 'Vowel completion ranking', icon: '🔉', accent: 'purple' },
  { key: 'consonants', title: 'Consonants', subtitle: 'Consonant completion ranking', icon: '🔊', accent: 'green' },
  { key: 'cvc', title: 'CVC Words', subtitle: 'Word-building leaderboard', icon: '💡', accent: 'pink' },
];

export const safePercent = (value) => {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(number)));
};

export const getDisplayName = (user) => {
  const firstName = user?.firstName || user?.firstname || user?.user_metadata?.firstName || user?.user_metadata?.firstname || '';
  const lastName = user?.lastName || user?.lastname || user?.user_metadata?.lastName || user?.user_metadata?.lastname || '';
  return `${firstName} ${lastName}`.trim() || user?.email || 'Student';
};

export const formatDuration = (durationMs) => {
  if (durationMs == null || Number.isNaN(durationMs) || durationMs < 0) {
    return 'N/A';
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};

export const formatTimestamp = (value) => {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  return parsed.toLocaleString();
};

export const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const hasMeaningfulProgress = (progress) => {
  if (!progress) {
    return false;
  }

  const updatedAt = progress.updatedAt ? new Date(progress.updatedAt) : null;
  const createdAt = progress.createdAt ? new Date(progress.createdAt) : null;
  const timestampChanged = updatedAt && createdAt && !Number.isNaN(updatedAt.getTime()) && !Number.isNaN(createdAt.getTime()) && updatedAt.getTime() > createdAt.getTime();
  const watchedVideos = Array.isArray(progress.videosWatched)
    ? progress.videosWatched.length > 0
    : String(progress.videosWatched || '').trim() !== '[]' && String(progress.videosWatched || '').trim() !== '';

  return Boolean(
    timestampChanged
    || safePercent(progress.completionPercentage) > 0
    || progress.lessonUnlocked
    || progress.pretestUnlocked
    || progress.pretestCompleted
    || progress.easyModeCompleted
    || progress.mediumModeCompleted
    || progress.hardModeCompleted
    || watchedVideos
  );
};
