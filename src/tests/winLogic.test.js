/**
 * Ludo Champion - Win Logic Tests
 */

import { checkPlayerFinished, checkWinner } from '../game/winLogic';
import { STEP, PLAYER_COLORS } from '../game/constants';
import { initializePlayers } from '../game/playerConfig';

describe('Win Logic', () => {
  let players;

  beforeEach(() => {
    players = initializePlayers(4);
  });

  // Test 11: Player wins only after all four tokens reach home
  test('Player does not win if only 1, 2, or 3 tokens reach home', () => {
    const redPlayer = players[0];

    // 0 tokens home
    expect(checkPlayerFinished(redPlayer)).toBe(false);

    // 1 token home
    redPlayer.tokens[0].step = STEP.FINAL_HOME;
    expect(checkPlayerFinished(redPlayer)).toBe(false);

    // 2 tokens home
    redPlayer.tokens[1].step = STEP.FINAL_HOME;
    expect(checkPlayerFinished(redPlayer)).toBe(false);

    // 3 tokens home
    redPlayer.tokens[2].step = STEP.FINAL_HOME;
    expect(checkPlayerFinished(redPlayer)).toBe(false);

    // 4th token reaches home -> Player finishes!
    redPlayer.tokens[3].step = STEP.FINAL_HOME;
    expect(checkPlayerFinished(redPlayer)).toBe(true);
  });

  test('checkWinner declares game over when appropriate and assigns ranks', () => {
    const redPlayer = players[0];
    const greenPlayer = players[1];

    // Give Red all 4 tokens home
    redPlayer.tokens.forEach((t) => {
      t.step = STEP.FINAL_HOME;
    });

    // In a 4 player game, 1st winner is recorded
    const result1 = checkWinner(players, []);
    expect(result1.rankings).toContain(redPlayer.id);
    expect(result1.winner.id).toBe(redPlayer.id);
    expect(result1.newlyFinishedPlayer.id).toBe(redPlayer.id);

    // Give Green all 4 tokens home
    greenPlayer.tokens.forEach((t) => {
      t.step = STEP.FINAL_HOME;
    });

    const result2 = checkWinner(players, result1.rankings);
    expect(result2.rankings).toEqual([redPlayer.id, greenPlayer.id]);
  });

  test('Two-player game ends immediately when one player brings all tokens home', () => {
    const twoPlayers = initializePlayers(2);
    const redPlayer = twoPlayers[0];

    redPlayer.tokens.forEach((t) => {
      t.step = STEP.FINAL_HOME;
    });

    const result = checkWinner(twoPlayers, []);
    expect(result.isGameOver).toBe(true);
    expect(result.winner.id).toBe(redPlayer.id);
  });
});
