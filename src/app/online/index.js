/**
 * Ludo Champion - Online Menu Route
 */

import React from 'react';
import { router } from 'expo-router';
import OnlineMenuScreen from '../../screens/OnlineMenuScreen';

export default function OnlineMenuRoute() {
  const handleCreateRoom = () => {
    router.push('/online/create');
  };

  const handleJoinRoom = () => {
    router.push('/online/join');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <OnlineMenuScreen
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      onBack={handleBack}
    />
  );
}
