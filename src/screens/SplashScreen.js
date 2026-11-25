/**
 * Ludo Champion - Splash Screen
 * Features animated dice, original branding, loading bar, and automatic navigation.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLOR_THEMES } from '../game/constants';

const { width } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const diceRotate = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Logo pop-in animation
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();

    // 2. Dice spin loop
    Animated.loop(
      Animated.timing(diceRotate, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // 3. Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
    }).start(() => {
      if (onFinish) {
        onFinish();
      }
    });
  }, [diceRotate, logoScale, progressAnim, onFinish]);

  const spin = diceRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Background Decorative Rings */}
      <View style={[styles.bgRing, styles.ringRed]} />
      <View style={[styles.bgRing, styles.ringGreen]} />
      <View style={[styles.bgRing, styles.ringYellow]} />
      <View style={[styles.bgRing, styles.ringBlue]} />

      <Animated.View style={[styles.logoSection, { transform: [{ scale: logoScale }] }]}>
        {/* Animated Dice Emblem */}
        <Animated.View style={[styles.diceEmblem, { transform: [{ rotate: spin }] }]}>
          <MaterialCommunityIcons name="dice-5" size={72} color="#FACC15" />
        </Animated.View>

        {/* Title & Tagline */}
        <Text style={styles.gameTitle}>LUDO</Text>
        <Text style={styles.gameSubtitle}>CHAMPION</Text>
        <Text style={styles.tagline}>The Ultimate Royal Board Experience by chandan</Text>

        {/* Color Badges Row */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, { backgroundColor: COLOR_THEMES.RED.primary }]} /> 
          <View style={[styles.dot, { backgroundColor: COLOR_THEMES.GREEN.primary }]} />
          <View style={[styles.dot, { backgroundColor: COLOR_THEMES.YELLOW.primary }]} />
          <View style={[styles.dot, { backgroundColor: COLOR_THEMES.BLUE.primary }]} />
        </View>
      </Animated.View>

      {/* Loading Progress Bar */}
      <View style={styles.loadingContainer}>
        <View style={styles.progressBarTrack}>
          <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
        </View>
        <Text style={styles.loadingText}>Loading Game Assets...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  bgRing: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.12,
  },
  ringRed: {
    width: 280,
    height: 280,
    top: -40,
    left: -40,
    backgroundColor: '#EF4444',
  },
  ringGreen: {
    width: 240,
    height: 240,
    top: -20,
    right: -40,
    backgroundColor: '#10B981',
  },
  ringYellow: {
    width: 260,
    height: 260,
    bottom: 80,
    right: -50,
    backgroundColor: '#F59E0B',
  },
  ringBlue: {
    width: 240,
    height: 240,
    bottom: 60,
    left: -40,
    backgroundColor: '#3B82F6',
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diceEmblem: {
    marginBottom: 16,
    elevation: 12,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  gameTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 6,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  gameSubtitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FACC15',
    letterSpacing: 8,
    marginTop: -4,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1,
    marginTop: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  loadingContainer: {
    width: width * 0.75,
    alignItems: 'center',
    gap: 8,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FACC15',
    borderRadius: 3,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
