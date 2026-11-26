const express = require('express');
const router = express.Router();
const LiveKitService = require('../services/livekitService');
const RoomManager = require('../services/roomManager');
const voiceStore = require('../services/voiceStore');

// POST /api/voice/token (LiveKit token generator for rooms with LiveKit configured)
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

// POST /api/voice/send-audio (Receives recorded voice audio and caches it for streaming)
router.post('/send-audio', async (req, res) => {
  try {
    const { roomCode, playerId, playerName, audioData, mimeType } = req.body;
    if (!roomCode || !playerId || !audioData) {
      return res.status(400).json({ success: false, error: 'roomCode, playerId, and audioData are required' });
    }

    const cleanCode = roomCode.toUpperCase().trim();
    const audioId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    let base64String = audioData;
    if (base64String.includes('base64,')) {
      base64String = base64String.split('base64,')[1];
    }

    const buffer = Buffer.from(base64String, 'base64');
    const resolvedMime = mimeType || 'audio/m4a';
    voiceStore.saveAudio(audioId, buffer, resolvedMime);

    // Relay to connected socket clients in this room if io is attached
    const io = req.app.get('io');
    if (io) {
      io.to(cleanCode).emit('voice-audio-received', {
        audioId,
        playerId,
        playerName: playerName || 'Player',
        audioUrl: `/api/voice/stream/${audioId}`,
        audioData,
        mimeType: resolvedMime,
      });
    }

    return res.json({
      success: true,
      audioId,
      audioUrl: `/api/voice/stream/${audioId}`,
    });
  } catch (error) {
    console.error('Error in send-audio route:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/voice/stream/:audioId (Streams voice audio directly to players' speakers)
router.get('/stream/:audioId', (req, res) => {
  const { audioId } = req.params;
  const audioItem = voiceStore.getAudio(audioId);

  if (!audioItem) {
    return res.status(404).send('Voice clip expired or not found');
  }

  res.set({
    'Content-Type': audioItem.mimeType || 'audio/m4a',
    'Content-Length': audioItem.buffer.length,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });

  return res.send(audioItem.buffer);
});

module.exports = router;
