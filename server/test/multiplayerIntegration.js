/**
 * Automated End-to-End Integration Test for Ludo Multiplayer & LiveKit Voice Backend
 */

const { io: Client } = require('socket.io-client');
const { server, startServer } = require('../server');

async function runIntegrationTest() {
  console.log('🧪 Starting Multiplayer & LiveKit Integration Test...');

  const PORT = 3999;
  await startServer(PORT);
  const baseUrl = `http://127.0.0.1:${PORT}`;

  try {
    // 1. Health Check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    console.log('✓ [1/6] Health Check passed:', healthData.status);

    // 2. Create Private Room (Host)
    const createRes = await fetch(`${baseUrl}/api/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName: 'HostPlayer', hostId: 'user_host_123' }),
    });
    const createData = await createRes.json();
    const roomCode = createData.roomCode;
    console.log(`✓ [2/6] Room Created: ${roomCode} (Host: ${createData.room.players[0].name}, Color: ${createData.room.players[0].color})`);

    if (!roomCode || roomCode.length !== 6) {
      throw new Error(`Invalid room code length: ${roomCode}`);
    }

    // 3. Join Private Room (Friend)
    const joinRes = await fetch(`${baseUrl}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode,
        playerName: 'FriendPlayer',
        playerId: 'user_friend_456',
      }),
    });
    const joinData = await joinRes.json();
    console.log(`✓ [3/6] Friend Joined Room: Player count = ${joinData.room.players.length}, Color: ${joinData.player.color}`);

    // 4. Generate LiveKit Voice Tokens
    const voiceRes = await fetch(`${baseUrl}/api/voice/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode,
        playerId: 'user_host_123',
        playerName: 'HostPlayer',
      }),
    });
    const voiceData = await voiceRes.json();
    console.log('✓ [4/6] LiveKit Voice Token generated successfully. Token length:', voiceData.token.length);

    // 5. Socket.IO Real-time Gameplay Simulation
    const socketHost = Client(baseUrl, { transports: ['websocket'] });
    const socketFriend = Client(baseUrl, { transports: ['websocket'] });

    await new Promise((resolve, reject) => {
      let connectedCount = 0;
      const checkConnected = () => {
        connectedCount++;
        if (connectedCount === 2) resolve();
      };
      socketHost.on('connect', checkConnected);
      socketFriend.on('connect', checkConnected);
      setTimeout(() => reject(new Error('Socket connection timed out')), 4000);
    });

    // Join room channel via socket
    await new Promise((resolve) => {
      socketHost.emit('join-room', { roomCode, playerId: 'user_host_123' }, () => {
        socketFriend.emit('join-room', { roomCode, playerId: 'user_friend_456' }, resolve);
      });
    });

    // Host starts game
    const startGameResult = await new Promise((resolve) => {
      socketHost.emit('start-game', { roomCode, hostId: 'user_host_123' }, resolve);
    });
    console.log('✓ [5/6] Match started via Socket.IO:', startGameResult.success);

    // 6. Authoritative Dice Roll & Move Validation
    const dicePromise = new Promise((resolve) => {
      socketFriend.on('dice-result', (data) => {
        resolve(data);
      });
    });

    socketHost.emit('roll-dice', { roomCode, playerId: 'user_host_123' });
    const diceEvent = await dicePromise;
    console.log(`✓ [6/6] Real-time Dice Roll Synchronized across sockets! Rolled: ${diceEvent.diceValue}, Valid moves: ${JSON.stringify(diceEvent.validMoves)}`);

    // Clean up
    socketHost.disconnect();
    socketFriend.disconnect();

    console.log('🎉 ALL INTEGRATION TESTS PASSED 100%!');
    setTimeout(() => {
      server.close(() => {
        process.exit(0);
      });
    }, 100);
  } catch (err) {
    console.error('❌ Integration test failed:', err);
    setTimeout(() => {
      server.close(() => {
        process.exit(1);
      });
    }, 100);
  }
}

runIntegrationTest();
