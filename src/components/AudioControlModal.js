/**
 * Ludo Champion - AudioControlModal Component
 * Interactive overlay allowing players to adjust or mute background music (BGM)
 * and game sound effects (SFX) independently with volume level steppers.
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { soundManager } from '../utils/soundManager';

const VOLUME_STEPS = [
  { label: '0%', value: 0.0 },
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1.0 },
];

export default function AudioControlModal({
  visible = false,
  onClose,
  soundEnabled = true,
  musicEnabled = true,
  vibrationEnabled = true,
  soundVolume = 1.0,
  musicVolume = 0.5,
  onToggleSound,
  onToggleMusic,
  onToggleVibration,
  onChangeSoundVolume,
  onChangeMusicVolume,
}) {
  const handleTestSfx = () => {
    soundManager.playRoll();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation?.()}>
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <MaterialCommunityIcons name="tune-vertical" size={24} color="#FACC15" />
                  <Text style={styles.headerTitle}>Audio & Music Controls</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Close audio settings"
                >
                  <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* 1. BACKGROUND MUSIC (BGM) CONTROL */}
              <View style={styles.controlSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.iconWithLabel}>
                    <MaterialCommunityIcons
                      name={musicEnabled ? 'music' : 'music-off'}
                      size={22}
                      color={musicEnabled ? '#10B981' : '#64748B'}
                    />
                    <View>
                      <Text style={styles.sectionTitle}>Background Music</Text>
                      <Text style={styles.sectionSubtitle}>
                        {musicEnabled ? `Playing (${Math.round(musicVolume * 100)}%)` : 'Muted'}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={musicEnabled}
                    onValueChange={onToggleMusic}
                    trackColor={{ false: '#334155', true: '#10B981' }}
                    thumbColor={musicEnabled ? '#FFFFFF' : '#94A3B8'}
                  />
                </View>

                {/* Music Volume Stepper */}
                <View style={[styles.volumeRow, !musicEnabled && styles.disabledSection]}>
                  <Text style={styles.volumeLabel}>Volume:</Text>
                  <View style={styles.stepperContainer}>
                    {VOLUME_STEPS.map((step) => {
                      const isSelected =
                        musicEnabled && Math.abs(musicVolume - step.value) < 0.12;
                      return (
                        <TouchableOpacity
                          key={`bgm-${step.label}`}
                          disabled={!musicEnabled}
                          onPress={() => onChangeMusicVolume(step.value)}
                          style={[
                            styles.stepButton,
                            isSelected && styles.stepButtonActiveMusic,
                          ]}
                        >
                          <Text
                            style={[
                              styles.stepText,
                              isSelected && styles.stepTextActive,
                            ]}
                          >
                            {step.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* 2. SOUND EFFECTS (SFX) CONTROL */}
              <View style={styles.controlSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.iconWithLabel}>
                    <MaterialCommunityIcons
                      name={soundEnabled ? 'volume-high' : 'volume-off'}
                      size={22}
                      color={soundEnabled ? '#FACC15' : '#64748B'}
                    />
                    <View>
                      <Text style={styles.sectionTitle}>Sound Effects</Text>
                      <Text style={styles.sectionSubtitle}>
                        {soundEnabled ? `Active (${Math.round(soundVolume * 100)}%)` : 'Muted'}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={soundEnabled}
                    onValueChange={onToggleSound}
                    trackColor={{ false: '#334155', true: '#FACC15' }}
                    thumbColor={soundEnabled ? '#0F172A' : '#94A3B8'}
                  />
                </View>

                {/* SFX Volume Stepper */}
                <View style={[styles.volumeRow, !soundEnabled && styles.disabledSection]}>
                  <Text style={styles.volumeLabel}>Volume:</Text>
                  <View style={styles.stepperContainer}>
                    {VOLUME_STEPS.map((step) => {
                      const isSelected =
                        soundEnabled && Math.abs(soundVolume - step.value) < 0.12;
                      return (
                        <TouchableOpacity
                          key={`sfx-${step.label}`}
                          disabled={!soundEnabled}
                          onPress={() => onChangeSoundVolume(step.value)}
                          style={[
                            styles.stepButton,
                            isSelected && styles.stepButtonActiveSfx,
                          ]}
                        >
                          <Text
                            style={[
                              styles.stepText,
                              isSelected && styles.stepTextActive,
                            ]}
                          >
                            {step.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Test SFX Button */}
                <TouchableOpacity
                  disabled={!soundEnabled || soundVolume <= 0}
                  onPress={handleTestSfx}
                  style={[
                    styles.testBtn,
                    (!soundEnabled || soundVolume <= 0) && styles.disabledSection,
                  ]}
                >
                  <MaterialCommunityIcons name="play-circle-outline" size={18} color="#FACC15" />
                  <Text style={styles.testBtnText}>Test Sound Effect</Text>
                </TouchableOpacity>
              </View>

              {/* 3. VIBRATION (HAPTICS) CONTROL (OPTIONAL) */}
              {onToggleVibration && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.hapticRow}>
                    <View style={styles.iconWithLabel}>
                      <MaterialCommunityIcons
                        name="vibrate"
                        size={20}
                        color={vibrationEnabled ? '#3B82F6' : '#64748B'}
                      />
                      <Text style={styles.hapticLabel}>Vibration Feedback</Text>
                    </View>
                    <Switch
                      value={vibrationEnabled}
                      onValueChange={onToggleVibration}
                      trackColor={{ false: '#334155', true: '#3B82F6' }}
                      thumbColor={vibrationEnabled ? '#FFFFFF' : '#94A3B8'}
                    />
                  </View>
                </>
              )}

              {/* Done Button */}
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                style={styles.doneBtn}
              >
                <Text style={styles.doneBtnText}>DONE</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#334155',
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlSection: {
    paddingVertical: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  volumeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginRight: 6,
  },
  stepperContainer: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  stepButton: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  stepButtonActiveMusic: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  stepButtonActiveSfx: {
    backgroundColor: '#FACC15',
    borderColor: '#EAB308',
  },
  stepText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  stepTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  disabledSection: {
    opacity: 0.4,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
    alignSelf: 'flex-start',
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FACC15',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  hapticRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  hapticLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  doneBtn: {
    marginTop: 18,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
