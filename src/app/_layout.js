/**
 * Ludo Champion - Expo Router Root Layout
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { soundManager } from '../utils/soundManager';
import { loadSettings } from '../utils/storage';

export default function RootLayout() {
  useEffect(() => {
    // Initialize sound and settings on app start
    loadSettings().then((settings) => {
      soundManager.init(settings);
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#0F172A" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#0F172A' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="setup" />
        <Stack.Screen name="game" />
        <Stack.Screen name="how-to-play" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="online/index" />
        <Stack.Screen name="online/create" />
        <Stack.Screen name="online/join" />
        <Stack.Screen name="online/waiting-room" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
