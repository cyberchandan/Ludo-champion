/**
 * Ludo Champion - Game Screen Route
 */

import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import GameScreen from '../screens/GameScreen';

export default function GameRoute() {
  const params = useLocalSearchParams();

  const isMultiplayer = params.isMultiplayer === 'true';
  const roomCode = params.roomCode;
  const initialGameState = params.initialGameState ? JSON.parse(params.initialGameState) : null;

  const playerCount = params.playerCount ? parseInt(params.playerCount, 10) : 4;
  const colors = params.colors ? JSON.parse(params.colors) : undefined;
  const names = params.names ? JSON.parse(params.names) : undefined;
  const isVsComputer = params.vsComputer === 'true';

  const handleExitToMenu = () => {
    router.replace('/home');
  };

  return (
    <GameScreen
      isMultiplayer={isMultiplayer}
      roomCode={roomCode}
      initialGameState={initialGameState}
      playerCount={playerCount}
      customOptions={{ colors, names }}
      isVsComputer={isVsComputer}
      onExitToMenu={handleExitToMenu}
    />
  );
}
