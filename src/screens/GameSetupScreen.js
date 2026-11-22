/**
 * Ludo Champion - Game Setup Screen
 * Configures player count (2, 3, 4), player names, colors, and game mode.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLOR_THEMES, PLAYER_COLORS } from '../game/constants';
import { DEFAULT_PLAYER_SELECTION } from '../game/playerConfig';
import { loadSettings, saveSettings } from '../utils/storage';
import { soundManager } from '../utils/soundManager';

export default function GameSetupScreen({
  isVsComputer = false,
  onStartGame,
  onBack,
}) {
  const [playerCount, setPlayerCount] = useState(4);
  const [playerNames, setPlayerNames] = useState({
    [PLAYER_COLORS.RED]: 'Player 1',
    [PLAYER_COLORS.GREEN]: 'Player 2',
    [PLAYER_COLORS.YELLOW]: 'Player 3',
    [PLAYER_COLORS.BLUE]: 'Player 4',
  });

  useEffect(() => {
    loadSettings().then((s) => {
      if (s && s.lastSelectedPlayerCount) {
        setPlayerCount(s.lastSelectedPlayerCount);
      }
    });
  }, []);

  const handleSelectCount = (count) => {
    soundManager.playClick();
    setPlayerCount(count);
    saveSettings({ lastSelectedPlayerCount: count });
  };

  const handleNameChange = (color, text) => {
    setPlayerNames((prev) => ({
      ...prev,
      [color]: text,
    }));
  };

  const handleStart = () => {
    soundManager.playClick();
    const activeColors = DEFAULT_PLAYER_SELECTION[playerCount];
    onStartGame({
      playerCount,
      colors: activeColors,
      names: playerNames,
      isVsComputer,
    });
  };

  const activeColors = DEFAULT_PLAYER_SELECTION[playerCount] || [];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isVsComputer ? 'VS COMPUTER SETUP' : 'PASS & PLAY SETUP'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Player Count Selector (2, 3, 4) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SELECT NUMBER OF PLAYERS</Text>
          <View style={styles.countSelectorRow}>
            {[2, 3, 4].map((count) => {
              const isSelected = playerCount === count;
              return (
                <TouchableOpacity
                  key={count}
                  activeOpacity={0.8}
                  onPress={() => handleSelectCount(count)}
                  style={[
                    styles.countBtn,
                    isSelected && styles.countBtnActive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      count === 2
                        ? 'numeric-2-box'
                        : count === 3
                        ? 'numeric-3-box'
                        : 'numeric-4-box'
                    }
                    size={28}
                    color={isSelected ? '#0F172A' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.countBtnText,
                      isSelected && styles.countBtnTextActive,
                    ]}
                  >
                    {count} Players
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Player Names & Color Badges */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>PLAYERS & HOUSES</Text>

          <View style={styles.playersList}>
            {activeColors.map((color, index) => {
              const theme = COLOR_THEMES[color];
              const isBot = isVsComputer && index > 0;

              return (
                <View key={color} style={styles.playerRow}>
                  {/* House Color Dot */}
                  <View style={[styles.colorDisc, { backgroundColor: theme.primary }]}>
                    <MaterialCommunityIcons
                      name={isBot ? 'robot' : 'account'}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>

                  {/* Name Input */}
                  <View style={styles.inputContainer}>
                    <Text style={[styles.colorLabel, { color: theme.primary }]}>
                      {theme.name} House {isBot ? '(Computer Bot)' : ''}
                    </Text>
                    <TextInput
                      style={styles.nameInput}
                      value={isBot ? `Computer (${theme.name})` : playerNames[color]}
                      onChangeText={(txt) => handleNameChange(color, txt)}
                      maxLength={15}
                      placeholder={`Player ${index + 1}`}
                      placeholderTextColor="#64748B"
                      editable={!isBot}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Start Game Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleStart}
          style={styles.startBtn}
        >
          <MaterialCommunityIcons name="play-circle" size={28} color="#0F172A" />
          <Text style={styles.startBtnText}>START MATCH</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 14,
  },
  countSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
    gap: 4,
  },
  countBtnActive: {
    backgroundColor: '#FACC15',
    borderColor: '#EAB308',
  },
  countBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  countBtnTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },
  playersList: {
    gap: 12,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  colorDisc: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 3,
  },
  inputContainer: {
    flex: 1,
  },
  colorLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  nameInput: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    padding: 0,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FACC15',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 10,
    marginTop: 10,
    elevation: 6,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1,
  },
});
