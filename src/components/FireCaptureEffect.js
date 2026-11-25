/**
 * Ludo Champion - FireCaptureEffect Component
 * Spectacular animated fire blast explosion rendered on the board
 * when a player captures ("cuts") an opponent's token.
 * Features:
 * - Expanding fiery shockwave blast ring
 * - Dancing flame layers (red, orange, yellow core)
 * - Fiery particle sparks exploding outward
 * - Floating "🔥 KNOCKOUT!" and "-1 TOKEN" disappearing points animation
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Number of spark particles radiating from center
const PARTICLE_COUNT = 8;

export default function FireCaptureEffect({
  x = 0,
  y = 0,
  cellSize = 24,
  onComplete,
}) {
  const blastScale = useRef(new Animated.Value(0.2)).current;
  const blastOpacity = useRef(new Animated.Value(1)).current;
  const flameScale = useRef(new Animated.Value(0.2)).current;
  const flameRotate = useRef(new Animated.Value(0)).current;
  const badgeTranslateY = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.5)).current;
  const pointsTranslateY = useRef(new Animated.Value(0)).current;
  const pointsOpacity = useRef(new Animated.Value(1)).current;
  const charredOpacity = useRef(new Animated.Value(0.85)).current;
  const smokeY = useRef(new Animated.Value(0)).current;
  const smokeOpacity = useRef(new Animated.Value(0)).current;

  // Spark particle animations
  const particleAnims = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      dist: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    // 0. Charred ground mark fade
    Animated.timing(charredOpacity, {
      toValue: 0,
      duration: 1000,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();

    // Rising smoke wisp
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(smokeY, {
          toValue: -24,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(smokeOpacity, {
            toValue: 0.75,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(smokeOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // 1. Shockwave blast ring
    Animated.timing(blastScale, {
      toValue: 2.8,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(blastOpacity, {
      toValue: 0,
      duration: 650,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();

    // 2. Flame explosion & flicker
    Animated.sequence([
      Animated.spring(flameScale, {
        toValue: 1.4,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(flameScale, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    // Flame wobble
    Animated.sequence([
      Animated.timing(flameRotate, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(flameRotate, {
        toValue: -1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(flameRotate, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Floating KNOCKOUT badge
    Animated.sequence([
      Animated.parallel([
        Animated.spring(badgeScale, {
          toValue: 1.1,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(badgeTranslateY, {
          toValue: -28,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(badgeOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(badgeTranslateY, {
          toValue: -46,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 4. Points disappear animation (-1)
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(pointsTranslateY, {
          toValue: -38,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pointsOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 5. Fire sparks scatter
    particleAnims.forEach((anim) => {
      Animated.parallel([
        Animated.timing(anim.dist, {
          toValue: cellSize * 1.6,
          duration: 550,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 550,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Complete cleanup timer
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1100);

    return () => clearTimeout(timer);
  }, []);

  const flameAngle = flameRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        {
          left: x,
          top: y,
          width: cellSize,
          height: cellSize,
        },
      ]}
    >
      {/* 0. Charred Burn Mark on the Board Tile */}
      <Animated.View
        style={[
          styles.charredTile,
          {
            width: cellSize * 0.96,
            height: cellSize * 0.96,
            borderRadius: cellSize * 0.2,
            opacity: charredOpacity,
          },
        ]}
      />

      {/* 0b. Smoke Wisp Rising */}
      <Animated.View
        style={[
          styles.smokeWisp,
          {
            opacity: smokeOpacity,
            transform: [{ translateY: smokeY }],
          },
        ]}
      >
        <MaterialCommunityIcons name="weather-fog" size={cellSize * 1.3} color="#64748B" />
      </Animated.View>

      {/* 1. Expanding Fiery Shockwave Blast Ring */}
      <Animated.View
        style={[
          styles.blastRing,
          {
            width: cellSize * 1.6,
            height: cellSize * 1.6,
            borderRadius: cellSize * 0.8,
            transform: [{ scale: blastScale }],
            opacity: blastOpacity,
          },
        ]}
      />

      {/* 2. Spark particles */}
      {particleAnims.map((anim, idx) => {
        const angle = (idx * 2 * Math.PI) / PARTICLE_COUNT;
        const moveX = anim.dist.interpolate({
          inputRange: [0, cellSize * 1.6],
          outputRange: [0, Math.cos(angle) * cellSize * 1.6],
        });
        const moveY = anim.dist.interpolate({
          inputRange: [0, cellSize * 1.6],
          outputRange: [0, Math.sin(angle) * cellSize * 1.6],
        });

        return (
          <Animated.View
            key={`spark-${idx}`}
            style={[
              styles.sparkParticle,
              {
                transform: [{ translateX: moveX }, { translateY: moveY }],
                opacity: anim.opacity,
              },
            ]}
          />
        );
      })}

      {/* 3. Blazing Flames Layer (Stacked for intense fire heat) */}
      <Animated.View
        style={[
          styles.flameStack,
          {
            transform: [
              { scale: flameScale },
              { rotate: flameAngle },
            ],
          },
        ]}
      >
        {/* Outer Red Flame Glow */}
        <View style={styles.outerGlow} />

        {/* Back Large Flame (Deep Red/Orange) */}
        <MaterialCommunityIcons
          name="fire"
          size={cellSize * 1.9}
          color="#DC2626"
          style={styles.flameIconBack}
        />

        {/* Mid Medium Flame (Bright Orange) */}
        <MaterialCommunityIcons
          name="fire"
          size={cellSize * 1.6}
          color="#EA580C"
          style={styles.flameIconMid}
        />

        {/* Core Hot Flame (Golden Yellow) */}
        <MaterialCommunityIcons
          name="fire"
          size={cellSize * 1.2}
          color="#FACC15"
          style={styles.flameIconCore}
        />
      </Animated.View>

      {/* 4. Floating "🔥 KNOCKOUT!" Action Badge */}
      <Animated.View
        style={[
          styles.badgeWrapper,
          {
            opacity: badgeOpacity,
            transform: [
              { translateY: badgeTranslateY },
              { scale: badgeScale },
            ],
          },
        ]}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🔥 KNOCKOUT!</Text>
        </View>
      </Animated.View>

      {/* 5. Points Disappearing Indicator (-1 TOKEN) */}
      <Animated.View
        style={[
          styles.pointsWrapper,
          {
            opacity: pointsOpacity,
            transform: [{ translateY: pointsTranslateY }],
          },
        ]}
      >
        <Text style={styles.pointsText}>-1 TOKEN 💨</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  blastRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#EA580C',
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
  },
  charredTile: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 2,
    borderColor: '#DC2626',
    elevation: 4,
  },
  smokeWisp: {
    position: 'absolute',
    top: -6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkParticle: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FACC15',
    elevation: 3,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
  },
  flameStack: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerGlow: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(234, 88, 12, 0.45)',
  },
  flameIconBack: {
    position: 'absolute',
    bottom: -6,
  },
  flameIconMid: {
    position: 'absolute',
    bottom: -4,
  },
  flameIconCore: {
    position: 'absolute',
    bottom: -2,
  },
  badgeWrapper: {
    position: 'absolute',
    top: -4,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#991B1B',
    borderWidth: 1.5,
    borderColor: '#FACC15',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  badgeText: {
    color: '#FEF08A',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  pointsWrapper: {
    position: 'absolute',
    top: 6,
    alignItems: 'center',
  },
  pointsText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
});
