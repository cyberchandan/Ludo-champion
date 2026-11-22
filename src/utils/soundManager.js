/**
 * Ludo Champion - Sound & Haptics Manager
 * Fully offline, self-contained audio synthesis with Expo AV & Expo Haptics.
 */

import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Creates a base64 encoded RIFF WAV data URI from 8-bit PCM samples
 * @param {Uint8Array} samples 
 * @param {number} sampleRate 
 * @returns {string} data:audio/wav;base64,...
 */
function createWavDataUri(samples, sampleRate = 8000) {
  const numSamples = samples.length;
  const buffer = new Uint8Array(44 + numSamples);

  // RIFF identifier
  buffer[0] = 0x52; // R
  buffer[1] = 0x49; // I
  buffer[2] = 0x46; // F
  buffer[3] = 0x46; // F

  // File length - 8
  const fileLen = 36 + numSamples;
  buffer[4] = fileLen & 0xff;
  buffer[5] = (fileLen >> 8) & 0xff;
  buffer[6] = (fileLen >> 16) & 0xff;
  buffer[7] = (fileLen >> 24) & 0xff;

  // WAVE identifier
  buffer[8] = 0x57;  // W
  buffer[9] = 0x41;  // A
  buffer[10] = 0x56; // V
  buffer[11] = 0x45; // E

  // 'fmt ' chunk
  buffer[12] = 0x66; // f
  buffer[13] = 0x6d; // m
  buffer[14] = 0x74; // t
  buffer[15] = 0x20; // ' '

  // Subchunk1Size (16 for PCM)
  buffer[16] = 16;
  buffer[17] = 0;
  buffer[18] = 0;
  buffer[19] = 0;

  // AudioFormat (1 for PCM)
  buffer[20] = 1;
  buffer[21] = 0;

  // NumChannels (1 = mono)
  buffer[22] = 1;
  buffer[23] = 0;

  // SampleRate
  buffer[24] = sampleRate & 0xff;
  buffer[25] = (sampleRate >> 8) & 0xff;
  buffer[26] = (sampleRate >> 16) & 0xff;
  buffer[27] = (sampleRate >> 24) & 0xff;

  // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  buffer[28] = sampleRate & 0xff;
  buffer[29] = (sampleRate >> 8) & 0xff;
  buffer[30] = (sampleRate >> 16) & 0xff;
  buffer[31] = (sampleRate >> 24) & 0xff;

  // BlockAlign (NumChannels * BitsPerSample/8)
  buffer[32] = 1;
  buffer[33] = 0;

  // BitsPerSample (8 bits)
  buffer[34] = 8;
  buffer[35] = 0;

  // 'data' chunk
  buffer[36] = 0x64; // d
  buffer[37] = 0x61; // a
  buffer[38] = 0x74; // t
  buffer[39] = 0x61; // a

  // Subchunk2Size
  buffer[40] = numSamples & 0xff;
  buffer[41] = (numSamples >> 8) & 0xff;
  buffer[42] = (numSamples >> 16) & 0xff;
  buffer[43] = (numSamples >> 24) & 0xff;

  // Audio Samples
  buffer.set(samples, 44);

  // Convert to Base64
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }

  // Cross platform btoa
  const base64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
  return `data:audio/wav;base64,${base64}`;
}

// Generate sound waveform buffers (8000 Hz, 8-bit PCM)
function generateSounds() {
  const rate = 8000;

  // 1. Click sound (50ms, 800Hz beep)
  const clickSamples = new Uint8Array(400);
  for (let i = 0; i < clickSamples.length; i++) {
    const t = i / rate;
    const decay = Math.exp(-t * 60);
    clickSamples[i] = Math.floor(128 + 60 * Math.sin(2 * Math.PI * 800 * t) * decay);
  }

  // 2. Roll sound (350ms, rattling dice effect)
  const rollSamples = new Uint8Array(2800);
  for (let i = 0; i < rollSamples.length; i++) {
    const t = i / rate;
    const rattlePulse = Math.sin(2 * Math.PI * 25 * t);
    const noise = (Math.random() * 2 - 1) * (rattlePulse > 0.2 ? 1 : 0.3);
    const envelope = Math.sin((i / rollSamples.length) * Math.PI);
    rollSamples[i] = Math.floor(128 + 70 * noise * envelope);
  }

  // 3. Hop sound (100ms, cheerful frequency sweep from 450Hz to 750Hz)
  const hopSamples = new Uint8Array(800);
  for (let i = 0; i < hopSamples.length; i++) {
    const t = i / rate;
    const freq = 450 + 300 * (i / hopSamples.length);
    const decay = Math.sin((i / hopSamples.length) * Math.PI);
    hopSamples[i] = Math.floor(128 + 80 * Math.sin(2 * Math.PI * freq * t) * decay);
  }

  // 4. Capture sound (350ms, dramatic impact)
  const capSamples = new Uint8Array(2800);
  for (let i = 0; i < capSamples.length; i++) {
    const t = i / rate;
    const decay = Math.exp(-t * 12);
    const tone = Math.sin(2 * Math.PI * 180 * t) + 0.6 * Math.sin(2 * Math.PI * 90 * t);
    capSamples[i] = Math.floor(128 + 90 * tone * decay);
  }

  // 5. Win fanfare (800ms, C-E-G-C major chords)
  const winSamples = new Uint8Array(6400);
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  for (let i = 0; i < winSamples.length; i++) {
    const t = i / rate;
    const noteIdx = Math.min(3, Math.floor((i / winSamples.length) * 4));
    const freq = notes[noteIdx];
    const decay = 1 - ((i % 1600) / 1600) * 0.4;
    winSamples[i] = Math.floor(128 + 70 * Math.sin(2 * Math.PI * freq * t) * decay);
  }

  return {
    click: createWavDataUri(clickSamples, rate),
    roll: createWavDataUri(rollSamples, rate),
    hop: createWavDataUri(hopSamples, rate),
    capture: createWavDataUri(capSamples, rate),
    win: createWavDataUri(winSamples, rate),
  };
}

class SoundManager {
  constructor() {
    this.soundEnabled = true;
    this.vibrationEnabled = true;
    this.audioUris = null;
    this.isInitialized = false;
  }

  async init(settings = {}) {
    if (settings.soundEnabled !== undefined) this.soundEnabled = settings.soundEnabled;
    if (settings.vibrationEnabled !== undefined) this.vibrationEnabled = settings.vibrationEnabled;

    try {
      this.audioUris = generateSounds();
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.isInitialized = true;
    } catch (e) {
      console.warn('Audio initialization notice:', e);
    }
  }

  updateSettings({ soundEnabled, vibrationEnabled }) {
    if (soundEnabled !== undefined) this.soundEnabled = soundEnabled;
    if (vibrationEnabled !== undefined) this.vibrationEnabled = vibrationEnabled;
  }

  async playSound(soundKey) {
    if (!this.soundEnabled) return;
    if (!this.audioUris) this.audioUris = generateSounds();

    const uri = this.audioUris[soundKey];
    if (!uri) return;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: 1.0 }
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch (error) {
      // Audio playback failsafe
    }
  }

  async playClick() {
    this.playSound('click');
    if (this.vibrationEnabled) {
      try {
        Haptics.selectionAsync();
      } catch (e) {}
    }
  }

  async playRoll() {
    this.playSound('roll');
    if (this.vibrationEnabled) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  }

  async playHop() {
    this.playSound('hop');
    if (this.vibrationEnabled) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  }

  async playCapture() {
    this.playSound('capture');
    if (this.vibrationEnabled) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
    }
  }

  async playWin() {
    this.playSound('win');
    if (this.vibrationEnabled) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }
  }
}

export const soundManager = new SoundManager();
