/**
 * Room Manager Service
 * Manages 6-character room codes, player slots, colors, and room persistence.
 */

const RoomModel = require('../models/Room');
const { initializeMultiplayerGame } = require('./gameEngine');

// Character pool excluding ambiguous characters (0, O, 1, I)
const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const COLOR_ORDER = ['RED', 'GREEN', 'YELLOW', 'BLUE'];

// In-memory cache for ultra-fast real-time lookup
const activeRooms = new Map();

function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
    code += CODE_CHARS[randomIndex];
  }
  return code;
}

class RoomManager {
  /**
   * Generates a unique 6-character room code
   */
  static getUniqueCode() {
    let attempts = 0;
    while (attempts < 100) {
      const code = generateRoomCode();
      if (!activeRooms.has(code)) {
        return code;
      }
      attempts++;
    }
    return Date.now().toString(36).slice(-6).toUpperCase();
  }

  /**
   * Creates a private room
   */
  static async createRoom({ hostName, hostId, avatar = 'account' }) {
    const roomCode = this.getUniqueCode();

    const hostPlayer = {
      id: hostId || `p_${Date.now()}`,
      name: hostName || 'Host Player',
      color: 'RED',
      socketId: null,
      isHost: true,
      isConnected: true,
      avatar,
      joinedAt: new Date(),
    };

    const roomData = {
      roomCode,
      hostId: hostPlayer.id,
      status: 'WAITING',
      maxPlayers: 4,
      players: [hostPlayer],
      gameState: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    activeRooms.set(roomCode, roomData);

    // Save to MongoDB asynchronously if connected
    try {
      if (RoomModel.db?.readyState === 1) {
        await RoomModel.create(roomData);
      }
    } catch (err) {
      console.warn(`[RoomManager] DB save error for ${roomCode}:`, err.message);
    }

    return roomData;
  }

  /**
   * Retrieves a room by its 6-character code
   */
  static async getRoom(roomCode) {
    if (!roomCode) return null;
    const cleanCode = roomCode.toUpperCase().trim();

    if (activeRooms.has(cleanCode)) {
      return activeRooms.get(cleanCode);
    }

    try {
      if (RoomModel.db?.readyState === 1) {
        const doc = await RoomModel.findOne({ roomCode: cleanCode });
        if (doc) {
          const roomObj = doc.toObject();
          activeRooms.set(cleanCode, roomObj);
          return roomObj;
        }
      }
    } catch (err) {
      console.warn(`[RoomManager] DB find error for ${cleanCode}:`, err.message);
    }

    return null;
  }

  /**
   * Joins an existing room
   */
  static async joinRoom({ roomCode, playerName, playerId, avatar = 'account' }) {
    const room = await this.getRoom(roomCode);
    if (!room) {
      return { error: 'Room not found. Please check your invitation code.' };
    }

    const cleanId = playerId || `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // If player is already in room, update connectivity
    const existingPlayerIndex = room.players.findIndex((p) => p.id === cleanId);
    if (existingPlayerIndex !== -1) {
      room.players[existingPlayerIndex].isConnected = true;
      room.players[existingPlayerIndex].name = playerName || room.players[existingPlayerIndex].name;
      room.updatedAt = new Date();
      activeRooms.set(room.roomCode, room);
      return { room, player: room.players[existingPlayerIndex] };
    }

    if (room.status !== 'WAITING') {
      return { error: 'Game has already started in this room.' };
    }

    if (room.players.length >= room.maxPlayers) {
      return { error: 'This room is already full (maximum 4 players).' };
    }

    // Determine next available color
    const takenColors = room.players.map((p) => p.color);
    const availableColor = COLOR_ORDER.find((c) => !takenColors.includes(c)) || 'BLUE';

    const newPlayer = {
      id: cleanId,
      name: playerName || `Player ${room.players.length + 1}`,
      color: availableColor,
      socketId: null,
      isHost: false,
      isConnected: true,
      avatar,
      joinedAt: new Date(),
    };

    room.players.push(newPlayer);
    room.updatedAt = new Date();
    activeRooms.set(room.roomCode, room);

    try {
      if (RoomModel.db?.readyState === 1) {
        await RoomModel.updateOne({ roomCode: room.roomCode }, { players: room.players, updatedAt: new Date() });
      }
    } catch (err) {
      console.warn(`[RoomManager] DB update error:`, err.message);
    }

    return { room, player: newPlayer };
  }

  /**
   * Associates a connected socket with a player
   */
  static updatePlayerSocket(roomCode, playerId, socketId) {
    const room = activeRooms.get(roomCode?.toUpperCase());
    if (!room) return null;

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.socketId = socketId;
      player.isConnected = true;
      room.updatedAt = new Date();
    }
    return room;
  }

  /**
   * Marks a player as disconnected
   */
  static markPlayerDisconnected(socketId) {
    for (const [code, room] of activeRooms.entries()) {
      const player = room.players.find((p) => p.socketId === socketId);
      if (player) {
        player.isConnected = false;
        player.socketId = null;
        room.updatedAt = new Date();
        return { room, player };
      }
    }
    return null;
  }

  /**
   * Starts the game inside the room
   */
  static async startGame(roomCode, hostId) {
    const room = await this.getRoom(roomCode);
    if (!room) {
      return { error: 'Room not found' };
    }

    if (room.hostId !== hostId) {
      return { error: 'Only the room host can start the match.' };
    }

    if (room.players.length < 2) {
      return { error: 'At least 2 players are required to start a game.' };
    }

    // Initialize authoritative game state
    const gameState = initializeMultiplayerGame(room.players);
    room.gameState = gameState;
    room.status = 'PLAYING';
    room.updatedAt = new Date();

    activeRooms.set(room.roomCode, room);

    try {
      if (RoomModel.db?.readyState === 1) {
        await RoomModel.updateOne(
          { roomCode: room.roomCode },
          { status: 'PLAYING', gameState, updatedAt: new Date() }
        );
      }
    } catch (err) {
      console.warn(`[RoomManager] DB start update error:`, err.message);
    }

    return { room };
  }

  /**
   * Updates game state after an authoritative move or roll
   */
  static async updateGameState(roomCode, nextState) {
    const room = activeRooms.get(roomCode?.toUpperCase());
    if (!room) return null;

    room.gameState = nextState;
    if (nextState.isGameOver) {
      room.status = 'FINISHED';
    }
    room.updatedAt = new Date();

    try {
      if (RoomModel.db?.readyState === 1) {
        await RoomModel.updateOne(
          { roomCode: room.roomCode },
          { gameState: nextState, status: room.status, updatedAt: new Date() }
        );
      }
    } catch (err) {
      console.warn(`[RoomManager] DB state update error:`, err.message);
    }

    return room;
  }
}

module.exports = RoomManager;
