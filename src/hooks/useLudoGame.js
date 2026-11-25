/**
 * Ludo Champion - Custom Hook for Game Loop & UI State Management
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  initializeGame,
  handleDiceRoll,
  handleTokenMove,
  switchTurn as engineSwitchTurn,
  generateMovementPath,
} from '../game/gameEngine';
import { calculateTokenPosition } from '../game/boardConfig';
import { GAME_STATUS, STEP } from '../game/constants';
import { soundManager } from '../utils/soundManager';
import { recordGameResult } from '../utils/storage';

export function useLudoGame(initialPlayerCount = 4, customOptions = {}) {
  const [gameState, setGameState] = useState(() => initializeGame(initialPlayerCount, customOptions));
  const [isRolling, setIsRolling] = useState(false);
  const [movingTokenInfo, setMovingTokenInfo] = useState(null); // { playerId, tokenId, currentPathStep }
  const [captureEvent, setCaptureEvent] = useState(null); // { row, col, killerColor, capturedTokens, id }
  const isActionLocked = useRef(false);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  // Perform dice roll
  const onRollDice = useCallback(async () => {
    if (
      isActionLocked.current ||
      isRolling ||
      gameState.status !== GAME_STATUS.WAITING_ROLL ||
      gameState.isGameOver
    ) {
      return;
    }

    isActionLocked.current = true;
    setIsRolling(true);
    soundManager.playRoll();

    // Dice rolling animation duration (400ms)
    setTimeout(() => {
      setGameState((prevState) => {
        const nextState = handleDiceRoll(prevState);

        if (nextState.diceValue === 6) {
          soundManager.playSix();
        }

        // If turn was forfeited due to 3 sixes or no moves, release lock after a readable delay
        if (nextState.lastEvent?.type === 'NO_VALID_MOVES' || nextState.lastEvent?.type === 'THREE_SIXES_FORFEIT') {
          setTimeout(() => {
            isActionLocked.current = false;
          }, 900);
        } else {
          isActionLocked.current = false;
        }

        return nextState;
      });
      setIsRolling(false);
    }, 450);
  }, [isRolling, gameState.status, gameState.isGameOver]);

  // Perform token movement with step-by-step animation
  const onSelectToken = useCallback(async (tokenId) => {
    if (
      isActionLocked.current ||
      gameState.status !== GAME_STATUS.WAITING_TOKEN_SELECT ||
      !gameState.validMoves.includes(tokenId) ||
      gameState.isGameOver
    ) {
      return;
    }

    isActionLocked.current = true;

    const movingToken = currentPlayer.tokens.find((t) => t.id === tokenId);
    if (!movingToken) {
      isActionLocked.current = false;
      return;
    }

    const fromStep = movingToken.step;
    const dice = gameState.diceValue;
    const toStep = fromStep === STEP.YARD ? STEP.START : fromStep + dice;

    // Generate coordinate path for hopping
    const path = generateMovementPath(currentPlayer.color, fromStep, toStep, tokenId);

    // Hop through intermediate steps
    if (path.length > 1) {
      for (let i = 0; i < path.length; i++) {
        setMovingTokenInfo({
          playerId: currentPlayer.id,
          tokenId,
          step: path[i].step,
        });
        soundManager.playHop(i);
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
    } else {
      soundManager.playHop(0);
    }

    setMovingTokenInfo(null);

    // Finalize state transition in game engine
    setGameState((prevState) => {
      const nextState = handleTokenMove(prevState, tokenId);

      if (nextState.lastEvent?.type === 'TOKEN_CAPTURED') {
        const capturePos = calculateTokenPosition(currentPlayer.color, toStep, tokenId);
        setCaptureEvent({
          row: capturePos.row,
          col: capturePos.col,
          killerColor: currentPlayer.color,
          capturedTokens: nextState.lastEvent.capturedTokens,
          id: Date.now(),
        });
        soundManager.playCapture();
      } else if (toStep === STEP.FINAL_HOME && nextState.lastEvent?.type !== 'GAME_OVER') {
        soundManager.playHome();
      } else if (nextState.lastEvent?.type === 'GAME_OVER') {
        soundManager.playWin();
        if (nextState.winner) {
          recordGameResult({
            winningColor: nextState.winner.color,
            captures: nextState.winner.stats?.capturesMade || 0,
          });
        }
      }

      isActionLocked.current = false;
      return nextState;
    });
  }, [gameState, currentPlayer]);

  const clearCaptureEvent = useCallback(() => {
    setCaptureEvent(null);
  }, []);

  // Restart game
  const onResetGame = useCallback((playerCount = initialPlayerCount, options = customOptions) => {
    isActionLocked.current = false;
    setIsRolling(false);
    setMovingTokenInfo(null);
    setCaptureEvent(null);
    setGameState(initializeGame(playerCount, options));
  }, [initialPlayerCount, customOptions]);

  return {
    gameState,
    currentPlayer,
    isRolling,
    movingTokenInfo,
    captureEvent,
    clearCaptureEvent,
    onRollDice,
    onSelectToken,
    onResetGame,
  };
}
