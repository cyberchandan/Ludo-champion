/**
 * Ludo Champion - Create Private Room Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiCreateRoom } from '../services/api';
import { getPlayerProfile } from '../utils/playerProfile';
import { soundManager } from '../utils/soundManager';

export default function CreateRoomScreen({ onRoomCreated, onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    createRoom();
  }, []);

  const createRoom = async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await getPlayerProfile();
      const res = await apiCreateRoom({
        hostName: profile.name,
        hostId: profile.id,
      });
      setRoomData(res.room);
    } catch (err) {
      console.error('Failed to create room:', err);
      setError(err.message || 'Could not connect to multiplayer server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!roomData?.roomCode) return;
    soundManager.playClick();
    await Clipboard.setStringAsync(roomData.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareInvite = async () => {
    if (!roomData?.roomCode) return;
    soundManager.playClick();
    try {
      await Share.share({
        message: `🎲 Let's play Ludo Champion together!\n\nJoin my private room with code: ${roomData.roomCode}\n\nOpen Ludo Champion -> Play With Friends -> Join Room.`,
      });
    } catch (e) {
      Alert.alert('Share Error', e.message);
    }
  };

  const handleEnterLobby = () => {
    soundManager.playClick();
    if (roomData && onRoomCreated) {
      onRoomCreated(roomData);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            soundManager.playClick();
            onBack();
          }}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PRIVATE ROOM</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Creating your private room...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={54} color="#EF4444" />
            <Text style={styles.errorTitle}>Room Creation Failed</Text>
            <Text style={styles.errorMsg}>{error}</Text>
            <TouchableOpacity onPress={createRoom} style={styles.retryBtn}>
              <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.successContainer}>
            <View style={styles.badgeTop}>
              <MaterialCommunityIcons name="crown" size={32} color="#FACC15" />
              <Text style={styles.badgeTopText}>YOU ARE THE HOST</Text>
            </View>

            <Text style={styles.subtitle}>
              Share this 6-character invitation code with your friends to join:
            </Text>

            {/* Room Code Display Box */}
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{roomData?.roomCode}</Text>
            </View>

            {/* Copy & Share Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={handleCopyCode}
                style={[styles.actionBtn, styles.copyBtn]}
              >
                <MaterialCommunityIcons
                  name={copied ? 'check' : 'content-copy'}
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.actionBtnText}>{copied ? 'COPIED!' : 'COPY CODE'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShareInvite}
                style={[styles.actionBtn, styles.shareBtn]}
              >
                <MaterialCommunityIcons name="share-variant" size={20} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>SHARE INVITE</Text>
              </TouchableOpacity>
            </View>

            {/* Enter Waiting Room */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleEnterLobby}
              style={styles.lobbyBtn}
            >
              <Text style={styles.lobbyBtnText}>GO TO WAITING ROOM</Text>
              <MaterialCommunityIcons name="arrow-right" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  errorMsg: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  successContainer: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FACC15',
    marginBottom: 16,
  },
  badgeTopText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FACC15',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  codeBox: {
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  codeText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },
  copyBtn: {
    backgroundColor: '#334155',
  },
  shareBtn: {
    backgroundColor: '#2563EB',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  lobbyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
    elevation: 4,
  },
  lobbyBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
