/**
 * Ludo Champion - Join Private Room Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiJoinRoom, getServerUrl, setServerUrl } from '../services/api';
import { getPlayerProfile } from '../utils/playerProfile';
import { soundManager } from '../utils/soundManager';

export default function JoinRoomScreen({ onJoinedRoom, onBack }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isServerModalVisible, setIsServerModalVisible] = useState(false);
  const [currentServerUrl, setCurrentServerUrl] = useState('');
  const [tempServerUrl, setTempServerUrl] = useState('');

  useEffect(() => {
    getServerUrl().then((url) => {
      setCurrentServerUrl(url);
      setTempServerUrl(url);
    });
  }, []);

  const handleSaveServerUrl = async () => {
    if (tempServerUrl.trim()) {
      soundManager.playClick();
      await setServerUrl(tempServerUrl.trim());
      setCurrentServerUrl(tempServerUrl.trim());
      setIsServerModalVisible(false);
      Alert.alert('Server Updated', `Connecting to ${tempServerUrl.trim()}`);
    }
  };

  const handleTextChange = (text) => {
    // Only allow alphanumeric uppercase up to 6 characters
    const clean = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(clean);
    if (error) setError(null);
  };

  const handleJoin = async () => {
    if (code.length !== 6) {
      setError('Please enter a valid 6-character room code.');
      return;
    }

    soundManager.playClick();
    setLoading(true);
    setError(null);

    try {
      const profile = await getPlayerProfile();
      const res = await apiJoinRoom({
        roomCode: code,
        playerName: profile.name,
        playerId: profile.id,
      });

      if (onJoinedRoom) {
        onJoinedRoom(res.room);
      }
    } catch (err) {
      console.error('Failed to join room:', err);
      setError(err.message || 'Could not join room. Please check the code.');
    } finally {
      setLoading(false);
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
        <Text style={styles.headerTitle}>JOIN PRIVATE ROOM</Text>
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
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="key-variant" size={36} color="#38BDF8" />
          </View>

          <Text style={styles.title}>Enter Invitation Code</Text>
          <Text style={styles.subtitle}>
            Ask your friend for their 6-letter room code and enter it below:
          </Text>

          {/* Invitation Code Input */}
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={handleTextChange}
            placeholder="XXXXXX"
            placeholderTextColor="#475569"
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          {error && (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Join Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleJoin}
            disabled={loading || code.length !== 6}
            style={[
              styles.joinBtn,
              (loading || code.length !== 6) && styles.joinBtnDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.joinBtnText}>JOIN ROOM</Text>
                <MaterialCommunityIcons name="arrow-right" size={22} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
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
              Enter the host computer's Wi-Fi IP address (e.g. http://192.168.31.221:3000):
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
  card: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  input: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#38BDF8',
    borderRadius: 16,
    paddingVertical: 14,
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EF4444',
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    color: '#FCA5A5',
    fontWeight: '600',
    flex: 1,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
    elevation: 4,
  },
  joinBtnDisabled: {
    backgroundColor: '#475569',
    opacity: 0.7,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
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
});
