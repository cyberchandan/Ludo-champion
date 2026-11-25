/**
 * Authoritative Server-Side Ludo Game Engine
 * Ensures 100% fair and tamper-proof dice rolls and token moves.
 */

const PLAYER_COLORS = {
  RED: 'RED',
  GREEN: 'GREEN',
  YELLOW: 'YELLOW',
  BLUE: 'BLUE',
};

const COLOR_ORDER = [
  PLAYER_COLORS.RED,
  PLAYER_COLORS.GREEN,
  PLAYER_COLORS.YELLOW,
  PLAYER_COLORS.BLUE,
];

const COLOR_THEMES = {
  RED: { primary: '#E53935', name: 'Red', contrastText: '#FFFFFF' },
  GREEN: { primary: '#2E7D32', name: 'Green', contrastText: '#FFFFFF' },
  YELLOW: { primary: '#FBC02D', name: 'Yellow', contrastText: '#1A1A2E' },
  BLUE: { primary: '#1976D2', name: 'Blue', contrastText: '#FFFFFF' },
};

const STEP = {
  YARD: -1,
  START: 0,
  MAIN_TRACK_END: 50,
  HOME_LANE_START: 51,
  HOME_LANE_END: 55,
  FINAL_HOME: 56,
};

const GAME_STATUS = {
  WAITING_ROLL: 'WAITING_ROLL',
  ROLLING: 'ROLLING',
  WAITING_TOKEN_SELECT: 'WAITING_TOKEN_SELECT',
  MOVING: 'MOVING',
  GAME_OVER: 'GAME_OVER',
};

const RULES = {
  DICE_MIN: 1,
  DICE_MAX: 6,
  ROLL_TO_EXIT_YARD: 6,
  MAX_CONSECUTIVE_SIXES: 3,
  TOTAL_TOKENS_PER_PLAYER: 4,
};

const PLAYER_START_OFFSETS = {
  [PLAYER_COLORS.RED]: 0,
  [PLAYER_COLORS.GREEN]: 13,
  [PLAYER_COLORS.YELLOW]: 26,
  [PLAYER_COLORS.BLUE]: 39,
};

const SAFE_TRACK_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

function checkSafeSquare(trackIndex) {
  if (trackIndex === null || trackIndex === undefined) return true;
  return SAFE_TRACK_INDICES.includes(trackIndex);
}

function createPlayerTokens(color) {
  const tokens = [];
  for (let i = 0; i < RULES.TOTAL_TOKENS_PER_PLAYER; i++) {
    tokens.push({
      id: i,
      color,
      step: STEP.YARD,
      hasReachedHome: false,
    });
  }
  return tokens;
}

function calculateNextStep(currentStep, diceValue) {
  if (currentStep === STEP.YARD) {
    if (diceValue === RULES.ROLL_TO_EXIT_YARD) {
      return STEP.START;
    }
    return null;
  }
  if (currentStep === STEP.FINAL_HOME) {
    return null;
  }
  const targetStep = currentStep + diceValue;
  if (targetStep > STEP.FINAL_HOME) {
    return null;
  }
  return targetStep;
}

function getValidMoves(player, diceValue) {
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

function checkCapture(movingPlayerColor, targetStep, allPlayers) {
  if (targetStep < STEP.START || targetStep > STEP.MAIN_TRACK_END) {
    return { captured: false, capturedTokens: [] };
  }
  const movingOffset = PLAYER_START_OFFSETS[movingPlayerColor];
  const targetTrackIndex = (movingOffset + targetStep) % 52;
  if (checkSafeSquare(targetTrackIndex)) {
    return { captured: false, capturedTokens: [] };
  }
  const capturedTokens = [];
  allPlayers.forEach((player) => {
    if (player.color === movingPlayerColor) return;
    const opponentOffset = PLAYER_START_OFFSETS[player.color];
    player.tokens.forEach((token) => {
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

function applyCapture(players, capturedTokens) {
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

function checkPlayerFinished(player) {
  if (!player || !player.tokens) return false;
  return (
    player.tokens.length === RULES.TOTAL_TOKENS_PER_PLAYER &&
    player.tokens.every((t) => t.step === STEP.FINAL_HOME)
  );
}

function checkWinner(players, existingRankings = []) {
  const rankings = [...existingRankings];
  let newlyFinishedPlayer = null;
  players.forEach((player) => {
    if (!rankings.includes(player.id) && checkPlayerFinished(player)) {
      rankings.push(player.id);
      newlyFinishedPlayer = player;
    }
  });
  const activePlayers = players.filter((p) => !rankings.includes(p.id));
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

function getNextPlayerIndex(currentIndex, players, rankings = []) {
  if (!players || players.length === 0) return 0;
  const total = players.length;
  let nextIndex = (currentIndex + 1) % total;
  let attempts = 0;
  while (attempts < total) {
    const candidatePlayer = players[nextIndex];
    if (candidatePlayer && !candidatePlayer.hasFinished && !rankings.includes(candidatePlayer.id)) {
      return nextIndex;
    }
    nextIndex = (nextIndex + 1) % total;
    attempts++;
  }
  return currentIndex;
}

function shouldGrantExtraTurn({ diceValue, hasCaptured = false, hasReachedHome = false, threeSixesExceeded = false }) {
  if (threeSixesExceeded) return false;
  return diceValue === 6 || hasCaptured || hasReachedHome;
}

/**
 * Initializes authoritative multiplayer state for room players
 */
function initializeMultiplayerGame(roomPlayers) {
  const players = roomPlayers.map((rp, index) => {
    return {
      id: rp.id,
      color: rp.color,
      name: rp.name,
      theme: COLOR_THEMES[rp.color],
      tokens: createPlayerTokens(rp.color),
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
      enableThreeSixesRule: true,
      maxConsecutiveSixes: RULES.MAX_CONSECUTIVE_SIXES,
      playerCount: players.length,
    },
  };
}

/**
 * Server-authoritative dice roll
 */
function handleServerDiceRoll(state, randomFn = Math.random) {
  if (state.status !== GAME_STATUS.WAITING_ROLL || state.isGameOver) {
    return { state, error: 'Cannot roll dice in current state' };
  }

  const diceValue = Math.floor(randomFn() * 6) + 1;
  const currentPlayer = state.players[state.currentPlayerIndex];
  const newConsecutive = diceValue === 6 ? (state.consecutiveSixes || 0) + 1 : 0;

  // 3 Consecutive Sixes Rule
  if (state.settings.enableThreeSixesRule && newConsecutive >= state.settings.maxConsecutiveSixes) {
    const nextPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.players, state.rankings);
    return {
      state: {
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
      },
      error: null,
    };
  }

  const validMoves = getValidMoves(currentPlayer, diceValue);

  // If no legal moves, switch turn immediately
  if (validMoves.length === 0) {
    const nextPlayerIndex = getNextPlayerIndex(state.currentPlayerIndex, state.players, state.rankings);
    return {
      state: {
        ...state,
        diceValue,
        consecutiveSixes: newConsecutive,
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
      },
      error: null,
    };
  }

  // Legal moves available -> wait for player to pick a token
  return {
    state: {
      ...state,
      diceValue,
      consecutiveSixes: newConsecutive,
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
    },
    error: null,
  };
}

/**
 * Server-authoritative token move execution
 */
function handleServerTokenMove(state, tokenId) {
  if (state.status !== GAME_STATUS.WAITING_TOKEN_SELECT || state.isGameOver) {
    return { state, error: 'Cannot move token in current state' };
  }

  if (!state.validMoves.includes(tokenId)) {
    return { state, error: `Invalid token selection: token ${tokenId} cannot move` };
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  const movingToken = currentPlayer.tokens.find((t) => t.id === tokenId);
  if (!movingToken) {
    return { state, error: 'Token not found' };
  }

  const prevStep = movingToken.step;
  const nextStep = calculateNextStep(prevStep, state.diceValue);
  if (nextStep === null) {
    return { state, error: 'Illegal move destination' };
  }

  const hasReachedHome = nextStep === STEP.FINAL_HOME;
  const isLeavingYard = prevStep === STEP.YARD && nextStep === STEP.START;

  // Check captures
  const captureResult = checkCapture(currentPlayer.color, nextStep, state.players);

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

  if (captureResult.captured) {
    updatedPlayers = applyCapture(updatedPlayers, captureResult.capturedTokens);
  }

  const winResult = checkWinner(updatedPlayers, state.rankings);

  if (winResult.isGameOver) {
    return {
      state: {
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
      },
      error: null,
    };
  }

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
    state: {
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
    },
    error: null,
  };
}

module.exports = {
  PLAYER_COLORS,
  COLOR_ORDER,
  COLOR_THEMES,
  STEP,
  GAME_STATUS,
  RULES,
  initializeMultiplayerGame,
  handleServerDiceRoll,
  handleServerTokenMove,
  calculateNextStep,
  checkCapture,
  checkWinner,
};
