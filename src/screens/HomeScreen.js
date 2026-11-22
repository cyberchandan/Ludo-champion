/**
 * Ludo Champion - Home Screen
 * Displays logo, Offline Play, Computer Play, How To Play, Settings, and Statistics.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { loadStatistics } from '../utils/storage';
import { COLOR_THEMES } from '../game/constants';
import { soundManager } from '../utils/soundManager';

const { width } = Dimensions.get('window');

export default function HomeScreen({
  onPlayOffline,
  onPlayComputer,
  onHowToPlay,
  onSettings,
}) {
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    totalWinsByColor: { RED: 0, GREEN: 0, YELLOW: 0, BLUE: 0 },
    capturesMade: 0,
  });

  useEffect(() => {
    loadStatistics().then((s) => {
      if (s) setStats(s);
    });
  }, []);

  const handlePress = (callback) => {
    soundManager.playClick();
    if (callback) callback();
  };

  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Banner / Logo Section */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <MaterialCommunityIcons name="dice-multiple" size={36} color="#FFD700" />
        </View>
        <Text style={styles.title}>LUDO CHAMPION</Text>
        <Text style={styles.subtitle}>Royal Indian Board Game</Text>
      </View>

      {/* Main Game Menu Cards */}
      <View style={styles.menuSection}>
        {/* Play Offline Pass & Play */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handlePress(onPlayOffline)}
          style={[styles.menuCard, styles.playCard]}
        >
          <View style={styles.menuIconContainer}>
            <MaterialCommunityIcons name="account-group" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuCardTitle}>PASS & PLAY</Text>
            <Text style={styles.menuCardSubtitle}>2 - 4 Players Local Offline</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Play with Computer (AI Bot) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handlePress(onPlayComputer)}
          style={[styles.menuCard, styles.computerCard]}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: '#0D9488' }]}>
            <MaterialCommunityIcons name="robot" size={30} color="#FFFFFF" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuCardTitle}>PLAY VS COMPUTER</Text>
            <Text style={styles.menuCardSubtitle}>Practice against smart AI</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* How To Play */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handlePress(onHowToPlay)}
          style={[styles.menuCard, styles.infoCard]}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: '#475569' }]}>
            <MaterialCommunityIcons name="book-open-variant" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuCardTitle}>HOW TO PLAY</Text>
            <Text style={styles.menuCardSubtitle}>Rules, safe cells & strategy</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={26} color="#94A3B8" />
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handlePress(onSettings)}
          style={[styles.menuCard, styles.settingsCard]}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: '#334155' }]}>
            <MaterialCommunityIcons name="cog" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuCardTitle}>SETTINGS</Text>
            <Text style={styles.menuCardSubtitle}>Sound, vibration & rules</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={26} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Local Player Statistics Card */}
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <MaterialCommunityIcons name="trophy-variant" size={22} color="#F59E0B" />
          <Text style={styles.statsTitle}>PLAYER RECORD</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.gamesPlayed}</Text>
            <Text style={styles.statLabel}>Played</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#10B981' }]}>{stats.gamesWon}</Text>
            <Text style={styles.statLabel}>Victories</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#F59E0B' }]}>{winRate}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#EF4444' }]}>{stats.capturesMade}</Text>
            <Text style={styles.statLabel}>Captures</Text>
          </View>
        </View>

        {/* Wins by Color Bar */}
        <View style={styles.colorDistribution}>
          <Text style={styles.distributionTitle}>Wins by House Color</Text>
          <View style={styles.colorPillsRow}>
            {Object.keys(COLOR_THEMES).map((cKey) => {
              const theme = COLOR_THEMES[cKey];
              const count = stats.totalWinsByColor?.[cKey] || 0;
              return (
                <View
                  key={cKey}
                  style={[styles.colorPill, { backgroundColor: theme.primary }]}
                >
                  <Text style={[styles.colorPillText, { color: theme.contrastText }]}>
                    {theme.name}: {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
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
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#FACC15',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 2.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginTop: 2,
  },
  menuSection: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  playCard: {
    backgroundColor: '#2563EB',
  },
  computerCard: {
    backgroundColor: '#0F766E',
  },
  infoCard: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingsCard: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  menuCardSubtitle: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 2,
  },
  statsCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  colorDistribution: {
    marginTop: 14,
  },
  distributionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
  },
  colorPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    elevation: 2,
  },
  colorPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
