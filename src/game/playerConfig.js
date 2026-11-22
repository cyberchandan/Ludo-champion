/**
 * Ludo Champion - Player Configuration & Token Setup
 */

import { PLAYER_COLORS, COLOR_THEMES, STEP, RULES } from './constants';

export const DEFAULT_PLAYER_NAMES = {
  [PLAYER_COLORS.RED]: 'Player 1',
  [PLAYER_COLORS.GREEN]: 'Player 2',
  [PLAYER_COLORS.YELLOW]: 'Player 3',
  [PLAYER_COLORS.BLUE]: 'Player 4',
};

/**
 * Standard colors based on player count
 * 2 players: RED and YELLOW (classic opposite boards)
 * 3 players: RED, GREEN, YELLOW
 * 4 players: RED, GREEN, YELLOW, BLUE
 */
export const DEFAULT_PLAYER_SELECTION = {
  2: [PLAYER_COLORS.RED, PLAYER_COLORS.YELLOW],
  3: [PLAYER_COLORS.RED, PLAYER_COLORS.GREEN, PLAYER_COLORS.YELLOW],
  4: [PLAYER_COLORS.RED, PLAYER_COLORS.GREEN, PLAYER_COLORS.YELLOW, PLAYER_COLORS.BLUE],
};

/**
 * Creates the initial token array for a player
 * @param {string} playerColor 
 * @returns {Array<{ id: number, color: string, step: number, hasReachedHome: boolean }>}
 */
export function createPlayerTokens(playerColor) {
  const tokens = [];
  for (let i = 0; i < RULES.TOTAL_TOKENS_PER_PLAYER; i++) {
    tokens.push({
      id: i,
      color: playerColor,
      step: STEP.YARD,
      hasReachedHome: false,
    });
  }
  return tokens;
}

/**
 * Creates players configuration for the game
 * @param {number} playerCount - 2, 3, or 4
 * @param {Object} customOptions - custom names, colors, etc.
 * @returns {Array<Object>}
 */
export function initializePlayers(playerCount = 4, customOptions = {}) {
  const selectedColors = customOptions.colors || DEFAULT_PLAYER_SELECTION[playerCount] || DEFAULT_PLAYER_SELECTION[4];
  const customNames = customOptions.names || {};

  return selectedColors.map((color, index) => {
    const theme = COLOR_THEMES[color];
    const name = customNames[color] || customNames[index] || DEFAULT_PLAYER_NAMES[color] || `Player ${index + 1}`;

    return {
      id: color,
      color,
      name,
      theme,
      tokens: createPlayerTokens(color),
      hasFinished: false,
      rank: null,
      consecutiveSixes: 0,
      stats: {
        tokensHome: 0,
        tokensInYard: 4,
        capturedCount: 0,
        capturesMade: 0,
      },
    };
  });
}
