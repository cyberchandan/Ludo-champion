/**
 * Ludo Champion - Waiting Room Lobby Screen
 * Real-time 4-player lobby with host controls and LiveKit voice status.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSocket } from '../services/socket';
import { apiGetRoom, apiStartGame } from '../services/api';
import { getPlayerProfile } from '../utils/playerProfile';
import { COLOR_THEMES } from '../game/constants';
import { soundManager } from '../utils/soundManager';

const TOTAL_SLOTS = 4;

export default function WaitingRoomScreen({
  roomCode,
  onGameStarted,
  onLeaveRoom,
}) {
  const [room, setRoom] = useState(null);
  const [profile, setProfile] = useState(null);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function initLobby() {
      const userProfile = await getPlayerProfile();
      if (!isMounted) return;
      setProfile(userProfile);

      // Fetch initial room state
      try {
        const initialRoom = await apiGetRoom(roomCode);
        if (isMounted) setRoom(initialRoom);
      } catch (err) {
        console.warn('Error fetching room:', err);
      }

      // Connect to Socket.IO
      const socket = await getSocket();
      socketRef.current = socket;

      socket.emit(
        'join-room',
        {
          roomCode,
          playerId: userProfile.id,
          playerName: userProfile.name,
        },
        (res) => {
          if (res?.success && isMounted) {
            setRoom(res.room);
          }
        }
      );

      // Listen for other players joining
      socket.on('player-joined', ({ room: updatedRoom }) => {
        if (isMounted) setRoom(updatedRoom);
      });

      // Listen for player disconnects
      socket.on('player-disconnected', ({ room: updatedRoom }) => {
        if (isMounted) setRoom(updatedRoom);
      });

      // Listen for host starting the game
      socket.on('game-started', ({ room: updatedRoom, gameState }) => {
        if (isMounted && onGameStarted) {
          onGameStarted(updatedRoom, gameState);
        }
      });
    }

    initLobby();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.off('player-joined');
        socketRef.current.off('player-disconnected');
        socketRef.current.off('game-started');
      }
    };
  }, [roomCode, onGameStarted]);

  const isHost = room?.hostId === profile?.id;
  const players = room?.players || [];
  const canStart = isHost && players.length >= 2;

  const handleCopyCode = async () => {
    soundManager.playClick();
    await Clipboard.setStringAsync(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareInvite = async () => {
    soundManager.playClick();
    try {
      await Share.share({
        message: `🎲 Let's play Ludo Champion together!\n\nJoin my room with code: ${roomCode}\n\nOpen Ludo Champion -> Play With Friends -> Join Room.`,
      });
    } catch (e) {
      // ignore
    }
  };

  const handleStartGame = async () => {
    if (!canStart) return;
    soundManager.playClick();
    setStarting(true);

    try {
      if (socketRef.current) {
        socketRef.current.emit(
          'start-game',
          { roomCode, hostId: profile.id },
          (res) => {
            setStarting(false);
            if (!res?.success) {
              Alert.alert('Cannot Start', res?.error || 'Failed to start game');
            }
          }
        );
      } else {
        await apiStartGame(roomCode, profile.id);
        setStarting(false);
      }
    } catch (err) {
      setStarting(false);
      Alert.alert('Error', err.message || 'Could not start game');
    }
  };

  const handleLeavePress = () => {
    Alert.alert(
      'Leave Room?',
      'Are you sure you want to leave this waiting room?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            soundManager.playClick();
            onLeaveRoom();
          },
        },
      ]
    );
  };

  // Build 4 visual slots
  const slots = [];
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    slots.push(players[i] || null);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeavePress} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>WAITING ROOM</Text>
        <TouchableOpacity onPress={handleLeavePress} style={styles.leaveBtn}>
          <MaterialCommunityIcons name="exit-to-app" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Invitation Code Banner */}
        <View style={styles.codeCard}>
          <Text style={styles.codeCardLabel}>ROOM INVITATION CODE</Text>
          <Text style={styles.codeCardText}>{roomCode}</Text>
          <View style={styles.codeActionsRow}>
            <TouchableOpacity onPress={handleCopyCode} style={styles.codeSmallBtn}>
              <MaterialCommunityIcons
                name={copied ? 'check' : 'content-copy'}
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.codeSmallBtnText}>{copied ? 'COPIED' : 'COPY'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleShareInvite} style={styles.codeSmallBtn}>
              <MaterialCommunityIcons name="share-variant" size={16} color="#FFFFFF" />
              <Text style={styles.codeSmallBtnText}>SHARE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Players Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>PLAYERS IN LOBBY</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{players.length}/4</Text>
          </View>
        </View>

        {/* 4 Player Slots */}
        <View style={styles.slotsGrid}>
          {slots.map((p, index) => {
            if (p) {
              const theme = COLOR_THEMES[p.color] || COLOR_THEMES.RED;
              return (
                <View
                  key={p.id || index}
                  style={[styles.playerSlot, { borderColor: theme.primary }]}
                >
                  <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
                    <MaterialCommunityIcons
                      name={p.isHost ? 'crown' : 'account'}
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>

                  <View style={styles.playerMeta}>
                    <View style={styles.playerNameRow}>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {p.name}
                      </Text>
                      {p.isHost && (
                        <View style={styles.hostBadge}>
                          <Text style={styles.hostBadgeText}>HOST</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.playerColorName, { color: theme.primary }]}>
                      {theme.name} House
                    </Text>
                  </View>

                  <View style={styles.statusDotRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: p.isConnected !== false ? '#10B981' : '#94A3B8' },
                      ]}
                    />
                    <Text style={styles.statusDotText}>
                      {p.isConnected !== false ? 'READY' : 'AWAY'}
                    </Text>
                  </View>
                </View>
              );
            }

            return (
              <View key={`empty_${index}`} style={styles.emptySlot}>
                <View style={styles.emptyAvatar}>
                  <MaterialCommunityIcons name="account-plus-outline" size={26} color="#475569" />
                </View>
                <Text style={styles.emptySlotText}>Waiting for player...</Text>
              </View>
            );
          })}
        </View>

        {/* Start Game / Host Guidance Station */}
        <View style={styles.bottomSection}>
          {isHost ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleStartGame}
              disabled={!canStart || starting}
              style={[
                styles.startBtn,
                (!canStart || starting) && styles.startBtnDisabled,
              ]}
            >
              {starting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="play-circle" size={26} color="#FFFFFF" />
                  <Text style={styles.startBtnText}>
                    {players.length < 2 ? 'NEED 2+ PLAYERS TO START' : 'START GAME'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.guestWaitCard}>
              <ActivityIndicator size="small" color="#FACC15" />
              <Text style={styles.guestWaitText}>
                Waiting for the host to start the game...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  leaveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
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
    padding: 20,
    gap: 16,
  },
  codeCard: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  codeCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  codeCardText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 6,
    marginVertical: 6,
  },
  codeActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  codeSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#334155',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  codeSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: '#334155',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  countBadgeText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  slotsGrid: {
    gap: 10,
  },
  playerSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  playerMeta: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    maxWidth: 160,
  },
  hostBadge: {
    backgroundColor: '#FACC15',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  hostBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0F172A',
  },
  playerColorName: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    gap: 14,
  },
  emptyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlotText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  bottomSection: {
    marginTop: 10,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 10,
    elevation: 4,
  },
  startBtnDisabled: {
    backgroundColor: '#475569',
    opacity: 0.6,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  guestWaitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  guestWaitText: {
    color: '#FACC15',
    fontSize: 13,
    fontWeight: '700',
  },
});
