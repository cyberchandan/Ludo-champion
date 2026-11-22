/**
 * Ludo Champion - Game Screen Route
 */

import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import GameScreen from '../screens/GameScreen';

export default function GameRoute() {
  const params = useLocalSearchParams();

  const playerCount = params.playerCount ? parseInt(params.playerCount, 10) : 4;
  const colors = params.colors ? JSON.parse(params.colors) : undefined;
  const names = params.names ? JSON.parse(params.names) : undefined;
  const isVsComputer = params.vsComputer === 'true';

  const handleExitToMenu = () => {
    router.replace('/home');
  };

  return (
    <GameScreen
      playerCount={playerCount}
      customOptions={{ colors, names }}
      isVsComputer={isVsComputer}
      onExitToMenu={handleExitToMenu}
    />
  );
}
