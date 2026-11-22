/**
 * Ludo Champion - GameControls Component
 * Header navigation, turn announcements, sound mute toggle, and game reset.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLOR_THEMES } from '../game/constants';

export default function GameControls({
  currentPlayer,
  eventMessage,
  soundEnabled = true,
  onToggleSound,
  onResetGame,
  onExitToMenu,
}) {
  const theme = currentPlayer ? COLOR_THEMES[currentPlayer.color] : COLOR_THEMES.RED;

  const handleResetPress = () => {
    Alert.alert(
      'Restart Game?',
      'Are you sure you want to restart this match?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restart', style: 'destructive', onPress: onResetGame },
      ]
    );
  };

  const handleExitPress = () => {
    Alert.alert(
      'Exit Game?',
      'Leave this game and return to the main menu?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: onExitToMenu },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header Buttons */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={handleExitPress}
          style={styles.iconBtn}
          accessibilityLabel="Exit to Menu"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Live Game Status Banner */}
        <View style={[styles.statusBanner, { borderColor: theme.primary }]}>
          <View style={[styles.colorDot, { backgroundColor: theme.primary }]} />
          <Text style={styles.bannerText} numberOfLines={1}>
            {eventMessage || `${currentPlayer?.name}'s Turn`}
          </Text>
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity
            onPress={onToggleSound}
            style={styles.iconBtn}
            accessibilityLabel="Toggle Sound"
          >
            <MaterialCommunityIcons
              name={soundEnabled ? 'volume-high' : 'volume-off'}
              size={22}
              color={soundEnabled ? '#FACC15' : '#9CA3AF'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResetPress}
            style={styles.iconBtn}
            accessibilityLabel="Restart Game"
          >
            <MaterialCommunityIcons name="restart" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBanner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    gap: 8,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2937',
    flex: 1,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
});
