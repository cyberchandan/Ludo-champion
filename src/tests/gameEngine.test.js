/**
 * Ludo Champion - Game Engine Core Tests
 * Validates all required gameplay rules and mechanics
 */

import {
  initializeGame,
  handleDiceRoll,
  handleTokenMove,
  switchTurn,
  resetGame,
  rollDice,
  checkSafeSquare,
  checkCapture,
} from '../game/gameEngine';
import { STEP, GAME_STATUS, PLAYER_COLORS } from '../game/constants';
import { SAFE_TRACK_INDICES, PLAYER_START_OFFSETS } from '../game/boardConfig';

describe('Ludo Champion Game Engine', () => {
  // Test 1: Dice returns values between 1 and 6
  test('Dice returns integer values between 1 and 6', () => {
    for (let i = 0; i < 200; i++) {
      const roll = rollDice();
      expect(Number.isInteger(roll)).toBe(true);
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(6);
    }
  });

  // Test 2 & 3: Token leaving home yard via engine
  test('Token cannot leave yard on rolls 1-5, but leaves on roll 6', () => {
    let state = initializeGame(4);

    // Roll 4 with all tokens in yard
    state = handleDiceRoll(state, () => 0.5); // (0.5 * 6) + 1 = 4
    expect(state.diceValue).toBe(4);
    // Since no valid moves, turn automatically switches to next player
    expect(state.status).toBe(GAME_STATUS.WAITING_ROLL);
    expect(state.currentPlayerIndex).toBe(1);

    // Reset to player 0
    state.currentPlayerIndex = 0;
    // Roll 6 for player 0
    state = handleDiceRoll(state, () => 0.999); // 6
    expect(state.diceValue).toBe(6);
    expect(state.status).toBe(GAME_STATUS.WAITING_TOKEN_SELECT);
    expect(state.validMoves).toEqual([0, 1, 2, 3]);

    // Move token 0 out of yard
    state = handleTokenMove(state, 0);
    const redPlayer = state.players[0];
    expect(redPlayer.tokens[0].step).toBe(STEP.START); // Step 0
  });

  // Test 4: Token moves the correct number of steps
  test('Token moves the correct number of steps', () => {
    let state = initializeGame(4);
    state.players[0].tokens[0].step = STEP.START; // Step 0

    // Roll 3
    state = handleDiceRoll(state, () => 0.4); // 3
    expect(state.diceValue).toBe(3);
    state = handleTokenMove(state, 0);

    expect(state.players[0].tokens[0].step).toBe(3);
  });

  // Test 5: Token cannot move beyond final home position
  test('Token cannot move beyond the final home position', () => {
    let state = initializeGame(4);
    state.players[0].tokens[0].step = 54; // needs exact roll 2 to reach 56

    // Roll 4: 54 + 4 = 58 > 56 (overshoot)
    state = handleDiceRoll(state, () => 0.55); // 4
    expect(state.validMoves).not.toContain(0);
  });

  // Test 6: Safe cells prevent capture
  test('Safe cells prevent capture', () => {
    const state = initializeGame(4);
    const redPlayer = state.players[0];
    const greenPlayer = state.players[1];

    // Safe track indices: [0, 8, 13, 21, 26, 34, 39, 47]
    SAFE_TRACK_INDICES.forEach((trackIdx) => {
      expect(checkSafeSquare(trackIdx)).toBe(true);
    });

    // Place Green token on safe star cell index 8
    // Green offset is 13.
    // For Green to be on track index 8: (13 + step) % 52 = 8 => step = 47
    greenPlayer.tokens[0].step = 47;

    // Red moves to track index 8: (0 + step) % 52 = 8 => Red step = 8
    const captureAtSafe = checkCapture(redPlayer.color, 8, state.players, 0);
    expect(captureAtSafe.captured).toBe(false);
    expect(captureAtSafe.capturedTokens).toEqual([]);
  });

  // Test 7: Opponent token is captured on a vulnerable square
  test('Opponent token is captured on a vulnerable square and sent back to yard', () => {
    let state = initializeGame(4);
    const redPlayer = state.players[0];
    const greenPlayer = state.players[1];

    // Pick vulnerable track index 5 (which is not in SAFE_TRACK_INDICES)
    expect(checkSafeSquare(5)).toBe(false);

    // Green starts at 13. To be at track index 5: (13 + step) % 52 = 5 => step = 44
    greenPlayer.tokens[0].step = 44;

    // Red starts at 0. Step 5 lands on track index 5
    redPlayer.tokens[0].step = 2;

    // Red rolls 3 to land on step 5
    state.currentPlayerIndex = 0;
    state = handleDiceRoll(state, () => 0.4); // 3
    state = handleTokenMove(state, 0);

    // Red token moves to 5
    expect(state.players[0].tokens[0].step).toBe(5);

    // Green token 0 was captured and must be back in the yard (step -1)
    expect(state.players[1].tokens[0].step).toBe(STEP.YARD);
    expect(state.lastEvent.type).toBe('TOKEN_CAPTURED');
    expect(state.lastEvent.captured).toBe(true);
  });

  // Test 8: Player gets another turn after rolling 6
  test('Player gets another turn after rolling 6', () => {
    let state = initializeGame(4);
    state.players[0].tokens[0].step = 10;

    // Roll 6
    state = handleDiceRoll(state, () => 0.999); // 6
    expect(state.diceValue).toBe(6);

    // Move token 0
    state = handleTokenMove(state, 0);

    // Current player index should STILL be 0 (same player keeps turn)
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.status).toBe(GAME_STATUS.WAITING_ROLL);
  });

  // Test 9: Turn switches correctly when no bonus is earned
  test('Turn switches correctly to the next player after non-6 move without capture', () => {
    let state = initializeGame(4);
    state.players[0].tokens[0].step = 10;

    // Roll 3
    state = handleDiceRoll(state, () => 0.4); // 3
    expect(state.currentPlayerIndex).toBe(0);

    // Move token
    state = handleTokenMove(state, 0);

    // Player 0 finished move, next player is 1
    expect(state.currentPlayerIndex).toBe(1);
    expect(state.status).toBe(GAME_STATUS.WAITING_ROLL);
  });

  // Test 10: Three consecutive sixes follow the configured rule (turn forfeited)
  test('Three consecutive sixes forfeits turn to the next player', () => {
    let state = initializeGame(4, { enableThreeSixesRule: true, maxConsecutiveSixes: 3 });
    state.players[0].tokens[0].step = 10;

    // First 6
    state = handleDiceRoll(state, () => 0.999);
    expect(state.consecutiveSixes).toBe(1);
    state = handleTokenMove(state, 0);
    expect(state.currentPlayerIndex).toBe(0);

    // Second 6
    state = handleDiceRoll(state, () => 0.999);
    expect(state.consecutiveSixes).toBe(2);
    state = handleTokenMove(state, 0);
    expect(state.currentPlayerIndex).toBe(0);

    // Third 6: Should forfeit turn immediately!
    state = handleDiceRoll(state, () => 0.999);
    expect(state.consecutiveSixes).toBe(0); // reset
    expect(state.currentPlayerIndex).toBe(1); // switched to Player 1
    expect(state.status).toBe(GAME_STATUS.WAITING_ROLL);
    expect(state.lastEvent.type).toBe('THREE_SIXES_FORFEIT');
  });

  // Test 11: Player wins only after all four tokens reach home
  test('Player wins only when all 4 tokens reach final home', () => {
    let state = initializeGame(2);
    const redPlayer = state.players[0];

    // Set 3 tokens home
    redPlayer.tokens[0].step = STEP.FINAL_HOME;
    redPlayer.tokens[1].step = STEP.FINAL_HOME;
    redPlayer.tokens[2].step = STEP.FINAL_HOME;
    redPlayer.tokens[3].step = 55; // 1 step away from home

    expect(state.isGameOver).toBe(false);

    // Roll 1 to move last token home
    state.currentPlayerIndex = 0;
    state = handleDiceRoll(state, () => 0.05); // 1
    state = handleTokenMove(state, 3);

    expect(state.players[0].tokens[3].step).toBe(STEP.FINAL_HOME);
    expect(state.isGameOver).toBe(true);
    expect(state.winner.id).toBe(redPlayer.id);
    expect(state.status).toBe(GAME_STATUS.GAME_OVER);
  });

  // Test 12: Game resets correctly
  test('Game resets correctly to initial state', () => {
    let state = initializeGame(4);
    state.players[0].tokens[0].step = 30;
    state.currentPlayerIndex = 2;
    state.isGameOver = true;

    // Reset game
    const resetState = resetGame(4);

    expect(resetState.currentPlayerIndex).toBe(0);
    expect(resetState.isGameOver).toBe(false);
    expect(resetState.status).toBe(GAME_STATUS.WAITING_ROLL);
    expect(resetState.diceValue).toBeNull();
    expect(resetState.players[0].tokens.every((t) => t.step === STEP.YARD)).toBe(true);
  });
});
