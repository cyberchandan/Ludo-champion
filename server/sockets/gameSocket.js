/**
 * Real-Time Socket.IO Game & Room Lifecycle Handler
 * Completely authoritative server synchronization for Ludo Champion.
 */

const RoomManager = require('../services/roomManager');
const { handleServerDiceRoll, handleServerTokenMove } = require('../services/gameEngine');

function setupGameSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Join room socket channel
    socket.on('join-room', async ({ roomCode, playerId, playerName }, callback) => {
      try {
        const cleanCode = roomCode?.toUpperCase().trim();
        const room = await RoomManager.getRoom(cleanCode);
        if (!room) {
          if (callback) callback({ success: false, error: 'Room not found' });
          return;
        }

        socket.join(cleanCode);
        socket.roomCode = cleanCode;
        socket.playerId = playerId;

        RoomManager.updatePlayerSocket(cleanCode, playerId, socket.id);

        console.log(`[Socket] Player ${playerName || playerId} joined room ${cleanCode}`);

        // Broadcast to other players
        socket.to(cleanCode).emit('player-joined', {
          room,
          player: room.players.find((p) => p.id === playerId),
        });

        if (callback) {
          callback({
            success: true,
            room,
            gameState: room.gameState,
          });
        }
      } catch (err) {
        console.error('[Socket] join-room error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Start game
    socket.on('start-game', async ({ roomCode, hostId }, callback) => {
      try {
        const cleanCode = roomCode?.toUpperCase().trim();
        const result = await RoomManager.startGame(cleanCode, hostId);
        if (result.error) {
          if (callback) callback({ success: false, error: result.error });
          return;
        }

        console.log(`[Socket] Room ${cleanCode} match started`);
        io.to(cleanCode).emit('game-started', {
          room: result.room,
          gameState: result.room.gameState,
        });

        if (callback) callback({ success: true, room: result.room });
      } catch (err) {
        console.error('[Socket] start-game error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Authoritative Dice Roll
    socket.on('roll-dice', async ({ roomCode, playerId }, callback) => {
      try {
        const cleanCode = roomCode?.toUpperCase().trim();
        const room = await RoomManager.getRoom(cleanCode);
        if (!room || !room.gameState) {
          if (callback) callback({ success: false, error: 'Game not active' });
          return;
        }

        const state = room.gameState;
        const activePlayer = state.players[state.currentPlayerIndex];

        // Anti-Cheat: Validate that it is actually this player's turn
        if (activePlayer.id !== playerId) {
          if (callback) callback({ success: false, error: "Not your turn to roll" });
          return;
        }

        const { state: nextState, error } = handleServerDiceRoll(state);
        if (error) {
          if (callback) callback({ success: false, error });
          return;
        }

        await RoomManager.updateGameState(cleanCode, nextState);

        // Broadcast authoritative dice roll to all players in the room
        io.to(cleanCode).emit('dice-result', {
          playerId,
          diceValue: nextState.diceValue,
          validMoves: nextState.validMoves,
          lastEvent: nextState.lastEvent,
        });

        io.to(cleanCode).emit('game-state-updated', {
          gameState: nextState,
        });

        if (nextState.lastEvent?.type === 'NO_VALID_MOVES' || nextState.lastEvent?.type === 'THREE_SIXES_FORFEIT') {
          io.to(cleanCode).emit('turn-changed', {
            currentPlayerIndex: nextState.currentPlayerIndex,
            currentPlayer: nextState.players[nextState.currentPlayerIndex],
            lastEvent: nextState.lastEvent,
          });
        }

        if (callback) callback({ success: true, diceValue: nextState.diceValue });
      } catch (err) {
        console.error('[Socket] roll-dice error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Authoritative Token Move
    socket.on('move-token', async ({ roomCode, playerId, tokenId }, callback) => {
      try {
        const cleanCode = roomCode?.toUpperCase().trim();
        const room = await RoomManager.getRoom(cleanCode);
        if (!room || !room.gameState) {
          if (callback) callback({ success: false, error: 'Game not active' });
          return;
        }

        const state = room.gameState;
        const activePlayer = state.players[state.currentPlayerIndex];

        // Anti-Cheat: Validate that it is actually this player's turn
        if (activePlayer.id !== playerId) {
          if (callback) callback({ success: false, error: "Not your turn to move" });
          return;
        }

        const { state: nextState, error } = handleServerTokenMove(state, tokenId);
        if (error) {
          if (callback) callback({ success: false, error });
          return;
        }

        await RoomManager.updateGameState(cleanCode, nextState);

        const lastEvent = nextState.lastEvent;

        // Broadcast authoritative token movement
        io.to(cleanCode).emit('token-moved', {
          playerId,
          tokenId,
          fromStep: lastEvent.fromStep,
          toStep: lastEvent.toStep,
          captured: lastEvent.captured,
          capturedTokens: lastEvent.capturedTokens,
          hasReachedHome: lastEvent.hasReachedHome,
          getsExtraTurn: lastEvent.getsExtraTurn,
          lastEvent,
        });

        io.to(cleanCode).emit('game-state-updated', {
          gameState: nextState,
        });

        if (nextState.isGameOver) {
          io.to(cleanCode).emit('game-finished', {
            winner: nextState.winner,
            rankings: nextState.rankings,
            gameState: nextState,
          });
        } else if (!lastEvent.getsExtraTurn) {
          io.to(cleanCode).emit('turn-changed', {
            currentPlayerIndex: nextState.currentPlayerIndex,
            currentPlayer: nextState.players[nextState.currentPlayerIndex],
            lastEvent,
          });
        }

        if (callback) callback({ success: true, gameState: nextState });
      } catch (err) {
        console.error('[Socket] move-token error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Request full state resync (for reconnecting or refreshing players)
    socket.on('sync-state', async ({ roomCode }, callback) => {
      try {
        const cleanCode = roomCode?.toUpperCase().trim();
        const room = await RoomManager.getRoom(cleanCode);
        if (room && callback) {
          callback({
            success: true,
            room,
            gameState: room.gameState,
          });
        }
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const disconnectInfo = RoomManager.markPlayerDisconnected(socket.id);
      if (disconnectInfo) {
        const { room, player } = disconnectInfo;
        console.log(`[Socket] Player ${player.name} disconnected from room ${room.roomCode}`);
        io.to(room.roomCode).emit('player-disconnected', {
          playerId: player.id,
          playerName: player.name,
          room,
        });
      }
    });
  });
}

module.exports = setupGameSocket;
