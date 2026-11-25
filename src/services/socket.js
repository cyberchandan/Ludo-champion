/**
 * Ludo Champion - Socket.IO Singleton Client
 */

import { io } from 'socket.io-client';
import { getServerUrl } from './api';

let socketInstance = null;
let currentServerUrl = null;

export async function getSocket() {
  const url = await getServerUrl();

  if (!socketInstance || currentServerUrl !== url) {
    if (socketInstance) {
      socketInstance.disconnect();
    }

    currentServerUrl = url;
    console.log(`[SocketClient] Connecting to: ${url}`);

    socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      console.log(`[SocketClient] Connected with ID: ${socketInstance.id}`);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn(`[SocketClient] Connection error: ${err.message}`);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log(`[SocketClient] Disconnected: ${reason}`);
    });
  }

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    currentServerUrl = null;
  }
}
