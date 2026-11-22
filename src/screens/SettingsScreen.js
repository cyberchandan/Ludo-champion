/**
 * Ludo Champion - Settings Screen
 * Manages sound, music, vibration, rules, stats reset, and Google Play Families compliance.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { loadSettings, saveSettings, resetStatistics } from '../utils/storage';
import { soundManager } from '../utils/soundManager';

export default function SettingsScreen({ onBack }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [threeSixesRule, setThreeSixesRule] = useState(true);

  useEffect(() => {
    loadSettings().then((s) => {
      if (s) {
        setSoundEnabled(s.soundEnabled !== false);
        setMusicEnabled(s.musicEnabled !== false);
        setVibrationEnabled(s.vibrationEnabled !== false);
        setThreeSixesRule(s.threeSixesRule !== false);
      }
    });
  }, []);

  const handleToggleSound = (val) => {
    setSoundEnabled(val);
    saveSettings({ soundEnabled: val });
    soundManager.updateSettings({ soundEnabled: val });
    if (val) soundManager.playClick();
  };

  const handleToggleMusic = (val) => {
    setMusicEnabled(val);
    saveSettings({ musicEnabled: val });
    if (soundEnabled) soundManager.playClick();
  };

  const handleToggleVibration = (val) => {
    setVibrationEnabled(val);
    saveSettings({ vibrationEnabled: val });
    soundManager.updateSettings({ vibrationEnabled: val });
    if (soundEnabled) soundManager.playClick();
  };

  const handleToggleRule = (val) => {
    setThreeSixesRule(val);
    saveSettings({ threeSixesRule: val });
    if (soundEnabled) soundManager.playClick();
  };

  const handleResetStats = () => {
    Alert.alert(
      'Reset Statistics',
      'Are you sure you want to reset all game records and win statistics? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: async () => {
            await resetStatistics();
            if (soundEnabled) soundManager.playClick();
            Alert.alert('Reset Complete', 'Your statistics have been reset.');
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (soundEnabled) soundManager.playClick();
    if (onBack) onBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Audio & Haptics Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>AUDIO & FEEDBACK</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="volume-high" size={22} color="#FACC15" />
              <View>
                <Text style={styles.settingLabel}>Sound Effects</Text>
                <Text style={styles.settingDesc}>Dice rolls, token movement, captures</Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={handleToggleSound}
              trackColor={{ false: '#334155', true: '#FACC15' }}
              thumbColor={soundEnabled ? '#0F172A' : '#94A3B8'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="music" size={22} color="#10B981" />
              <View>
                <Text style={styles.settingLabel}>Background Music</Text>
                <Text style={styles.settingDesc}>Ambient royal theme music</Text>
              </View>
            </View>
            <Switch
              value={musicEnabled}
              onValueChange={handleToggleMusic}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor={musicEnabled ? '#0F172A' : '#94A3B8'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="vibrate" size={22} color="#3B82F6" />
              <View>
                <Text style={styles.settingLabel}>Vibration (Haptics)</Text>
                <Text style={styles.settingDesc}>Tactile vibration on moves and captures</Text>
              </View>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={handleToggleVibration}
              trackColor={{ false: '#334155', true: '#3B82F6' }}
              thumbColor={vibrationEnabled ? '#0F172A' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Gameplay Rules Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>GAMEPLAY RULES</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="numeric-3-box-multiple" size={22} color="#EC4899" />
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.settingLabel}>3 Consecutive Sixes Rule</Text>
                <Text style={styles.settingDesc}>Forfeit turn if player rolls 3 sixes in a row</Text>
              </View>
            </View>
            <Switch
              value={threeSixesRule}
              onValueChange={handleToggleRule}
              trackColor={{ false: '#334155', true: '#EC4899' }}
              thumbColor={threeSixesRule ? '#0F172A' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Data & Privacy Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>DATA & RECORDS</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleResetStats}
            style={styles.dangerRow}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF4444" />
            <Text style={styles.dangerText}>Reset Player Statistics</Text>
          </TouchableOpacity>
        </View>

        {/* About & Google Play Compliance Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ABOUT & PRIVACY</Text>

          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Game</Text>
            <Text style={styles.aboutValue}>Ludo Champion</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0 (Release)</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Privacy Policy</Text>
            <Text style={[styles.aboutValue, { color: '#60A5FA' }]}>
              Google Play Families Compliant
            </Text>
          </View>

          <Text style={styles.privacyNote}>
            Ludo Champion does not collect, store, or transmit any personally identifiable
            information. Gameplay is completely offline and kid/family-friendly.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
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
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  settingDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 10,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  dangerText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  aboutLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  aboutValue: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '700',
  },
  privacyNote: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 10,
  },
});
