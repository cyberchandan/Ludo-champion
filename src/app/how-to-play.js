/**
 * Ludo Champion - How To Play Route
 */

import React from 'react';
import { router } from 'expo-router';
import HowToPlayScreen from '../screens/HowToPlayScreen';

export default function HowToPlayRoute() {
  return <HowToPlayScreen onBack={() => router.back()} />;
}
