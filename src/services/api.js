/**
 * Ludo Champion - Multiplayer & Voice REST API Client
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const STORAGE_KEY_SERVER_URL = '@ludo_server_url';

export function getDefaultServerUrl() {
  // 1. Auto-detect host IP from Expo Metro bundler
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.experienceUrl;

  if (hostUri) {
    const ip = String(hostUri).split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1' && ip !== 'undefined') {
      return `http://${ip}:3000`;
    }
  }

  // 2. Physical Android Wi-Fi fallback (configured for user's network)
  if (Platform.OS === 'android') {
    return 'http://192.168.31.221:3000';
  }

  // 3. Web or desktop
  return 'http://localhost:3000';
}

let cachedServerUrl = null;

export async function getServerUrl() {
  if (cachedServerUrl) return cachedServerUrl;
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_SERVER_URL);
    if (saved && !saved.includes('10.0.2.2')) {
      cachedServerUrl = saved;
      return saved;
    }
  } catch (e) {
    // ignore
  }

  const defaultUrl = getDefaultServerUrl();
  cachedServerUrl = defaultUrl;
  return defaultUrl;
}

export async function setServerUrl(url) {
  if (!url) return;
  const clean = url.trim().replace(/\/+$/, '');
  cachedServerUrl = clean;
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SERVER_URL, clean);
  } catch (e) {
    // ignore
  }
}

/**
 * Creates a private room
 */
export async function apiCreateRoom({ hostName, hostId, avatar = 'account' }) {
  const baseUrl = await getServerUrl();
  const res = await fetch(`${baseUrl}/api/rooms/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostName, hostId, avatar }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to create room');
  }
  return data;
}

/**
 * Joins a private room using a 6-character code
 */
export async function apiJoinRoom({ roomCode, playerName, playerId, avatar = 'account' }) {
  const baseUrl = await getServerUrl();
  const res = await fetch(`${baseUrl}/api/rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomCode: roomCode?.trim().toUpperCase(),
      playerName,
      playerId,
      avatar,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to join room');
  }
  return data;
}

/**
 * Gets details of a room
 */
export async function apiGetRoom(roomCode) {
  const baseUrl = await getServerUrl();
  const res = await fetch(`${baseUrl}/api/rooms/${roomCode?.trim().toUpperCase()}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Room not found');
  }
  return data.room;
}

/**
 * Requests the host to start the game
 */
export async function apiStartGame(roomCode, hostId) {
  const baseUrl = await getServerUrl();
  const res = await fetch(`${baseUrl}/api/rooms/${roomCode?.trim().toUpperCase()}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to start game');
  }
  return data.room;
}

/**
 * Requests a secure LiveKit voice JWT token
 */
export async function apiGetVoiceToken({ roomCode, playerId, playerName }) {
  const baseUrl = await getServerUrl();
  const res = await fetch(`${baseUrl}/api/voice/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomCode: roomCode?.trim().toUpperCase(),
      playerId,
      playerName,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to get voice token');
  }
  return data;
}
