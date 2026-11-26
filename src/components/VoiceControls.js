/**
 * Ludo Champion - VoiceControls Component
 * Real-time live voice talk controls (Full-duplex real-time audio)
 * - Single tap to Mute / Unmute microphone for continuous live talking
 * - Single tap to Mute / Unmute incoming speaker audio
 * - Live real-time active speaker indicators
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { soundManager } from '../utils/soundManager';

export default function VoiceControls({
  isVoiceConnected,
  isConnecting,
  isMuted = true,
  isSpeakerOn = true,
  speakingPlayers = [],
  players = [],
  onToggleMic,
  onToggleSpeaker,
  onLeaveVoice,
  voiceMode = 'live',
  isExpoGo = false,
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Active pulsation when unmuted or someone is speaking
  useEffect(() => {
    let loop = null;
    if (!isMuted || speakingPlayers.length > 0) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 500,
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
  }, [isMuted, speakingPlayers.length, pulseAnim]);

  if (!isVoiceConnected && !isConnecting) {
    return null;
  }

  // Find names of other active speakers
  const activeSpeakerNames = speakingPlayers
    .map((id) => players.find((p) => p.id === id)?.name)
    .filter(Boolean);

  let statusText = '';
  if (isConnecting) {
    statusText = 'Connecting live voice...';
  } else if (activeSpeakerNames.length > 0) {
    statusText = `🔊 ${activeSpeakerNames.join(', ')} talking...`;
  } else if (!isMuted) {
    statusText = 'Microphone LIVE • Real-time talking active';
  } else {
    statusText = 'Mic Muted • Tap mic to talk';
  }

  const handleToggleMic = () => {
    soundManager.playClick();
    if (onToggleMic) onToggleMic();
  };

  const handleToggleSpeaker = () => {
    soundManager.playClick();
    if (onToggleSpeaker) onToggleSpeaker();
  };

  return (
    <View style={styles.container}>
      <View style={styles.controlsBar}>
        {/* Real-time Microphone Toggle (Tap to Mute / Unmute) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleToggleMic}
          style={[styles.iconBtn, isMuted ? styles.micMutedBtn : styles.micLiveBtn]}
          accessibilityLabel={isMuted ? 'Unmute microphone for real-time talking' : 'Mute microphone'}
        >
          <MaterialCommunityIcons
            name={isMuted ? 'microphone-off' : 'microphone'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Speaker / Incoming Voice Output Toggle */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleToggleSpeaker}
          style={[styles.iconBtn, !isSpeakerOn ? styles.speakerOffBtn : styles.speakerOnBtn]}
          accessibilityLabel={isSpeakerOn ? 'Mute incoming voice' : 'Unmute incoming voice'}
        >
          <MaterialCommunityIcons
            name={isSpeakerOn ? 'volume-high' : 'volume-off'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Real-time Status Indicator & Speaking Pill */}
        <View style={styles.statusBlock}>
          <Animated.View
            style={[
              styles.pulseDot,
              activeSpeakerNames.length > 0
                ? styles.pulseDotSpeaking
                : !isMuted
                ? styles.pulseDotLive
                : styles.pulseDotMuted,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <Text style={styles.statusText} numberOfLines={1}>
            {statusText}
          </Text>
        </View>

        {/* Live Voice Badge */}
        <View style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>LIVE VOICE</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
    elevation: 3,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micMutedBtn: {
    backgroundColor: '#EF4444',
  },
  micLiveBtn: {
    backgroundColor: '#10B981',
  },
  speakerOnBtn: {
    backgroundColor: '#0284C7',
  },
  speakerOffBtn: {
    backgroundColor: '#64748B',
  },
  statusBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulseDotLive: {
    backgroundColor: '#10B981',
  },
  pulseDotMuted: {
    backgroundColor: '#94A3B8',
  },
  pulseDotSpeaking: {
    backgroundColor: '#FACC15',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
    flex: 1,
  },
  liveBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 0.5,
  },
});
