/**
 * Ludo Champion - Sound & Haptics Manager
 * Fully featured, high-performance cross-platform audio system supporting:
 * - Native iOS & Android via expo-audio (with pre-cached players)
 * - Web browsers via HTML5 Audio & Web Audio API
 * - 100% self-contained offline 16-bit PCM WAV audio data URIs
 * - Dynamic pitch shifting on token hops (ascending scale)
 * - Rich game event effects: roll, six, hop, capture, home, win, click
 * - Looping background music (BGM) with user toggle control
 * - Expo Haptics tactile feedback
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SOUND_DATA_URIS } from './soundDataUris';

// Lazy loader for expo-audio to prevent crash in environments where native module is unlinked
let ExpoAudioModule = null;
function getExpoAudio() {
  if (ExpoAudioModule !== null) return ExpoAudioModule;
  try {
    ExpoAudioModule = require('expo-audio');
  } catch (e) {
    ExpoAudioModule = false;
  }
  return ExpoAudioModule;
}

// Local asset references bundled with Metro (defensively loaded for non-Metro environments like Jest)
let SOUND_ASSETS = {};
try {
  SOUND_ASSETS = {
    click: require('../../assets/sounds/click.wav'),
    roll: require('../../assets/sounds/roll.wav'),
    hop: require('../../assets/sounds/hop.wav'),
    capture: require('../../assets/sounds/capture.wav'),
    six: require('../../assets/sounds/six.wav'),
    home: require('../../assets/sounds/home.wav'),
    win: require('../../assets/sounds/win.wav'),
    bgm: require('../../assets/sounds/bgm.wav'),
  };
} catch (e) {
  SOUND_ASSETS = {};
}

class SoundManager {
  constructor() {
    this.soundEnabled = true;
    this.musicEnabled = false; // Default music to OFF so background music does not play on game start
    this.vibrationEnabled = true;
    this.soundVolume = 1.0; // SFX volume: 0.0 to 1.0 (active for dice & moves)
    this.musicVolume = 0.5; // BGM volume: 0.0 to 1.0
    this.isInitialized = false;

    // Background music player references
    this.isBgmPlaying = false;
    this.bgmPlayer = null;
    this.webBgmAudio = null;

    // Fast-reusable player pool for short sounds on native
    this.playerPool = {};

    // Web audio unlock handler for browser autoplay policy
    this.webUnlocked = false;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const unlock = () => {
        this.webUnlocked = true;
        // Do not auto-play background music on user click/interaction.
        // This ensures only dice & game sound effects respond to user actions.
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
      };
      window.addEventListener('click', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
    }
  }

  /**
   * Initializes audio settings and configures audio session
   * @param {Object} settings
   */
  async init(settings = {}) {
    if (settings.soundEnabled !== undefined) this.soundEnabled = !!settings.soundEnabled;
    this.musicEnabled = settings.musicEnabled === true;
    if (settings.vibrationEnabled !== undefined) this.vibrationEnabled = !!settings.vibrationEnabled;
    if (settings.soundVolume !== undefined) {
      this.soundVolume = Math.max(0, Math.min(1, Number(settings.soundVolume)));
    }
    if (settings.musicVolume !== undefined) {
      this.musicVolume = Math.max(0, Math.min(1, Number(settings.musicVolume)));
    }

    const expoAudio = getExpoAudio();
    if (expoAudio?.setAudioModeAsync) {
      try {
        await expoAudio.setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          interruptionMode: 'mixWithOthers',
        });
      } catch (e) {
        // Safe fallback
      }
    }

    this.isInitialized = true;

    // Start background music only if explicitly enabled
    if (this.musicEnabled && this.musicVolume > 0) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  /**
   * Updates audio and vibration preferences
   * @param {Object} settings
   */
  updateSettings({ soundEnabled, musicEnabled, vibrationEnabled, soundVolume, musicVolume } = {}) {
    if (soundEnabled !== undefined) this.soundEnabled = !!soundEnabled;
    if (vibrationEnabled !== undefined) this.vibrationEnabled = !!vibrationEnabled;
    if (soundVolume !== undefined) {
      this.soundVolume = Math.max(0, Math.min(1, Number(soundVolume)));
    }
    if (musicVolume !== undefined) {
      this.musicVolume = Math.max(0, Math.min(1, Number(musicVolume)));
      this._applyMusicVolume();
    }

    if (musicEnabled !== undefined) {
      const changed = this.musicEnabled !== !!musicEnabled;
      this.musicEnabled = !!musicEnabled;
      if (changed) {
        if (this.musicEnabled && this.musicVolume > 0) {
          this.startMusic();
        } else {
          this.stopMusic();
        }
      }
    }
  }

  /**
   * Toggle background music on/off
   * @returns {boolean} New state
   */
  toggleMusic() {
    const nextState = !this.musicEnabled;
    this.updateSettings({ musicEnabled: nextState });
    return nextState;
  }

  /**
   * Toggle sound effects on/off
   * @returns {boolean} New state
   */
  toggleSound() {
    const nextState = !this.soundEnabled;
    this.updateSettings({ soundEnabled: nextState });
    return nextState;
  }

  /**
   * Set sound effects volume (0.0 to 1.0)
   * @param {number} volume
   */
  setSoundVolume(volume) {
    this.updateSettings({ soundVolume: volume });
  }

  /**
   * Set background music volume (0.0 to 1.0)
   * @param {number} volume
   */
  setMusicVolume(volume) {
    this.updateSettings({ musicVolume: volume });
  }

  /**
   * Applies the current music volume in real-time to active players
   * @private
   */
  _applyMusicVolume() {
    const effectiveVolume = this.musicEnabled ? this.musicVolume * 0.7 : 0;

    if (effectiveVolume <= 0) {
      if (this.isBgmPlaying) {
        this.stopMusic();
      }
      return;
    }

    if (this.webBgmAudio) {
      try {
        this.webBgmAudio.volume = Math.max(0, Math.min(1, effectiveVolume));
      } catch (e) {}
    }

    if (this.bgmPlayer) {
      try {
        this.bgmPlayer.volume = Math.max(0, Math.min(1, effectiveVolume));
      } catch (e) {}
    }

    if (this.musicEnabled && !this.isBgmPlaying && effectiveVolume > 0) {
      this.startMusic();
    }
  }

  /**
   * Internal player for Web environments using HTML5 Audio
   * @private
   */
  _playWebSound(soundKey, { volume = 1.0, playbackRate = 1.0, loop = false } = {}) {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;

    try {
      const uri = SOUND_DATA_URIS[soundKey];
      if (!uri) return null;

      const audio = new Audio(uri);
      audio.volume = Math.max(0, Math.min(1, volume));
      if (playbackRate !== 1.0) {
        audio.playbackRate = playbackRate;
        if ('preservesPitch' in audio) audio.preservesPitch = false;
        if ('mozPreservesPitch' in audio) audio.mozPreservesPitch = false;
        if ('webkitPreservesPitch' in audio) audio.webkitPreservesPitch = false;
      }
      audio.loop = loop;

      const promise = audio.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {
          // Autoplay blocked prior to user interaction
        });
      }
      return audio;
    } catch (e) {
      return null;
    }
  }

  /**
   * Internal player for Native platforms using expo-audio
   * @private
   */
  _playNativeSound(soundKey, { volume = 1.0, playbackRate = 1.0, loop = false } = {}) {
    const expoAudio = getExpoAudio();
    if (!expoAudio?.createAudioPlayer) return null;

    try {
      const source = SOUND_ASSETS[soundKey] || { uri: SOUND_DATA_URIS[soundKey] };
      const player = expoAudio.createAudioPlayer(source);

      if (player) {
        player.volume = Math.max(0, Math.min(1, volume));
        player.loop = loop;

        if (playbackRate !== 1.0) {
          try {
            player.playbackRate = playbackRate;
            player.shouldCorrectPitch = false;
          } catch (e) {}
        }

        player.play();

        // Release ephemeral sound effect players after duration
        if (!loop) {
          const timeout = Math.max(500, ((player.duration || 1) * 1000) / playbackRate + 400);
          setTimeout(() => {
            try {
              player.release?.();
            } catch (e) {}
          }, timeout);
        }

        return player;
      }
    } catch (e) {
      // Audio playback failsafe
    }
    return null;
  }

  /**
   * Universal sound effect dispatcher
   * @param {string} soundKey - One of: 'click', 'roll', 'hop', 'capture', 'six', 'home', 'win', 'bgm'
   * @param {Object} [options]
   */
  async playSound(soundKey, options = {}) {
    if (!this.soundEnabled || this.soundVolume <= 0) return;

    // Scale requested volume by user master sound effects volume
    const baseVolume = options.volume !== undefined ? options.volume : 1.0;
    const effectiveVolume = Math.max(0, Math.min(1, baseVolume * this.soundVolume));

    const finalOptions = {
      ...options,
      volume: effectiveVolume,
    };

    if (Platform.OS === 'web') {
      this._playWebSound(soundKey, finalOptions);
    } else {
      this._playNativeSound(soundKey, finalOptions);
    }
  }

  // -------------------------------------------------------------------
  // GAME SPECIFIC AUDIO TRIGGERS
  // -------------------------------------------------------------------

  /**
   * Button click / UI tap sound
   */
  async playClick() {
    this.playSound('click', { volume: 0.8 });
    if (this.vibrationEnabled) {
      try {
        Haptics?.selectionAsync?.().catch?.(() => {});
      } catch (e) {}
    }
  }

  /**
   * Dice roll rattle sound
   */
  async playRoll() {
    this.playSound('roll', { volume: 1.0 });
    if (this.vibrationEnabled) {
      try {
        Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle?.Medium).catch?.(() => {});
      } catch (e) {}
    }
  }

  /**
   * Micro-impact sound when rolling dice bounces on board surface
   */
  async playDiceBounce() {
    this.playSound('click', { volume: 0.65, playbackRate: 1.25 });
    if (this.vibrationEnabled) {
      try {
        Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle?.Light).catch?.(() => {});
      } catch (e) {}
    }
  }

  /**
   * Token hop / step sound with musical pitch scaling
   * @param {number} [hopStep=0] - Step index within the current move sequence (0..5)
   */
  async playHop(hopStep = 0) {
    // Pitch rises smoothly for each consecutive hop: 1.0x -> 1.4x
    const pitchMultiplier = 1.0 + Math.min(0.45, Math.max(0, hopStep) * 0.08);

    this.playSound('hop', {
      volume: 0.85,
      playbackRate: pitchMultiplier,
    });

    if (this.vibrationEnabled) {
      try {
        Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle?.Light).catch?.(() => {});
      } catch (e) {}
    }
  }

  /**
   * Rolling a 6 celebration sound
   */
  async playSix() {
    this.playSound('six', { volume: 1.0 });
    if (this.vibrationEnabled) {
      try {
        Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType?.Success).catch?.(() => {});
      } catch (e) {}
    }
  }

  /**
   * Token reached final home triangle sound
   */
  async playHome() {
    this.playSound('home', { volume: 1.0 });
    if (this.vibrationEnabled) {
      try {
        Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType?.Success).catch?.(() => {});
      } catch (e) {}
    }
  }

  /**
   * Opponent token capture knockout strike with fire blast tactile impact
   */
  async playCapture() {
    this.playSound('capture', { volume: 1.0 });
    if (this.vibrationEnabled) {
      try {
        Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle?.Heavy).catch?.(() => {});
        setTimeout(() => {
          try {
            Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType?.Warning).catch?.(() => {});
          } catch (e) {}
        }, 120);
      } catch (e) {}
    }
  }

  /**
   * Grand victory fanfare when game is won
   */
  async playWin() {
    this.playSound('win', { volume: 1.0 });
    if (this.vibrationEnabled) {
      try {
        Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType?.Success).catch?.(() => {});
      } catch (e) {}
    }
  }

  // -------------------------------------------------------------------
  // BACKGROUND MUSIC (BGM)
  // -------------------------------------------------------------------

  /**
   * Starts looping background music
   */
  async startMusic() {
    if (!this.musicEnabled || this.musicVolume <= 0) return;
    if (this.isBgmPlaying) return;

    this.isBgmPlaying = true;
    const effectiveVolume = Math.max(0, Math.min(1, this.musicVolume * 0.7));

    if (Platform.OS === 'web') {
      try {
        if (!this.webBgmAudio) {
          this.webBgmAudio = new Audio(SOUND_DATA_URIS.bgm);
          this.webBgmAudio.loop = true;
        }
        this.webBgmAudio.volume = effectiveVolume;
        const promise = this.webBgmAudio.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(() => {});
        }
      } catch (e) {}
    } else {
      const expoAudio = getExpoAudio();
      if (expoAudio?.createAudioPlayer) {
        try {
          if (!this.bgmPlayer) {
            const source = SOUND_ASSETS.bgm || { uri: SOUND_DATA_URIS.bgm };
            this.bgmPlayer = expoAudio.createAudioPlayer(source);
            if (this.bgmPlayer) {
              this.bgmPlayer.loop = true;
            }
          }
          if (this.bgmPlayer) {
            this.bgmPlayer.volume = effectiveVolume;
            this.bgmPlayer.play?.();
          }
        } catch (e) {}
      }
    }
  }

  /**
   * Stops background music
   */
  stopMusic() {
    this.isBgmPlaying = false;

    if (this.webBgmAudio) {
      try {
        this.webBgmAudio.pause();
        this.webBgmAudio.currentTime = 0;
      } catch (e) {}
    }

    if (this.bgmPlayer) {
      try {
        this.bgmPlayer.pause?.();
        this.bgmPlayer.seekTo?.(0);
      } catch (e) {}
    }
  }

  /**
   * Pauses all audio playback
   */
  async stopAll() {
    this.stopMusic();
  }

  /**
   * Releases all audio resources
   */
  async unloadAll() {
    this.stopMusic();

    if (this.bgmPlayer) {
      try {
        this.bgmPlayer.release?.();
      } catch (e) {}
      this.bgmPlayer = null;
    }

    this.webBgmAudio = null;
  }
}

export const soundManager = new SoundManager();
export default soundManager;
