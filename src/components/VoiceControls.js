/**
 * Ludo Champion - VoiceControls Component
 * In-game audio controls for microphone, speaker, active speaking banner, and voice exit.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { soundManager } from '../utils/soundManager';

export default function VoiceControls({
  isVoiceConnected,
  isConnecting,
  isMuted,
  isSpeakerOn,
  speakingPlayers = [],
  players = [],
  isExpoGoFallback = false,
  onToggleMic,
  onToggleSpeaker,
  onLeaveVoice,
}) {
  if (!isVoiceConnected && !isConnecting) {
    return null;
  }

  // Find names of active speakers
  const activeSpeakerNames = speakingPlayers
    .map((id) => players.find((p) => p.id === id)?.name)
    .filter(Boolean);

  const speakerText =
    activeSpeakerNames.length > 0
      ? `${activeSpeakerNames.join(', ')} is speaking...`
      : isMuted
      ? 'Mic Muted • Tap mic to talk'
      : 'Microphone LIVE • You can speak';

  return (
    <View style={styles.container}>
      <View style={styles.controlsBar}>
        {/* Microphone Toggle Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            soundManager.playClick();
            onToggleMic();
          }}
          style={[styles.iconBtn, isMuted ? styles.micMutedBtn : styles.micLiveBtn]}
          accessibilityLabel={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          <MaterialCommunityIcons
            name={isMuted ? 'microphone-off' : 'microphone'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Speaker / Audio Toggle Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            soundManager.playClick();
            onToggleSpeaker();
          }}
          style={[styles.iconBtn, !isSpeakerOn && styles.speakerOffBtn]}
          accessibilityLabel={isSpeakerOn ? 'Mute Incoming Voice' : 'Unmute Incoming Voice'}
        >
          <MaterialCommunityIcons
            name={isSpeakerOn ? 'volume-high' : 'volume-off'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Live Speaking Status Pill */}
        <View style={styles.statusBlock}>
          <View
            style={[
              styles.pulseDot,
              activeSpeakerNames.length > 0
                ? styles.pulseDotSpeaking
                : isMuted
                ? styles.pulseDotMuted
                : styles.pulseDotLive,
            ]}
          />
          <Text style={styles.statusText} numberOfLines={1}>
            {isConnecting ? 'Connecting to voice...' : speakerText}
          </Text>
        </View>

        {/* Leave Voice Button */}
        <TouchableOpacity
          onPress={() => {
            soundManager.playClick();
            onLeaveVoice();
          }}
          style={styles.leaveVoiceBtn}
          accessibilityLabel="Leave Voice Chat"
        >
          <MaterialCommunityIcons name="phone-hangup" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
    elevation: 3,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micMutedBtn: {
    backgroundColor: '#EF4444',
  },
  micLiveBtn: {
    backgroundColor: '#10B981',
  },
  speakerOffBtn: {
    backgroundColor: '#64748B',
  },
  statusBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  pulseDotLive: {
    backgroundColor: '#10B981',
  },
  pulseDotMuted: {
    backgroundColor: '#EF4444',
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
  leaveVoiceBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
