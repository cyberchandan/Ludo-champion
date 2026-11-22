/**
 * Ludo Champion - Movement Engine
 */

import { STEP, RULES } from './constants';
import { calculateTokenPosition } from './boardConfig';

/**
 * Calculates the next step for a token given current step and dice roll
 * @param {number} currentStep 
 * @param {number} diceValue 
 * @returns {number|null} Next step or null if move is invalid
 */
export function calculateNextStep(currentStep, diceValue) {
  if (currentStep === STEP.YARD) {
    if (diceValue === RULES.ROLL_TO_EXIT_YARD) {
      return STEP.START;
    }
    return null;
  }

  if (currentStep === STEP.FINAL_HOME) {
    return null; // Already finished
  }

  const targetStep = currentStep + diceValue;
  if (targetStep > STEP.FINAL_HOME) {
    return null; // Cannot overshoot final home
  }

  return targetStep;
}

/**
 * Returns list of token IDs that have valid moves for the given dice roll
 * @param {Object} player 
 * @param {number} diceValue 
 * @returns {Array<number>} Array of token IDs (0, 1, 2, 3)
 */
export function getValidMoves(player, diceValue) {
  if (!player || !player.tokens || !diceValue) return [];

  const validTokenIds = [];

  player.tokens.forEach((token) => {
    const nextStep = calculateNextStep(token.step, diceValue);
    if (nextStep !== null) {
      validTokenIds.push(token.id);
    }
  });

  return validTokenIds;
}

/**
 * Generates an array of board coordinate steps for smooth hop-by-hop animation
 * @param {string} playerColor 
 * @param {number} fromStep 
 * @param {number} toStep 
 * @param {number} tokenIndex 
 * @returns {Array<{ step: number, row: number, col: number }>}
 */
export function generateMovementPath(playerColor, fromStep, toStep, tokenIndex = 0) {
  const path = [];

  if (fromStep === STEP.YARD && toStep === STEP.START) {
    const startPos = calculateTokenPosition(playerColor, STEP.START, tokenIndex);
    path.push({
      step: STEP.START,
      row: startPos.row,
      col: startPos.col,
    });
    return path;
  }

  for (let s = fromStep + 1; s <= toStep; s++) {
    const pos = calculateTokenPosition(playerColor, s, tokenIndex);
    path.push({
      step: s,
      row: pos.row,
      col: pos.col,
    });
  }

  return path;
}
