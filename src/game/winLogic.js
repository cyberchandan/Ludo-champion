/**
 * Ludo Champion - Winning Logic
 */

import { STEP, RULES } from './constants';

/**
 * Checks if a specific player has reached home with all tokens
 * @param {Object} player 
 * @returns {boolean}
 */
export function checkPlayerFinished(player) {
  if (!player || !player.tokens) return false;
  return (
    player.tokens.length === RULES.TOTAL_TOKENS_PER_PLAYER &&
    player.tokens.every((t) => t.step === STEP.FINAL_HOME)
  );
}

/**
 * Evaluates game status and checks for winners and rankings
 * @param {Array<Object>} players 
 * @param {Array<string>} existingRankings - Array of player IDs in finishing order
 * @returns {{ isGameOver: boolean, winner: Object|null, rankings: Array<string>, newlyFinishedPlayer: Object|null }}
 */
export function checkWinner(players, existingRankings = []) {
  const rankings = [...existingRankings];
  let newlyFinishedPlayer = null;

  players.forEach((player) => {
    if (!rankings.includes(player.id) && checkPlayerFinished(player)) {
      rankings.push(player.id);
      newlyFinishedPlayer = player;
    }
  });

  const activePlayers = players.filter((p) => !rankings.includes(p.id));
  // Game is over when 1 player wins in a 2-player game, or only 1 player remains in 3-4 player games
  const isGameOver = players.length > 1 && (
    (players.length === 2 && rankings.length >= 1) ||
    activePlayers.length <= 1
  );

  const winner = rankings.length > 0 ? players.find((p) => p.id === rankings[0]) : null;

  return {
    isGameOver,
    winner,
    rankings,
    newlyFinishedPlayer,
  };
}
