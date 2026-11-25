/**
 * Ludo Champion - Online Menu Screen (Play With Friends)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getPlayerProfile, setPlayerName } from '../utils/playerProfile';
import { getServerUrl, setServerUrl } from '../services/api';
import { soundManager } from '../utils/soundManager';

export default function OnlineMenuScreen({
  onCreateRoom,
  onJoinRoom,
  onBack,
}) {
  const [profile, setProfile] = useState({ id: '', name: 'Player' });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Server settings modal state
  const [isServerModalVisible, setIsServerModalVisible] = useState(false);
  const [serverUrl, setLocalServerUrl] = useState('');
  const [tempServerUrl, setTempServerUrl] = useState('');

  useEffect(() => {
    getPlayerProfile().then((p) => {
      setProfile(p);
      setTempName(p.name);
    });
    getServerUrl().then((u) => {
      setLocalServerUrl(u);
      setTempServerUrl(u);
    });
  }, []);

  const handleSaveName = async () => {
    if (tempName.trim()) {
      soundManager.playClick();
      const updated = await setPlayerName(tempName.trim());
      setProfile(updated);
      setIsEditingName(false);
    }
  };

  const handleSaveServerUrl = async () => {
    if (tempServerUrl.trim()) {
      soundManager.playClick();
      await setServerUrl(tempServerUrl.trim());
      setLocalServerUrl(tempServerUrl.trim());
      setIsServerModalVisible(false);
      Alert.alert('Server Updated', `Connecting to ${tempServerUrl.trim()}`);
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
        <Text style={styles.headerTitle}>PLAY WITH FRIENDS</Text>
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

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account-circle" size={44} color="#FACC15" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileLabel}>YOUR DISPLAY NAME</Text>
            {isEditingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameInput}
                  value={tempName}
                  onChangeText={setTempName}
                  maxLength={16}
                  placeholder="Enter your name"
                  placeholderTextColor="#94A3B8"
                  autoFocus
                />
                <TouchableOpacity onPress={handleSaveName} style={styles.saveNameBtn}>
                  <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  soundManager.playClick();
                  setIsEditingName(true);
                }}
                style={styles.nameDisplayRow}
              >
                <Text style={styles.profileName}>{profile.name}</Text>
                <MaterialCommunityIcons name="pencil-outline" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Action Menu Cards */}
        <View style={styles.menuContainer}>
          {/* Create Room Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              soundManager.playClick();
              onCreateRoom();
            }}
            style={[styles.actionCard, styles.createCard]}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#7C3AED' }]}>
              <MaterialCommunityIcons name="plus-circle" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>CREATE PRIVATE ROOM</Text>
              <Text style={styles.cardSubtitle}>
                Host a game, get a 6-letter invite code and invite your friends
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Join Room Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              soundManager.playClick();
              onJoinRoom();
            }}
            style={[styles.actionCard, styles.joinCard]}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#2563EB' }]}>
              <MaterialCommunityIcons name="login-variant" size={30} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>JOIN PRIVATE ROOM</Text>
              <Text style={styles.cardSubtitle}>
                Enter your friend's 6-letter room code to jump straight into the lobby
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>ONLINE MULTIPLAYER HIGHLIGHTS</Text>
          <View style={styles.featureRow}>
            <MaterialCommunityIcons name="microphone-outline" size={20} color="#10B981" />
            <Text style={styles.featureText}>Crystal-clear live voice chat during matches</Text>
          </View>
          <View style={styles.featureRow}>
            <MaterialCommunityIcons name="shield-check-outline" size={20} color="#38BDF8" />
            <Text style={styles.featureText}>100% fair server-authoritative dice rolling</Text>
          </View>
          <View style={styles.featureRow}>
            <MaterialCommunityIcons name="sync" size={20} color="#FACC15" />
            <Text style={styles.featureText}>Automatic reconnection & board state recovery</Text>
          </View>
        </View>
      </ScrollView>

      {/* Server URL Settings Modal */}
      <Modal
        visible={isServerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsServerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Multiplayer Server Configuration</Text>
            <Text style={styles.modalDesc}>
              Enter the backend URL (e.g. your PC's IP address on Wi-Fi: http://192.168.1.5:3000):
            </Text>
            <TextInput
              style={styles.serverInput}
              value={tempServerUrl}
              onChangeText={setTempServerUrl}
              placeholder="http://192.168.1.X:3000"
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
                <Text style={styles.modalSaveText}>Save</Text>
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
    padding: 20,
    gap: 18,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  nameDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  nameInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  saveNameBtn: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    gap: 14,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  createCard: {
    backgroundColor: '#6D28D9',
  },
  joinCard: {
    backgroundColor: '#1D4ED8',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 3,
    lineHeight: 16,
  },
  featuresCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
    marginTop: 8,
  },
  featuresTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '600',
    flex: 1,
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
