/**
 * Ludo Champion - Storage Utility
 * Uses AsyncStorage for persistent settings, stats, and preferences.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SETTINGS: '@ludo_settings',
  STATISTICS: '@ludo_statistics',
};

export const DEFAULT_SETTINGS = {
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  threeSixesRule: true,
  theme: 'classic',
  lastSelectedPlayerCount: 4,
};

export const DEFAULT_STATISTICS = {
  gamesPlayed: 0,
  gamesWon: 0,
  totalWinsByColor: {
    RED: 0,
    GREEN: 0,
    YELLOW: 0,
    BLUE: 0,
  },
  capturesMade: 0,
};

/**
 * Loads user settings from storage
 * @returns {Promise<Object>}
 */
export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Saves user settings
 * @param {Object} settings 
 */
export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * Loads statistics from storage
 * @returns {Promise<Object>}
 */
export async function loadStatistics() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.STATISTICS);
    if (!raw) return { ...DEFAULT_STATISTICS };
    return { ...DEFAULT_STATISTICS, ...JSON.parse(raw) };
  } catch (error) {
    console.error('Failed to load statistics:', error);
    return { ...DEFAULT_STATISTICS };
  }
}

/**
 * Records a completed game result into statistics
 * @param {Object} params
 * @param {string} params.winningColor
 * @param {number} [params.captures=0]
 */
export async function recordGameResult({ winningColor, captures = 0 }) {
  try {
    const current = await loadStatistics();
    const updated = {
      ...current,
      gamesPlayed: current.gamesPlayed + 1,
      gamesWon: current.gamesWon + 1,
      capturesMade: current.capturesMade + captures,
      totalWinsByColor: {
        ...current.totalWinsByColor,
        [winningColor]: (current.totalWinsByColor[winningColor] || 0) + 1,
      },
    };
    await AsyncStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to record game result:', error);
    return null;
  }
}

/**
 * Resets all user statistics
 * @returns {Promise<Object>}
 */
export async function resetStatistics() {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(DEFAULT_STATISTICS));
    return { ...DEFAULT_STATISTICS };
  } catch (error) {
    console.error('Failed to reset statistics:', error);
    return DEFAULT_STATISTICS;
  }
}
