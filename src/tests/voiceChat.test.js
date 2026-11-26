/**
 * Ludo Champion - Voice Chat & Voice Store Tests
 */

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  NativeModules: {},
  Alert: { alert: jest.fn() },
}));

jest.mock('expo-constants', () => ({
  appOwnership: 'expo',
}));

jest.mock('../services/socket', () => ({
  getSocket: jest.fn(),
}));

jest.mock('../services/api', () => ({
  getServerUrl: jest.fn().mockResolvedValue('http://localhost:3000'),
}));

jest.mock('../utils/playerProfile', () => ({
  getPlayerProfile: jest.fn().mockResolvedValue({ id: 'test_p1', name: 'Player 1' }),
}));

const voiceStore = require('../../server/services/voiceStore');
const { isWebRTCSupported } = require('../hooks/useLiveKitVoice');

describe('Voice Chat System', () => {
  describe('isWebRTCSupported', () => {
    it('returns a boolean value defensively without throwing', () => {
      const supported = isWebRTCSupported();
      expect(typeof supported).toBe('boolean');
      expect(supported).toBe(false);
    });
  });

  describe('VoiceStore Service', () => {
    it('correctly stores and retrieves audio buffers', () => {
      const audioId = 'test_audio_123';
      const sampleBuffer = Buffer.from('RIFF_SAMPLE_VOICE_DATA');
      const mime = 'audio/m4a';

      voiceStore.saveAudio(audioId, sampleBuffer, mime);

      const retrieved = voiceStore.getAudio(audioId);
      expect(retrieved).not.toBeNull();
      expect(retrieved.buffer.toString()).toBe('RIFF_SAMPLE_VOICE_DATA');
      expect(retrieved.mimeType).toBe('audio/m4a');
      expect(typeof retrieved.createdAt).toBe('number');
    });

    it('returns null for non-existent audio', () => {
      const nonExistent = voiceStore.getAudio('fake_id_999');
      expect(nonExistent).toBeNull();
    });

    it('can delete audio from the store', () => {
      const audioId = 'test_audio_delete';
      voiceStore.saveAudio(audioId, Buffer.from('data'), 'audio/m4a');
      expect(voiceStore.getAudio(audioId)).not.toBeNull();

      voiceStore.deleteAudio(audioId);
      expect(voiceStore.getAudio(audioId)).toBeNull();
    });
  });
});
