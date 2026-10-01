// Saves a finished game run to the backend so teachers see it in Academic Progress.
// App.js sets the logged-in student's backend id; games just call reportGameScore().
import { recordBackendGameScore } from '../../../lib/supabaseClient';

let currentUserId = null;

export const setGameScoreUserId = (userId) => {
  currentUserId = userId ?? null;
};

export const reportGameScore = (gameName, score) => {
  const value = Math.max(0, Math.round(Number(score) || 0));
  if (!currentUserId) return;
  recordBackendGameScore(currentUserId, gameName, value).catch(() => {
    // a failed save should never interrupt the game
  });
};
