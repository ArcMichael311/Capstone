// Shared gamification rules for the student dashboard, sidebar and profile.

export const ranks = [
  { min: 0, title: 'Letter Rookie', icon: '🌱' },
  { min: 20, title: 'Sound Seeker', icon: '🔎' },
  { min: 40, title: 'Phonics Explorer', icon: '🧭' },
  { min: 60, title: 'Word Builder', icon: '🧱' },
  { min: 80, title: 'Reading Hero', icon: '🦸' },
  { min: 100, title: 'Phonics Champion', icon: '👑' },
];

export const getRank = (progress) => [...ranks].reverse().find((rank) => progress >= rank.min) || ranks[0];

export const getNextRank = (progress) => ranks.find((rank) => rank.min > progress) || null;

export const getLevel = (progress) => Math.min(Math.floor(progress / 20) + 1, 6);

// Progress (0-100) through the current level, for XP bars.
export const getXpInLevel = (progress) => (progress >= 100 ? 100 : ((progress % 20) / 20) * 100);

export const getStars = (progress) => {
  if (progress >= 100) return 3;
  if (progress >= 67) return 2;
  if (progress >= 34) return 1;
  return 0;
};
