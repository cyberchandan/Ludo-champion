/**
 * Ludo Champion - Home Screen Route
 */

import React from 'react';
import { router } from 'expo-router';
import HomeScreen from '../screens/HomeScreen';

export default function HomeRoute() {
  const handlePlayOffline = () => {
    router.push({ pathname: '/setup', params: { vsComputer: 'false' } });
  };

  const handlePlayComputer = () => {
    router.push({ pathname: '/setup', params: { vsComputer: 'true' } });
  };

  const handlePlayFriends = () => {
    router.push('/online');
  };

  const handleHowToPlay = () => {
    router.push('/how-to-play');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <HomeScreen
      onPlayOffline={handlePlayOffline}
      onPlayComputer={handlePlayComputer}
      onPlayFriends={handlePlayFriends}
      onHowToPlay={handleHowToPlay}
      onSettings={handleSettings}
    />
  );
}
