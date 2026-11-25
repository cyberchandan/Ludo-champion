/**
 * Ludo Champion - PlayerInfo Component
 * Displays player card, active turn highlight, tokens home progress, and status.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLOR_THEMES } from '../game/constants';

export default function PlayerInfo({
  player,
  isCurrentTurn = false,
  showHomeCount = true,
  diceComponent = null,
  rolledValue = null,
  isSpeaking = false,
  isVoiceMuted = false,
}) {
  if (!player) return null;

  const theme = COLOR_THEMES[player.color] || COLOR_THEMES.RED;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Active player card pulsation
  useEffect(() => {
    let loop;
    if (isCurrentTurn) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (loop) loop.stop();
    };
  }, [isCurrentTurn, pulseAnim]);

  const homeCount = player.tokens ? player.tokens.filter((t) => t.step === 56).length : 0;

  return (
    <Animated.View
      style={[
        styles.card,
        isCurrentTurn && [styles.activeCard, { borderColor: theme.primary }],
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <View style={styles.leftSection}>
        {/* Color Badge / Avatar */}
        <View style={styles.avatarWrapper}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.primary },
              isSpeaking && styles.avatarSpeaking,
            ]}
          >
            <MaterialCommunityIcons
              name={player.hasFinished ? 'trophy' : 'account'}
              size={18}
              color="#FFFFFF"
            />
          </View>
          {isVoiceMuted && (
            <View style={styles.micMutedBadge}>
              <MaterialCommunityIcons name="microphone-off" size={9} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.nameBlock}>
          <Text style={styles.playerName} numberOfLines={1}>
            {player.name}
          </Text>
          {showHomeCount && (
            <View style={styles.homeBadge}>
              <MaterialCommunityIcons name="home-circle" size={13} color="#4B5563" />
              <Text style={styles.homeText}>{homeCount}/4 Home</Text>
            </View>
          )}
        </View>
      </View>

      {/* Right side: Dice, Rolled Value Badge, or Active Turn Pill */}
      <View style={styles.rightSection}>
        {diceComponent ? (
          diceComponent
        ) : rolledValue ? (
          <View style={[styles.rolledPill, { borderColor: theme.primary }]}>
            <MaterialCommunityIcons
              name={`dice-${Math.min(6, Math.max(1, rolledValue))}`}
              size={16}
              color={theme.primary}
            />
            <Text style={[styles.rolledPillText, { color: theme.primary }]}>{rolledValue}</Text>
          </View>
        ) : isCurrentTurn ? (
          <View style={[styles.turnPill, { backgroundColor: theme.primary }]}>
            <Text style={styles.turnPillText}>TURN</Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    minWidth: 140,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  activeCard: {
    borderWidth: 2.5,
    backgroundColor: '#FAFAFA',
    elevation: 6,
    shadowOpacity: 0.25,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  avatarSpeaking: {
    borderWidth: 2.5,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  micMutedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  nameBlock: {
    justifyContent: 'center',
  },
  playerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
    maxWidth: 90,
  },
  homeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  homeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  rightSection: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  turnPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  turnPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rolledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  rolledPillText: {
    fontSize: 11,
    fontWeight: '900',
  },
});
