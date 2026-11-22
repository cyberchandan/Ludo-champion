/**
 * Ludo Champion - Dice Component
 * Renders an animated 3D-styled physical dice with traditional pip layouts and spin effects.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing, Text } from 'react-native';
import { COLOR_THEMES } from '../game/constants';

export default function Dice({
  value = 1,
  isRolling = false,
  disabled = false,
  onRoll,
  playerColor = 'RED',
  size = 54,
}) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [displayValue, setDisplayValue] = useState(value || 1);

  const theme = COLOR_THEMES[playerColor] || COLOR_THEMES.RED;

  // Sync display value when not rolling
  useEffect(() => {
    if (!isRolling && value) {
      setDisplayValue(value);
    }
  }, [value, isRolling]);

  // Rolling animation
  useEffect(() => {
    let interval;
    if (isRolling) {
      // Fast cycling of face numbers during rolling
      interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 70);

      // Spin and wobble animation
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.25,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 450,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => {
        spinAnim.setValue(0);
      });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRolling, scaleAnim, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '360deg'],
  });

  const pipSize = size * 0.17;
  const pipColor = displayValue === 6 ? '#DC2626' : '#1F2937'; // Classic red for 6!

  // Render pips based on standard 3x3 dice matrix
  const renderPips = (val) => {
    const pipsMatrix = {
      1: [0, 0, 0, 0, 1, 0, 0, 0, 0],
      2: [1, 0, 0, 0, 0, 0, 0, 0, 1],
      3: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      4: [1, 0, 1, 0, 0, 0, 1, 0, 1],
      5: [1, 0, 1, 0, 1, 0, 1, 0, 1],
      6: [1, 0, 1, 1, 0, 1, 1, 0, 1],
    };

    const pattern = pipsMatrix[val] || pipsMatrix[1];

    return (
      <View style={styles.pipsGrid}>
        {pattern.map((hasPip, idx) => (
          <View key={idx} style={styles.pipCell}>
            {hasPip === 1 && (
              <View
                style={[
                  styles.pip,
                  {
                    width: pipSize,
                    height: pipSize,
                    borderRadius: pipSize / 2,
                    backgroundColor: pipColor,
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || isRolling}
      onPress={onRoll}
      style={[styles.wrapper, disabled && styles.disabledWrapper]}
    >
      <Animated.View
        style={[
          styles.diceContainer,
          {
            width: size,
            height: size,
            borderRadius: size * 0.22,
            borderColor: theme.primary,
            transform: [{ rotate: spin }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Shiny corner highlight */}
        <View style={styles.highlight} />
        {renderPips(displayValue)}
      </Animated.View>
      {!disabled && !isRolling && (
        <View style={[styles.rollBadge, { backgroundColor: theme.primary }]}>
          <Text style={styles.rollText}>ROLL</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledWrapper: {
    opacity: 0.45,
  },
  diceContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  highlight: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    height: '35%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  pipsGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pipCell: {
    width: '33.33%',
    height: '33.33%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pip: {
    elevation: 2,
  },
  rollBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rollText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
