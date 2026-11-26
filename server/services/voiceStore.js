/**
 * Ludo Champion - In-Memory Voice Audio Store
 * Manages voice audio buffers for real-time room streaming with automatic expiration.
 */

class VoiceStore {
  constructor() {
    this.store = new Map();

    // Auto-clean audio clips older than 2 minutes (120,000ms)
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [id, item] of this.store.entries()) {
        if (now - item.createdAt > 120000) {
          this.store.delete(id);
        }
      }
    }, 30000);
    if (cleanupInterval.unref) {
      cleanupInterval.unref();
    }
  }

  /**
   * Saves audio buffer
   * @param {string} audioId
   * @param {Buffer} buffer
   * @param {string} mimeType
   */
  saveAudio(audioId, buffer, mimeType = 'audio/m4a') {
    this.store.set(audioId, {
      buffer,
      mimeType,
      createdAt: Date.now(),
    });
  }

  /**
   * Retrieves an audio item
   * @param {string} audioId
   * @returns {{ buffer: Buffer, mimeType: string, createdAt: number } | null}
   */
  getAudio(audioId) {
    return this.store.get(audioId) || null;
  }

  /**
   * Deletes an audio item
   * @param {string} audioId
   */
  deleteAudio(audioId) {
    this.store.delete(audioId);
  }
}

const voiceStore = new VoiceStore();
module.exports = voiceStore;
