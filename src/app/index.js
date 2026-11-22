/**
 * Ludo Champion - Splash Screen Route
 */

import React from 'react';
import { router } from 'expo-router';
import SplashScreen from '../screens/SplashScreen';

export default function IndexRoute() {
  const handleFinish = () => {
    router.replace('/home');
  };

  return <SplashScreen onFinish={handleFinish} />;
}
