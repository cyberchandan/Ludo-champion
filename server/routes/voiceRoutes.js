const express = require('express');
const router = express.Router();
const LiveKitService = require('../services/livekitService');
const RoomManager = require('../services/roomManager');

// POST /api/voice/token
router.post('/token', async (req, res) => {
  try {
    const { roomCode, playerId, playerName } = req.body;
    if (!roomCode || !playerId) {
      return res.status(400).json({ success: false, error: 'roomCode and playerId are required' });
    }

    // Verify room exists
    const room = await RoomManager.getRoom(roomCode);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const { token, wsUrl } = await LiveKitService.generateToken({
      roomCode,
      playerId,
      playerName,
    });

    return res.json({
      success: true,
      token,
      wsUrl,
      roomCode: room.roomCode,
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
