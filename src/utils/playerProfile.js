/**
 * Player Profile Utility
 * Stores local player display name and persistent UUID for multiplayer identity.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_NAME = '@ludo_profile_name';
const STORAGE_KEY_ID = '@ludo_profile_id';

let cachedProfile = null;

export async function getPlayerProfile() {
  if (cachedProfile) return cachedProfile;

  try {
    let id = await AsyncStorage.getItem(STORAGE_KEY_ID);
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      await AsyncStorage.setItem(STORAGE_KEY_ID, id);
    }

    let name = await AsyncStorage.getItem(STORAGE_KEY_NAME);
    if (!name) {
      name = 'Player ' + Math.floor(1000 + Math.random() * 9000);
      await AsyncStorage.setItem(STORAGE_KEY_NAME, name);
    }

    cachedProfile = { id, name };
    return cachedProfile;
  } catch (e) {
    const fallback = {
      id: 'user_' + Date.now(),
      name: 'Player 1',
    };
    cachedProfile = fallback;
    return fallback;
  }
}

export async function setPlayerName(name) {
  if (!name || !name.trim()) return;
  const clean = name.trim().slice(0, 16);
  try {
    await AsyncStorage.setItem(STORAGE_KEY_NAME, clean);
    if (cachedProfile) {
      cachedProfile.name = clean;
    } else {
      cachedProfile = { id: 'user_' + Date.now(), name: clean };
    }
  } catch (e) {
    // ignore
  }
  return cachedProfile;
}
