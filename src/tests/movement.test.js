/**
 * Ludo Champion - Movement Tests
 */

import { calculateNextStep, getValidMoves, generateMovementPath } from '../game/movement';
import { STEP, PLAYER_COLORS, RULES } from '../game/constants';
import { initializePlayers } from '../game/playerConfig';

describe('Movement Logic', () => {
  let player;

  beforeEach(() => {
    const players = initializePlayers(4);
    player = players[0]; // RED player
  });

  // Test 2: Token cannot leave home (yard) without a 6
  test('Token cannot leave yard without rolling a 6', () => {
    // All tokens start in the yard (step = -1)
    expect(player.tokens[0].step).toBe(STEP.YARD);

    // Roll 1 to 5: none should be allowed to leave
    for (let roll = 1; roll <= 5; roll++) {
      const nextStep = calculateNextStep(STEP.YARD, roll);
      expect(nextStep).toBeNull();

      const validMoves = getValidMoves(player, roll);
      expect(validMoves).toEqual([]);
    }
  });

  // Test 3: Token leaves home (yard) after rolling 6
  test('Token leaves yard after rolling a 6', () => {
    const nextStep = calculateNextStep(STEP.YARD, 6);
    expect(nextStep).toBe(STEP.START); // Enters track at step 0

    const validMoves = getValidMoves(player, 6);
    // Since all 4 tokens are in yard, rolling 6 should make all 4 tokens selectable
    expect(validMoves).toHaveLength(RULES.TOTAL_TOKENS_PER_PLAYER);
    expect(validMoves).toContain(0);
    expect(validMoves).toContain(1);
    expect(validMoves).toContain(2);
    expect(validMoves).toContain(3);
  });

  // Test 4: Token moves the correct number of steps
  test('Token moves the correct number of steps on the track', () => {
    player.tokens[0].step = 10;
    const diceValue = 4;
    const nextStep = calculateNextStep(player.tokens[0].step, diceValue);
    expect(nextStep).toBe(14);

    player.tokens[1].step = 45;
    expect(calculateNextStep(player.tokens[1].step, 3)).toBe(48);

    // Moving into home lane
    player.tokens[2].step = 50;
    expect(calculateNextStep(player.tokens[2].step, 2)).toBe(52); // in home lane
  });

  // Test 5: Token cannot move beyond the final home position
  test('Token cannot move beyond the final home position (exact roll required)', () => {
    // Token is at step 54 (needs roll of 2 to reach 56)
    player.tokens[0].step = 54;

    // Roll of 1: valid (54 + 1 = 55)
    expect(calculateNextStep(54, 1)).toBe(55);

    // Roll of 2: valid (54 + 2 = 56, reaches home)
    expect(calculateNextStep(54, 2)).toBe(STEP.FINAL_HOME);

    // Rolls > 2 (e.g. 3, 4, 5, 6) overshoot 56 and must be rejected
    expect(calculateNextStep(54, 3)).toBeNull();
    expect(calculateNextStep(54, 4)).toBeNull();
    expect(calculateNextStep(54, 5)).toBeNull();
    expect(calculateNextStep(54, 6)).toBeNull();

    // Verify getValidMoves excludes overshooting token
    player.tokens[1].step = STEP.YARD;
    player.tokens[2].step = STEP.YARD;
    player.tokens[3].step = STEP.YARD;

    const validMovesWithOvershoot = getValidMoves(player, 4);
    expect(validMovesWithOvershoot).not.toContain(0);
  });

  test('generateMovementPath generates sequential step coordinates', () => {
    const path = generateMovementPath(PLAYER_COLORS.RED, 10, 13, 0);
    expect(path).toHaveLength(3);
    expect(path[0].step).toBe(11);
    expect(path[1].step).toBe(12);
    expect(path[2].step).toBe(13);
  });
});
