/**
 * Ludo Champion - Custom Hook for Authoritative Online Multiplayer Gameplay
 * Handles Socket.IO synchronization, server-side dice rolls, token movements, and reconnections.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { getPlayerProfile } from '../utils/playerProfile';
import { generateMovementPath } from '../game/movement';
import { calculateTokenPosition } from '../game/boardConfig';
import { soundManager } from '../utils/soundManager';
import { GAME_STATUS, STEP } from '../game/constants';

export function useMultiplayerLudo(roomCode, initialGameState = null) {
  const [gameState, setGameState] = useState(initialGameState);
  const [profile, setProfile] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [movingTokenInfo, setMovingTokenInfo] = useState(null);
  const [captureEvent, setCaptureEvent] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const socketRef = useRef(null);
  const isActionLocked = useRef(false);

  // Sync / init connection
  useEffect(() => {
    if (!roomCode) return;
    let isMounted = true;

    async function initSocket() {
      const userProfile = await getPlayerProfile();
      if (!isMounted) return;
      setProfile(userProfile);

      const socket = await getSocket();
      socketRef.current = socket;

      if (socket.connected) {
        setConnectionStatus('CONNECTED');
      }

      socket.on('connect', () => {
        if (!isMounted) return;
        setConnectionStatus('CONNECTED');
        // On reconnection, request full authoritative state sync
        socket.emit('sync-state', { roomCode }, (res) => {
          if (res?.success && res.gameState && isMounted) {
            setGameState(res.gameState);
          }
        });
      });

      socket.on('disconnect', () => {
        if (isMounted) setConnectionStatus('DISCONNECTED');
      });

      socket.on('connect_error', () => {
        if (isMounted) setConnectionStatus('RECONNECTING');
      });

      // Ensure room channel is joined
      socket.emit('join-room', {
        roomCode,
        playerId: userProfile.id,
        playerName: userProfile.name,
      }, (res) => {
        if (res?.success && isMounted) {
          if (res.gameState) {
            setGameState(res.gameState);
          }
        }
      });

      // Real-time authoritative dice result
      socket.on('dice-result', ({ playerId, diceValue }) => {
        if (!isMounted) return;
        setIsRolling(true);
        soundManager.playRoll();

        setTimeout(() => {
          if (!isMounted) return;
          setIsRolling(false);
          if (diceValue === 6) {
            soundManager.playSix();
          }
        }, 400);
      });

      // Real-time authoritative token move
      socket.on('token-moved', async ({ playerId, tokenId, fromStep, toStep, captured, capturedTokens, hasReachedHome }) => {
        if (!isMounted) return;

        // Find the moving player color from latest state
        setGameState((current) => {
          if (!current) return current;
          const p = current.players.find((pl) => pl.id === playerId);
          if (!p) return current;

          // Animate hop coordinates asynchronously
          const path = generateMovementPath(p.color, fromStep, toStep, tokenId);
          (async () => {
            if (path.length > 1) {
              for (let i = 0; i < path.length; i++) {
                if (!isMounted) break;
                setMovingTokenInfo({ playerId, tokenId, step: path[i].step });
                soundManager.playHop(i);
                await new Promise((resolve) => setTimeout(resolve, 80));
              }
            } else {
              soundManager.playHop(0);
            }

            if (!isMounted) return;
            setMovingTokenInfo(null);

            if (captured) {
              const capturePos = calculateTokenPosition(p.color, toStep, tokenId);
              setCaptureEvent({
                row: capturePos.row,
                col: capturePos.col,
                killerColor: p.color,
                capturedTokens: capturedTokens || [],
                id: Date.now(),
              });
              soundManager.playCapture();
            } else if (hasReachedHome) {
              soundManager.playHome();
            }
          })();

          return current;
        });
      });

      // State updates from server
      socket.on('game-state-updated', ({ gameState: nextState }) => {
        if (!isMounted) return;
        setGameState(nextState);
      });

      // Game finished
      socket.on('game-finished', ({ winner, rankings, gameState: finalState }) => {
        if (!isMounted) return;
        setGameState(finalState);
        soundManager.playWin();
      });
    }

    initSocket();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('dice-result');
        socketRef.current.off('token-moved');
        socketRef.current.off('game-state-updated');
        socketRef.current.off('game-finished');
      }
    };
  }, [roomCode]);

  const currentPlayer = gameState?.players?.[gameState.currentPlayerIndex] || null;
  const isMyTurn = currentPlayer?.id === profile?.id;

  // Request dice roll
  const onRollDice = useCallback(() => {
    if (
      !socketRef.current ||
      !isMyTurn ||
      isRolling ||
      isActionLocked.current ||
      gameState?.status !== GAME_STATUS.WAITING_ROLL ||
      gameState?.isGameOver
    ) {
      return;
    }

    isActionLocked.current = true;
    socketRef.current.emit('roll-dice', { roomCode, playerId: profile.id }, (res) => {
      isActionLocked.current = false;
      if (!res?.success) {
        console.warn('Roll dice rejected by server:', res?.error);
      }
    });
  }, [isMyTurn, isRolling, gameState, roomCode, profile]);

  // Request token move
  const onSelectToken = useCallback((tokenId) => {
    if (
      !socketRef.current ||
      !isMyTurn ||
      isActionLocked.current ||
      gameState?.status !== GAME_STATUS.WAITING_TOKEN_SELECT ||
      !gameState?.validMoves?.includes(tokenId) ||
      gameState?.isGameOver
    ) {
      return;
    }

    isActionLocked.current = true;
    socketRef.current.emit('move-token', { roomCode, playerId: profile.id, tokenId }, (res) => {
      isActionLocked.current = false;
      if (!res?.success) {
        console.warn('Move token rejected by server:', res?.error);
      }
    });
  }, [isMyTurn, gameState, roomCode, profile]);

  const clearCaptureEvent = useCallback(() => {
    setCaptureEvent(null);
  }, []);

  return {
    gameState,
    currentPlayer,
    isMyTurn,
    myProfile: profile,
    isRolling,
    movingTokenInfo,
    captureEvent,
    clearCaptureEvent,
    connectionStatus,
    onRollDice,
    onSelectToken,
  };
}
