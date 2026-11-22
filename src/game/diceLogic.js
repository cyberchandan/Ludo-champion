/**
 * Ludo Champion - Dice Logic
 */

import { RULES } from './constants';

/**
 * Rolls a dice returning an integer between 1 and 6
 * @param {Function} [randomFn=Math.random] - Optional random number generator for testing
 * @returns {number} Integer between 1 and 6
 */
export function rollDice(randomFn = Math.random) {
  return Math.floor(randomFn() * (RULES.DICE_MAX - RULES.DICE_MIN + 1)) + RULES.DICE_MIN;
}

/**
 * Evaluates consecutive sixes count
 * @param {number} currentCount 
 * @param {number} rollValue 
 * @param {number} [maxCount=RULES.MAX_CONSECUTIVE_SIXES]
 * @returns {{ count: number, isExceeded: boolean }}
 */
export function evaluateConsecutiveSixes(currentCount, rollValue, maxCount = RULES.MAX_CONSECUTIVE_SIXES) {
  if (rollValue === 6) {
    const nextCount = currentCount + 1;
    return {
      count: nextCount,
      isExceeded: nextCount >= maxCount,
    };
  }
  return {
    count: 0,
    isExceeded: false,
  };
}
