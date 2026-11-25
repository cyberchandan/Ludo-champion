/**
 * LiveKit Voice Token Service
 * Issues secure JWT tokens for room voice participants.
 */

const { AccessToken } = require('livekit-server-sdk');

class LiveKitService {
  /**
   * Generates a LiveKit access token for a player in a room
   * @param {Object} options
   * @param {string} options.roomCode
   * @param {string} options.playerId
   * @param {string} options.playerName
   * @returns {Promise<{ token: string, wsUrl: string }>}
   */
  static async generateToken({ roomCode, playerId, playerName }) {
    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret_key_32_characters_minimum_len';
    const wsUrl = process.env.LIVEKIT_URL || 'wss://sample.livekit.cloud';

    if (!roomCode || !playerId) {
      throw new Error('roomCode and playerId are required');
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: String(playerId),
      name: playerName || 'Player',
      ttl: '6h',
    });

    at.addGrant({
      roomJoin: true,
      room: String(roomCode).toUpperCase(),
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return {
      token,
      wsUrl,
    };
  }
}

module.exports = LiveKitService;
