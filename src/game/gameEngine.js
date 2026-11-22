/**
 * Ludo Champion - Game Engine Core
 * Handles deterministic state transitions, rule evaluations, and gameplay actions.
 */

import { GAME_STATUS, STEP, RULES } from './constants';
import { initializePlayers } from './playerConfig';
import { rollDice as rollDiceGenerator, evaluateConsecutiveSixes } from './diceLogic';
import { calculateNextStep, getValidMoves, generateMovementPath } from './movement';
import { checkCapture, applyCapture } from './captureLogic';
import { checkWinner } from './winLogic';
import { getNextPlayerIndex, shouldGrantExtraTurn } from './turnManager';
import { calculateTokenPosition, checkSafeSquare } from './boardConfig';

/**
 * Initializes a new game state
 * @param {number} [playerCount=4] 
 * @param {Object} [customOptions={}] 
 * @returns {Object} Complete initial game state
 */
export function initializeGame(playerCount = 4, customOptions = {}) {
  const players = initializePlayers(playerCount, customOptions);

  return {
    players,
    currentPlayerIndex: 0,
    diceValue: null,
    consecutiveSixes: 0,
    status: GAME_STATUS.WAITING_ROLL,
    validMoves: [],
    selectedTokenId: null,
    rankings: [],
    winner: null,
    isGameOver: false,
    lastEvent: {
      type: 'INITIALIZED',
      message: 'Game started. Roll dice to play!',
    },
    settings: {
      enableThreeSixesRule: customOptions.enableThreeSixesRule !== false,
      maxConsecutiveSixes: customOptions.maxConsecutiveSixes || RULES.MAX_CONSECUTIVE_SIXES,
      playerCount,
    },
  };
}

/**
 * Executes a dice roll for the current player
 * @param {Object} state - Current game state
 * @param {Function} [randomFn=Math.random] - Optional random function for deterministic testing
 * @returns {Object} New game state
 */
export function handleDiceRoll(state, randomFn = Math.random) {
  if (state.status !== GAME_STATUS.WAITING_ROLL || state.isGameOver) {
    return state;
  }

  const diceValue = rollDiceGenerator(randomFn);
  const currentPlayer = state.players[state.currentPlayerIndex];

  // Evaluate consecutive sixes
  const sixesEval = evaluateConsecutiveSixes(
    state.consecutiveSixes,
    diceValue,
    state.settings.maxConsecutiveSixes
  );

  // If 3 consecutive sixes and rule is enabled, forfeit turn immediately
  if (state.settings.enableThreeSixesRule && sixesEval.isExceeded) {
    const nextPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.players, state.rankings);

    return {
      ...state,
      diceValue,
      consecutiveSixes: 0,
      status: GAME_STATUS.WAITING_ROLL,
      currentPlayerIndex: nextPlayerIndex,
      validMoves: [],
      selectedTokenId: null,
      lastEvent: {
        type: 'THREE_SIXES_FORFEIT',
        player: currentPlayer,
        message: `${currentPlayer.name} rolled 3 consecutive sixes! Turn forfeited.`,
      },
    };
  }

  // Calculate legal moves for this player
  const validMoves = getValidMoves(currentPlayer, diceValue);

  // If no legal moves, switch turn to next player
  if (validMoves.length === 0) {
    const nextPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.players, state.rankings);

    return {
      ...state,
      diceValue,
      consecutiveSixes: diceValue === 6 ? sixesEval.count : 0,
      validMoves: [],
      selectedTokenId: null,
      currentPlayerIndex: nextPlayerIndex,
      status: GAME_STATUS.WAITING_ROLL,
      lastEvent: {
        type: 'NO_VALID_MOVES',
        player: currentPlayer,
        diceValue,
        message: `${currentPlayer.name} rolled a ${diceValue} but has no valid moves.`,
      },
    };
  }

  // Awaiting token selection
  return {
    ...state,
    diceValue,
    consecutiveSixes: diceValue === 6 ? sixesEval.count : 0,
    validMoves,
    selectedTokenId: null,
    status: GAME_STATUS.WAITING_TOKEN_SELECT,
    lastEvent: {
      type: 'WAITING_MOVE',
      player: currentPlayer,
      diceValue,
      validMoves,
      message: `${currentPlayer.name} rolled a ${diceValue}. Select a token to move.`,
    },
  };
}

/**
 * Moves a selected token for the current player
 * @param {Object} state - Current game state
 * @param {number} tokenId - ID of the token to move (0-3)
 * @returns {Object} New game state
 */
export function handleTokenMove(state, tokenId) {
  if (state.status !== GAME_STATUS.WAITING_TOKEN_SELECT || state.isGameOver) {
    return state;
  }

  if (!state.validMoves.includes(tokenId)) {
    return state; // Invalid token selection
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  const movingToken = currentPlayer.tokens.find((t) => t.id === tokenId);
  if (!movingToken) return state;

  const prevStep = movingToken.step;
  const nextStep = calculateNextStep(prevStep, state.diceValue);
  if (nextStep === null) return state;

  const hasReachedHome = nextStep === STEP.FINAL_HOME;
  const isLeavingYard = prevStep === STEP.YARD && nextStep === STEP.START;

  // Check captures
  const captureResult = checkCapture(currentPlayer.color, nextStep, state.players, tokenId);

  // Update moving player's tokens
  let updatedPlayers = state.players.map((player) => {
    if (player.id !== currentPlayer.id) return player;

    const updatedTokens = player.tokens.map((token) => {
      if (token.id === tokenId) {
        return {
          ...token,
          step: nextStep,
          hasReachedHome,
        };
      }
      return token;
    });

    const tokensHome = updatedTokens.filter((t) => t.step === STEP.FINAL_HOME).length;
    const tokensInYard = updatedTokens.filter((t) => t.step === STEP.YARD).length;

    return {
      ...player,
      tokens: updatedTokens,
      stats: {
        ...player.stats,
        tokensHome,
        tokensInYard,
        capturesMade: player.stats.capturesMade + (captureResult.captured ? captureResult.capturedTokens.length : 0),
      },
    };
  });

  // Apply captures to opponent tokens if any
  if (captureResult.captured) {
    updatedPlayers = applyCapture(updatedPlayers, captureResult.capturedTokens);
  }

  // Check winners
  const winResult = checkWinner(updatedPlayers, state.rankings);

  if (winResult.isGameOver) {
    return {
      ...state,
      players: updatedPlayers,
      status: GAME_STATUS.GAME_OVER,
      isGameOver: true,
      winner: winResult.winner,
      rankings: winResult.rankings,
      validMoves: [],
      selectedTokenId: tokenId,
      lastEvent: {
        type: 'GAME_OVER',
        winner: winResult.winner,
        rankings: winResult.rankings,
        message: `Game over! ${winResult.winner?.name} has won the match!`,
      },
    };
  }

  // Check if player earned an extra turn (rolled 6, captured opponent, or reached home)
  const getsExtraTurn = shouldGrantExtraTurn({
    diceValue: state.diceValue,
    hasCaptured: captureResult.captured,
    hasReachedHome,
    threeSixesExceeded: false,
  });

  let nextPlayerIndex = state.currentPlayerIndex;
  let eventType = 'MOVE_COMPLETED';
  let message = `${currentPlayer.name} moved token ${tokenId + 1}.`;

  if (captureResult.captured) {
    message = `${currentPlayer.name} captured an opponent's token! Extra turn earned!`;
    eventType = 'TOKEN_CAPTURED';
  } else if (hasReachedHome) {
    message = `${currentPlayer.name}'s token reached home! Extra turn earned!`;
    eventType = 'TOKEN_REACHED_HOME';
  } else if (isLeavingYard) {
    message = `${currentPlayer.name} brought a token onto the board! Extra turn earned!`;
    eventType = 'TOKEN_LEFT_YARD';
  } else if (getsExtraTurn) {
    message = `${currentPlayer.name} rolled a 6 and gets another turn!`;
    eventType = 'EXTRA_TURN';
  }

  if (!getsExtraTurn) {
    nextPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, updatedPlayers, winResult.rankings);
    message += ` Next is ${updatedPlayers[nextPlayerIndex].name}'s turn.`;
  }

  return {
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: nextPlayerIndex,
    rankings: winResult.rankings,
    diceValue: null,
    validMoves: [],
    selectedTokenId: null,
    status: GAME_STATUS.WAITING_ROLL,
    lastEvent: {
      type: eventType,
      player: currentPlayer,
      tokenId,
      fromStep: prevStep,
      toStep: nextStep,
      captured: captureResult.captured,
      capturedTokens: captureResult.capturedTokens,
      hasReachedHome,
      getsExtraTurn,
      message,
    },
  };
}

/**
 * Manually switch turn to the next player
 * @param {Object} state 
 * @returns {Object}
 */
export function switchTurn(state) {
  const nextPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.players, state.rankings);
  return {
    ...state,
    currentPlayerIndex: nextPlayerIndex,
    diceValue: null,
    consecutiveSixes: 0,
    validMoves: [],
    selectedTokenId: null,
    status: GAME_STATUS.WAITING_ROLL,
    lastEvent: {
      type: 'TURN_SWITCHED',
      player: state.players[nextPlayerIndex],
      message: `Turn switched to ${state.players[nextPlayerIndex].name}.`,
    },
  };
}

/**
 * Resets the game to initial state
 * @param {number} playerCount 
 * @param {Object} customOptions 
 * @returns {Object}
 */
export function resetGame(playerCount = 4, customOptions = {}) {
  return initializeGame(playerCount, customOptions);
}

// Export all unified engine interfaces
export {
  rollDiceGenerator as rollDice,
  getValidMoves,
  calculateTokenPosition,
  checkSafeSquare,
  checkCapture,
  checkWinner,
  calculateNextStep,
  generateMovementPath,
};
