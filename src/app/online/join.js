/**
 * Ludo Champion - Join Private Room Route
 */

import React from 'react';
import { router } from 'expo-router';
import JoinRoomScreen from '../../screens/JoinRoomScreen';

export default function JoinRoomRoute() {
  const handleJoinedRoom = (room) => {
    router.replace({
      pathname: '/online/waiting-room',
      params: { roomCode: room.roomCode },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <JoinRoomScreen
      onJoinedRoom={handleJoinedRoom}
      onBack={handleBack}
    />
  );
}
