/**
 * Ludo Champion - Waiting Room Route
 */

import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import WaitingRoomScreen from '../../screens/WaitingRoomScreen';

export default function WaitingRoomRoute() {
  const params = useLocalSearchParams();
  const roomCode = params.roomCode;

  const handleGameStarted = (room, gameState) => {
    router.replace({
      pathname: '/game',
      params: {
        isMultiplayer: 'true',
        roomCode: room.roomCode,
        initialGameState: JSON.stringify(gameState),
      },
    });
  };

  const handleLeaveRoom = () => {
    router.replace('/online');
  };

  return (
    <WaitingRoomScreen
      roomCode={roomCode}
      onGameStarted={handleGameStarted}
      onLeaveRoom={handleLeaveRoom}
    />
  );
}
