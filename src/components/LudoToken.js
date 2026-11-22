/**
 * Ludo Champion - LudoToken Component
 * Renders an interactive 3D-styled pawn token with animated selection glow.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLOR_THEMES } from '../game/constants';

export default function LudoToken({
  colorKey,
  size = 22,
  isSelectable = false,
  onPress,
  tokenIndex = 0,
}) {
  const theme = COLOR_THEMES[colorKey] || COLOR_THEMES.RED;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation when valid for a move
  useEffect(() => {
    let loop;
    if (isSelectable) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 450,
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
  }, [isSelectable, pulseAnim]);

  const tokenComponent = (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      {/* Outer Glow when selectable */}
      {isSelectable && (
        <View
          style={[
            styles.glowRing,
            {
              width: size * 1.5,
              height: size * 1.5,
              borderRadius: (size * 1.5) / 2,
              borderColor: '#FACC15',
            },
          ]}
        />
      )}

      {/* Token Shadow */}
      <View
        style={[
          styles.shadow,
          {
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: (size * 0.9) / 2,
          },
        ]}
      />

      {/* Main Token Disc */}
      <View
        style={[
          styles.outerDisc,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.primary,
            borderColor: '#FFFFFF',
          },
        ]}
      >
        {/* Specular 3D Highlight Ring */}
        <View
          style={[
            styles.innerRing,
            {
              width: size * 0.65,
              height: size * 0.65,
              borderRadius: (size * 0.65) / 2,
              backgroundColor: theme.accent,
              borderColor: theme.dark,
            },
          ]}
        >
          {/* Center Crown / Pin */}
          <View
            style={[
              styles.centerPawn,
              {
                width: size * 0.3,
                height: size * 0.3,
                borderRadius: (size * 0.3) / 2,
                backgroundColor: '#FFFFFF',
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );

  if (isSelectable) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.touchable}
      >
        {tokenComponent}
      </TouchableOpacity>
    );
  }

  return tokenComponent;
}

const styles = StyleSheet.create({
  touchable: {
    zIndex: 99,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 3,
    backgroundColor: 'rgba(250, 204, 21, 0.4)',
  },
  shadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.3)',
    top: 3,
  },
  outerDisc: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  innerRing: {
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPawn: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
  },
});
