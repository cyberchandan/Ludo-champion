/**
 * Ludo Champion - Dice Component
 * Realistic 3D physical rolling dice with:
 * - Dynamic board-wide toss & ricochet trajectory physics
 * - Multi-axis 3D perspective tumbling (rotateX, rotateY, rotateZ)
 * - Squash-and-stretch floor impacts with synchronized sound & haptics
 * - Dynamic reactive ground shadow
 * - Motion trail sparks along the roll trajectory
 * - Specular golden shine sweep on settle
 * - Spectacular Lucky 6 sunburst rays and celebration banner
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLOR_THEMES } from '../game/constants';
import { soundManager } from '../utils/soundManager';

const TRAIL_PARTICLES = 6;

export default function Dice({
  value = 1,
  isRolling = false,
  disabled = false,
  onRoll,
  playerColor = 'RED',
  size = 54,
  boardSize = 360,
  showBadge = true,
  onBounceImpact,
}) {
  // Physical motion trajectories
  const trajX = useRef(new Animated.Value(0)).current;
  const trajY = useRef(new Animated.Value(0)).current;
  const bounceScale = useRef(new Animated.Value(1)).current;
  const shadowScale = useRef(new Animated.Value(1)).current;
  const shadowOpacity = useRef(new Animated.Value(0.4)).current;

  // 3D rotations
  const spinZ = useRef(new Animated.Value(0)).current;
  const spinX = useRef(new Animated.Value(0)).current;
  const spinY = useRef(new Animated.Value(0)).current;

  // Visual polish & celebrations
  const pulseAura = useRef(new Animated.Value(1)).current;
  const idleFloat = useRef(new Animated.Value(0)).current;
  const shineSweep = useRef(new Animated.Value(-60)).current;
  const sixScale = useRef(new Animated.Value(0)).current;
  const sixRaysSpin = useRef(new Animated.Value(0)).current;

  // Motion trail particles
  const trailOpacity = useRef(new Animated.Value(0)).current;
  const trailScale = useRef(new Animated.Value(0.5)).current;

  const pipIntervalRef = useRef(null);
  const onBounceImpactRef = useRef(onBounceImpact);
  useEffect(() => {
    onBounceImpactRef.current = onBounceImpact;
  }, [onBounceImpact]);

  const [displayValue, setDisplayValue] = useState(value || 1);
  const theme = COLOR_THEMES[playerColor] || COLOR_THEMES.RED;

  // Idle floating and pulsing while waiting for player turn
  useEffect(() => {
    let auraLoop;
    let floatLoop;

    if (!disabled && !isRolling) {
      auraLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAura, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAura, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      auraLoop.start();

      floatLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(idleFloat, {
            toValue: -3,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(idleFloat, {
            toValue: 3,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      floatLoop.start();
    } else {
      pulseAura.setValue(1);
      idleFloat.setValue(0);
    }

    return () => {
      if (auraLoop) auraLoop.stop();
      if (floatLoop) floatLoop.stop();
    };
  }, [disabled, isRolling, pulseAura, idleFloat]);

  // Sync display value and trigger Lucky 6 celebration
  useEffect(() => {
    if (!isRolling) {
      if (pipIntervalRef.current) {
        clearInterval(pipIntervalRef.current);
        pipIntervalRef.current = null;
      }
      if (value) {
        setDisplayValue(value);
      }

      // Specular shine sweep across the settled face
      shineSweep.setValue(-size);
      Animated.timing(shineSweep, {
        toValue: size * 1.5,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();

      // Trigger Lucky 6 celebration fireworks & sunburst
      if (value === 6) {
        sixScale.setValue(0);
        sixRaysSpin.setValue(0);

        Animated.parallel([
          Animated.sequence([
            Animated.spring(sixScale, {
              toValue: 1,
              friction: 4,
              tension: 70,
              useNativeDriver: true,
            }),
            Animated.delay(800),
            Animated.timing(sixScale, {
              toValue: 0,
              duration: 350,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(sixRaysSpin, {
            toValue: 1,
            duration: 1200,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [value, isRolling, size, sixScale, sixRaysSpin, shineSweep]);

  // Dynamic Physical Board Rolling Physics
  useEffect(() => {
    let timer1;
    let timer2;

    if (isRolling) {
      // Clear any prior interval
      if (pipIntervalRef.current) {
        clearInterval(pipIntervalRef.current);
        pipIntervalRef.current = null;
      }

      // 1. Rapid pip randomization during roll
      pipIntervalRef.current = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 50);

      // 2. Calculate dynamic trajectory within board boundary
      // Max throw distance from center: 22% of board (safely within inner tracks)
      const maxDistance = Math.min((boardSize * 0.22), 85);
      const randomAngle = Math.random() * Math.PI * 2;
      const dist1 = maxDistance * (0.75 + Math.random() * 0.25);

      // Point 1 (Peak toss impact)
      const p1X = Math.cos(randomAngle) * dist1;
      const p1Y = Math.sin(randomAngle) * dist1;

      // Point 2 (Ricochet bounce point)
      const ricochetAngle = randomAngle + 2.1;
      const dist2 = dist1 * 0.45;
      const p2X = Math.cos(ricochetAngle) * dist2;
      const p2Y = Math.sin(ricochetAngle) * dist2;

      // 3. Reset anim values
      trajX.setValue(0);
      trajY.setValue(0);
      spinZ.setValue(0);
      spinX.setValue(0);
      spinY.setValue(0);
      bounceScale.setValue(1);
      shadowScale.setValue(1);

      // Show motion trail sparks
      trailOpacity.setValue(0.8);
      trailScale.setValue(0.5);
      Animated.parallel([
        Animated.timing(trailScale, {
          toValue: 1.8,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.timing(trailOpacity, {
          toValue: 0,
          duration: 520,
          useNativeDriver: true,
        }),
      ]).start();

      // Timed impact bounce sounds and haptic clicks
      timer1 = setTimeout(() => {
        soundManager.playDiceBounce();
        if (onBounceImpactRef.current) onBounceImpactRef.current();
      }, 190);

      timer2 = setTimeout(() => {
        soundManager.playDiceBounce();
        if (onBounceImpactRef.current) onBounceImpactRef.current();
      }, 340);

      // Full Multi-Stage Board Rolling Sequence
      Animated.parallel([
        // Horizontal trajectory X: Center -> P1 -> P2 -> Center
        Animated.sequence([
          Animated.timing(trajX, {
            toValue: p1X,
            duration: 190,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(trajX, {
            toValue: p2X,
            duration: 150,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(trajX, {
            toValue: 0,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),

        // Vertical trajectory Y: Center -> P1 -> P2 -> Center
        Animated.sequence([
          Animated.timing(trajY, {
            toValue: p1Y,
            duration: 190,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(trajY, {
            toValue: p2Y,
            duration: 150,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(trajY, {
            toValue: 0,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),

        // Vertical Bounce (Scale Squash-and-Stretch curve)
        Animated.sequence([
          // Jump into air
          Animated.timing(bounceScale, {
            toValue: 1.45,
            duration: 100,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          // First hard floor impact squash
          Animated.timing(bounceScale, {
            toValue: 0.82,
            duration: 90,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          // Rebound into air
          Animated.timing(bounceScale, {
            toValue: 1.2,
            duration: 80,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          // Second floor impact squash
          Animated.timing(bounceScale, {
            toValue: 0.9,
            duration: 70,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          // Settling rest
          Animated.spring(bounceScale, {
            toValue: 1.0,
            friction: 4,
            tension: 90,
            useNativeDriver: true,
          }),
        ]),

        // Reactive Ground Shadow (contracts when airborne, tightens on impact)
        Animated.sequence([
          Animated.timing(shadowScale, {
            toValue: 0.5,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shadowScale, {
            toValue: 1.3,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.timing(shadowScale, {
            toValue: 0.7,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.spring(shadowScale, {
            toValue: 1.0,
            friction: 4,
            useNativeDriver: true,
          }),
        ]),

        // Dynamic 3D Tumbling Rotations
        Animated.timing(spinZ, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(spinX, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(spinY, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        spinZ.setValue(0);
        spinX.setValue(0);
        spinY.setValue(0);
        trajX.setValue(0);
        trajY.setValue(0);
      });
    } else {
      // When not rolling, immediately clear any active interval and lock value
      if (pipIntervalRef.current) {
        clearInterval(pipIntervalRef.current);
        pipIntervalRef.current = null;
      }
      if (value) {
        setDisplayValue(value);
      }
    }

    return () => {
      if (pipIntervalRef.current) {
        clearInterval(pipIntervalRef.current);
        pipIntervalRef.current = null;
      }
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
    };
  }, [isRolling, boardSize, trajX, trajY, bounceScale, shadowScale, spinZ, spinX, spinY, trailOpacity, trailScale, value]);

  // Rotational interpolations
  const rotateZVal = spinZ.interpolate({
    inputRange: [0, 0.4, 0.7, 1],
    outputRange: ['0deg', '240deg', '520deg', '720deg'],
  });

  const rotateXVal = spinX.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '360deg', '720deg'],
  });

  const rotateYVal = spinY.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '270deg', '540deg'],
  });

  const sunburstSpin = sixRaysSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pipSize = size * 0.18;
  const isSix = displayValue === 6;
  const pipColor = isSix ? '#DC2626' : '#1F2937';

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
    <View style={styles.outerContainer} pointerEvents={disabled ? 'none' : 'auto'}>
      {/* Motion Trail Sparks when tumbling across the board */}
      {isRolling && (
        <Animated.View
          style={[
            styles.motionTrail,
            {
              width: size * 1.5,
              height: size * 1.5,
              borderRadius: (size * 1.5) / 2,
              borderColor: theme.primary,
              transform: [
                { translateX: trajX },
                { translateY: trajY },
                { scale: trailScale },
              ],
              opacity: trailOpacity,
            },
          ]}
        />
      )}

      {/* 1. Floor Drop Shadow (Tracks trajectory on the ground plane) */}
      <Animated.View
        style={[
          styles.floorShadow,
          {
            width: size * 0.9,
            height: size * 0.25,
            borderRadius: (size * 0.25) / 2,
            transform: [
              { translateX: trajX },
              { translateY: trajY },
              { scale: shadowScale },
            ],
            opacity: disabled ? 0.2 : shadowOpacity,
          },
        ]}
      />

      {/* 2. Interactive Animated Dice */}
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={disabled || isRolling}
        onPress={onRoll}
        style={[styles.touchTarget, disabled && styles.disabledTouch]}
      >
        <Animated.View
          style={[
            styles.diceMover,
            {
              transform: [
                { translateX: trajX },
                { translateY: trajY },
                { translateY: idleFloat },
                { perspective: 800 },
                { scale: bounceScale },
                { rotateZ: rotateZVal },
                { rotateX: rotateXVal },
                { rotateY: rotateYVal },
              ],
            },
          ]}
        >
          {/* Glowing Aura Ring when waiting for player turn */}
          {!disabled && !isRolling && (
            <Animated.View
              style={[
                styles.glowAura,
                {
                  width: size * 1.36,
                  height: size * 1.36,
                  borderRadius: (size * 1.36) / 2,
                  borderColor: theme.primary,
                  transform: [{ scale: pulseAura }],
                },
              ]}
            />
          )}

          {/* 3D Physical Dice Cube */}
          <View
            style={[
              styles.diceCube,
              {
                width: size,
                height: size,
                borderRadius: size * 0.22,
                borderColor: isSix ? '#DC2626' : theme.primary,
              },
            ]}
          >
            {/* Top Gloss highlight */}
            <View style={styles.topGloss} />
            <View style={styles.cornerSpecular} />

            {/* Specular Shine Sweep across settled face */}
            <Animated.View
              style={[
                styles.specularShine,
                { transform: [{ translateX: shineSweep }] },
              ]}
            />

            {/* Dice Face Pips */}
            {renderPips(displayValue)}
          </View>
        </Animated.View>

        {/* 3. Lucky 6 Celebration Banner & Sunburst Rays */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sixCelebrationContainer,
            {
              transform: [{ scale: sixScale }],
            },
          ]}
        >
          {/* Rotating Sunburst Rays */}
          <Animated.View
            style={[
              styles.sunburstRays,
              { transform: [{ rotate: sunburstSpin }] },
            ]}
          >
            <MaterialCommunityIcons name="white-balance-sunny" size={size * 2.2} color="#FBBF24" />
          </Animated.View>

          {/* Star Face Icon */}
          <MaterialCommunityIcons name="star-face" size={size * 0.9} color="#FFD700" />

          {/* Floating Celebration Banner */}
          <View style={styles.sixBanner}>
            <Text style={styles.sixBannerText}>🌟 LUCKY 6! BONUS ROLL! 🌟</Text>
          </View>
        </Animated.View>

        {/* 4. "TAP TO ROLL" Indicator Pill */}
        {showBadge && !disabled && !isRolling && (
          <Animated.View
            style={[
              styles.rollBadge,
              {
                backgroundColor: theme.primary,
                transform: [{ translateY: idleFloat }],
              },
            ]}
          >
            <MaterialCommunityIcons name="gesture-tap" size={11} color="#FFFFFF" />
            <Text style={styles.rollText}>ROLL</Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  touchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledTouch: {
    opacity: 0.5,
  },
  floorShadow: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#000000',
    elevation: 3,
  },
  motionTrail: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  diceMover: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowAura: {
    position: 'absolute',
    borderWidth: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  diceCube: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 7,
    overflow: 'hidden',
  },
  topGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '36%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  cornerSpecular: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  specularShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ rotate: '25deg' }],
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 1,
  },
  sixCelebrationContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 300,
  },
  sunburstRays: {
    position: 'absolute',
    opacity: 0.8,
  },
  sixBanner: {
    position: 'absolute',
    top: -26,
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    minWidth: 160,
    alignItems: 'center',
  },
  sixBannerText: {
    color: '#FEF08A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rollBadge: {
    position: 'absolute',
    bottom: -13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  rollText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
