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
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiCreateRoom, getServerUrl, setServerUrl } from '../services/api';
import { getPlayerProfile } from '../utils/playerProfile';
import { soundManager } from '../utils/soundManager';

export default function CreateRoomScreen({ onRoomCreated, onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [copied, setCopied] = useState(false);

  const [isServerModalVisible, setIsServerModalVisible] = useState(false);
  const [currentServerUrl, setCurrentServerUrl] = useState('');
  const [tempServerUrl, setTempServerUrl] = useState('');

  useEffect(() => {
    getServerUrl().then((url) => {
      setCurrentServerUrl(url);
      setTempServerUrl(url);
    });
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
      const url = await getServerUrl();
      setError(`Cannot reach server at ${url}.\n\nEnsure backend server is running ("npm run server") and devices share the same Wi-Fi.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServerUrl = async () => {
    if (tempServerUrl.trim()) {
      soundManager.playClick();
      await setServerUrl(tempServerUrl.trim());
      setCurrentServerUrl(tempServerUrl.trim());
      setIsServerModalVisible(false);
      createRoom();
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
        <TouchableOpacity
          onPress={() => {
            soundManager.playClick();
            setIsServerModalVisible(true);
          }}
          style={styles.serverSettingsBtn}
          accessibilityLabel="Server Connection Settings"
        >
          <MaterialCommunityIcons name="server-network" size={22} color="#38BDF8" />
        </TouchableOpacity>
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
            <View style={styles.errorActionsRow}>
              <TouchableOpacity onPress={createRoom} style={styles.retryBtn}>
                <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsServerModalVisible(true)}
                style={styles.changeIpBtn}
              >
                <MaterialCommunityIcons name="cog-outline" size={18} color="#38BDF8" />
                <Text style={styles.changeIpText}>Change Server IP</Text>
              </TouchableOpacity>
            </View>
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

      {/* Server IP Settings Modal */}
      <Modal
        visible={isServerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsServerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Multiplayer Server IP</Text>
            <Text style={styles.modalDesc}>
              Enter your computer's Wi-Fi IP address (e.g. http://192.168.31.221:3000):
            </Text>
            <TextInput
              style={styles.serverInput}
              value={tempServerUrl}
              onChangeText={setTempServerUrl}
              placeholder="http://192.168.31.221:3000"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                onPress={() => setIsServerModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveServerUrl}
                style={styles.modalSaveBtn}
              >
                <Text style={styles.modalSaveText}>Save & Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  serverSettingsBtn: {
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
  errorActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  changeIpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#334155',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  changeIpText: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 14,
    lineHeight: 18,
  },
  serverInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#334155',
  },
  modalCancelText: {
    color: '#CBD5E1',
    fontWeight: '700',
  },
  modalSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '800',
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
