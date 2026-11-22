/**
 * Ludo Champion - Token Capture Logic
 */

import { STEP } from './constants';
import { PLAYER_START_OFFSETS, checkSafeSquare } from './boardConfig';

/**
 * Checks if a token landing on a target step captures any opponent token
 * @param {string} movingPlayerColor 
 * @param {number} targetStep 
 * @param {Array<Object>} allPlayers 
 * @param {number} movingTokenId 
 * @returns {{ captured: boolean, capturedTokens: Array<{ playerId: string, tokenId: number, color: string }> }}
 */
export function checkCapture(movingPlayerColor, targetStep, allPlayers, movingTokenId = null) {
  // Captures only occur on the main track (0 <= step <= 50)
  if (targetStep < STEP.START || targetStep > STEP.MAIN_TRACK_END) {
    return { captured: false, capturedTokens: [] };
  }

  const movingOffset = PLAYER_START_OFFSETS[movingPlayerColor];
  const targetTrackIndex = (movingOffset + targetStep) % 52;

  // Safe cells cannot have captures
  if (checkSafeSquare(targetTrackIndex)) {
    return { captured: false, capturedTokens: [] };
  }

  const capturedTokens = [];

  allPlayers.forEach((player) => {
    // Cannot capture own tokens
    if (player.color === movingPlayerColor) return;

    const opponentOffset = PLAYER_START_OFFSETS[player.color];

    player.tokens.forEach((token) => {
      // Opponent token must be on the main track
      if (token.step >= STEP.START && token.step <= STEP.MAIN_TRACK_END) {
        const opponentTrackIndex = (opponentOffset + token.step) % 52;

        if (opponentTrackIndex === targetTrackIndex) {
          capturedTokens.push({
            playerId: player.id,
            tokenId: token.id,
            color: player.color,
          });
        }
      }
    });
  });

  return {
    captured: capturedTokens.length > 0,
    capturedTokens,
  };
}

/**
 * Applies capture to state: resets captured tokens back to Yard
 * @param {Array<Object>} players 
 * @param {Array<{ playerId: string, tokenId: number }>} capturedTokens 
 * @returns {Array<Object>} New players array with captured tokens reset
 */
export function applyCapture(players, capturedTokens) {
  if (!capturedTokens || capturedTokens.length === 0) return players;

  return players.map((player) => {
    const tokensToReset = capturedTokens
      .filter((c) => c.playerId === player.id)
      .map((c) => c.tokenId);

    if (tokensToReset.length === 0) return player;

    const updatedTokens = player.tokens.map((token) => {
      if (tokensToReset.includes(token.id)) {
        return {
          ...token,
          step: STEP.YARD,
          hasReachedHome: false,
        };
      }
      return token;
    });

    return {
      ...player,
      tokens: updatedTokens,
      stats: {
        ...player.stats,
        capturedCount: player.stats.capturedCount + tokensToReset.length,
        tokensInYard: player.stats.tokensInYard + tokensToReset.length,
      },
    };
  });
}
