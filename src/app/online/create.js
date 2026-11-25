/**
 * Ludo Champion - Create Private Room Route
 */

import React from 'react';
import { router } from 'expo-router';
import CreateRoomScreen from '../../screens/CreateRoomScreen';

export default function CreateRoomRoute() {
  const handleRoomCreated = (room) => {
    router.replace({
      pathname: '/online/waiting-room',
      params: { roomCode: room.roomCode },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <CreateRoomScreen
      onRoomCreated={handleRoomCreated}
      onBack={handleBack}
    />
  );
}
