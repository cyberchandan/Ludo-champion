/**
 * Ludo Champion - GameResultModal Component
 * Winner celebration screen with crown, ranks, Play Again, and Main Menu options.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLOR_THEMES } from '../game/constants';

export default function GameResultModal({
  visible = false,
  winner,
  rankings = [],
  players = [],
  onPlayAgain,
  onMainMenu,
}) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const winnerTheme = winner ? COLOR_THEMES[winner.color] : COLOR_THEMES.RED;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 3000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
    }
  }, [visible, scaleAnim, rotateAnim]);

  const trophyRotation = rotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-8deg', '8deg', '-8deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Header Crown & Trophy */}
          <Animated.View style={{ transform: [{ rotate: trophyRotation }] }}>
            <View style={[styles.trophyCircle, { backgroundColor: winnerTheme.primary }]}>
              <MaterialCommunityIcons name="trophy-award" size={56} color="#FFD700" />
            </View>
          </Animated.View>

          <Text style={styles.title}>WINNER!</Text>

          <View style={[styles.winnerBadge, { backgroundColor: winnerTheme.light }]}>
            <Text style={[styles.winnerText, { color: winnerTheme.dark }]}>
              {winner?.name || 'Player'}
            </Text>
          </View>

          <Text style={styles.subText}>
            All 4 tokens brought home successfully!
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onPlayAgain}
              style={[styles.primaryBtn, { backgroundColor: winnerTheme.primary }]}
            >
              <MaterialCommunityIcons name="play-circle" size={24} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>PLAY AGAIN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onMainMenu}
              style={styles.secondaryBtn}
            >
              <MaterialCommunityIcons name="home" size={20} color="#4B5563" />
              <Text style={styles.secondaryBtnText}>MAIN MENU</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  trophyCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFD700',
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 14,
    letterSpacing: 1,
  },
  winnerBadge: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  winnerText: {
    fontSize: 18,
    fontWeight: '800',
  },
  subText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  secondaryBtnText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '700',
  },
});
