const express = require('express');
const router = express.Router();
const RoomManager = require('../services/roomManager');

// POST /api/rooms/create
router.post('/create', async (req, res) => {
  try {
    const { hostName, hostId, avatar } = req.body;
    const room = await RoomManager.createRoom({ hostName, hostId, avatar });
    return res.status(201).json({
      success: true,
      roomCode: room.roomCode,
      room,
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/rooms/join
router.post('/join', async (req, res) => {
  try {
    const { roomCode, playerName, playerId, avatar } = req.body;
    if (!roomCode) {
      return res.status(400).json({ success: false, error: 'Room code is required' });
    }

    const result = await RoomManager.joinRoom({ roomCode, playerName, playerId, avatar });
    if (result.error) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({
      success: true,
      room: result.room,
      player: result.player,
    });
  } catch (error) {
    console.error('Error joining room:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/rooms/:roomCode
router.get('/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = await RoomManager.getRoom(roomCode);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    return res.json({ success: true, room });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/rooms/:roomCode/start
router.post('/:roomCode/start', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { hostId } = req.body;
    const result = await RoomManager.startGame(roomCode, hostId);
    if (result.error) {
      return res.status(400).json({ success: false, error: result.error });
    }
    return res.json({ success: true, room: result.room });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
