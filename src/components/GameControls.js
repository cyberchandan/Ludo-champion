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
  musicEnabled = true,
  onToggleSound,
  onToggleMusic,
  onOpenAudioModal,
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
          <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Live Game Status Banner */}
        <View style={[styles.statusBanner, { borderColor: theme.primary }]}>
          <View style={[styles.colorDot, { backgroundColor: theme.primary }]} />
          <Text style={styles.bannerText} numberOfLines={1}>
            {eventMessage || `${currentPlayer?.name}'s Turn`}
          </Text>
        </View>

        <View style={styles.rightActions}>
          {/* Background Music Quick Mute / Unmute */}
          {onToggleMusic && (
            <TouchableOpacity
              onPress={onToggleMusic}
              style={[
                styles.iconBtn,
                !musicEnabled && styles.iconBtnMuted,
              ]}
              accessibilityLabel={musicEnabled ? 'Mute Background Music' : 'Unmute Background Music'}
            >
              <MaterialCommunityIcons
                name={musicEnabled ? 'music' : 'music-off'}
                size={18}
                color={musicEnabled ? '#10B981' : '#94A3B8'}
              />
            </TouchableOpacity>
          )}

          {/* Sound Effects Quick Mute / Unmute */}
          <TouchableOpacity
            onPress={onToggleSound}
            style={[
              styles.iconBtn,
              !soundEnabled && styles.iconBtnMuted,
            ]}
            accessibilityLabel={soundEnabled ? 'Mute Sound Effects' : 'Unmute Sound Effects'}
          >
            <MaterialCommunityIcons
              name={soundEnabled ? 'volume-high' : 'volume-off'}
              size={18}
              color={soundEnabled ? '#FACC15' : '#94A3B8'}
            />
          </TouchableOpacity>

          {/* Detailed Audio Settings Modal Button */}
          {onOpenAudioModal && (
            <TouchableOpacity
              onPress={onOpenAudioModal}
              style={styles.iconBtn}
              accessibilityLabel="Audio & Volume Settings"
            >
              <MaterialCommunityIcons name="tune-vertical" size={18} color="#38BDF8" />
            </TouchableOpacity>
          )}

          {/* Restart Game Button */}
          <TouchableOpacity
            onPress={handleResetPress}
            style={styles.iconBtn}
            accessibilityLabel="Restart Game"
          >
            <MaterialCommunityIcons name="restart" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  statusBanner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    gap: 6,
    minWidth: 100,
  },
  colorDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2937',
    flex: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});
