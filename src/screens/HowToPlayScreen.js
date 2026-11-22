/**
 * Ludo Champion - How To Play Screen
 * Comprehensive visual tutorial and rules explanation.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLOR_THEMES } from '../game/constants';
import { soundManager } from '../utils/soundManager';

export default function HowToPlayScreen({ onBack }) {
  const handleBack = () => {
    soundManager.playClick();
    if (onBack) onBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HOW TO PLAY</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Rule 1: Objective */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="bullseye-arrow" size={24} color="#FACC15" />
            <Text style={styles.cardTitle}>1. Game Objective</Text>
          </View>
          <Text style={styles.cardBody}>
            The objective of Ludo is to navigate all four of your colored tokens from your starting
            Yard, around the circular 52-cell track, through your colored Home Lane, and into the
            central Home Destination. The first player to bring all 4 tokens home wins!
          </Text>
        </View>

        {/* Rule 2: Exiting Yard */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="dice-6" size={24} color="#EF4444" />
            <Text style={styles.cardTitle}>2. Leaving The Yard (Rolling a 6)</Text>
          </View>
          <Text style={styles.cardBody}>
            Tokens start trapped inside your Home Yard. You must roll a <Text style={styles.highlight}>6</Text> on
            the dice to deploy a token onto the board starting square. Rolling any number from 1 to 5
            cannot bring a token out of the yard.
          </Text>
        </View>

        {/* Rule 3: The Magic Six */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="cached" size={24} color="#10B981" />
            <Text style={styles.cardTitle}>3. Rolling a 6 Gives a Bonus Turn</Text>
          </View>
          <Text style={styles.cardBody}>
            Whenever you roll a 6, you move a token and immediately earn an{' '}
            <Text style={styles.highlight}>extra dice roll</Text>! However, beware of greed: rolling{' '}
            <Text style={styles.highlight}>three consecutive sixes</Text> forfeits your turn to the next player.
          </Text>
        </View>

        {/* Rule 4: Safe Squares */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="star" size={24} color="#F59E0B" />
            <Text style={styles.cardTitle}>4. Safe Squares (Star Cells)</Text>
          </View>
          <Text style={styles.cardBody}>
            There are 8 designated Safe Squares on the track marked with a{' '}
            <Text style={styles.highlight}>Star</Text> (including each player's starting cell). Tokens resting on
            safe squares are immune to capture, and multiple tokens can safely share them.
          </Text>
        </View>

        {/* Rule 5: Capturing Opponents */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="sword-cross" size={24} color="#3B82F6" />
            <Text style={styles.cardTitle}>5. Capturing Opponent Tokens</Text>
          </View>
          <Text style={styles.cardBody}>
            If your token lands on an opponent's vulnerable token (outside safe squares), you{' '}
            <Text style={styles.highlight}>capture</Text> it! The opponent's token is knocked out and returned
            back to their Yard. Capturing an opponent also awards you an{' '}
            <Text style={styles.highlight}>extra bonus roll</Text>!
          </Text>
        </View>

        {/* Rule 6: Home Lane and Victory */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="trophy" size={24} color="#EC4899" />
            <Text style={styles.cardTitle}>6. Reaching Final Home</Text>
          </View>
          <Text style={styles.cardBody}>
            After completing a full clockwise lap, your tokens enter your exclusive colored Home Lane.
            Only your tokens may enter this lane. To reach the central Home, an{' '}
            <Text style={styles.highlight}>exact dice roll</Text> is required. Reaching home also awards a bonus roll!
          </Text>
        </View>

        {/* Color Houses Overview */}
        <View style={[styles.card, { borderColor: '#475569' }]}>
          <Text style={styles.cardTitle}>House Colors</Text>
          <View style={styles.housesRow}>
            {Object.keys(COLOR_THEMES).map((k) => (
              <View
                key={k}
                style={[styles.housePill, { backgroundColor: COLOR_THEMES[k].primary }]}
              >
                <Text style={styles.houseText}>{COLOR_THEMES[k].name}</Text>
              </View>
            ))}
          </View>
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
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#94A3B8',
  },
  highlight: {
    color: '#FACC15',
    fontWeight: '800',
  },
  housesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  housePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  houseText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
});
