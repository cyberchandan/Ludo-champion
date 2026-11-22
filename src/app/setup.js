/**
 * Ludo Champion - Game Setup Route
 */

import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import GameSetupScreen from '../screens/GameSetupScreen';

export default function SetupRoute() {
  const params = useLocalSearchParams();
  const isVsComputer = params.vsComputer === 'true';

  const handleStartGame = (config) => {
    router.push({
      pathname: '/game',
      params: {
        playerCount: String(config.playerCount),
        colors: JSON.stringify(config.colors),
        names: JSON.stringify(config.names),
        vsComputer: String(config.isVsComputer),
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <GameSetupScreen
      isVsComputer={isVsComputer}
      onStartGame={handleStartGame}
      onBack={handleBack}
    />
  );
}
