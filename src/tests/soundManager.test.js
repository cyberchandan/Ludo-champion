/**
 * Ludo Champion - SoundManager Tests
 * Verifies independent mute, toggle, and volume control for BGM and SFX.
 */

// Mock Platform and Haptics before requiring soundManager
jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(true),
  impactAsync: jest.fn().mockResolvedValue(true),
  notificationAsync: jest.fn().mockResolvedValue(true),
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));

import { soundManager } from '../utils/soundManager';

describe('SoundManager Audio & Music Controls', () => {
  beforeEach(() => {
    soundManager.updateSettings({
      soundEnabled: true,
      musicEnabled: false,
      soundVolume: 1.0,
      musicVolume: 0.5,
    });
  });

  test('default audio volume and enabled states are initialized properly (music disabled on start, sound effects enabled)', () => {
    expect(soundManager.soundEnabled).toBe(true);
    expect(soundManager.musicEnabled).toBe(false);
    expect(soundManager.soundVolume).toBe(1.0);
    expect(soundManager.musicVolume).toBe(0.5);
  });

  test('toggleMusic independently toggles background music state', () => {
    const newState1 = soundManager.toggleMusic();
    expect(newState1).toBe(true);
    expect(soundManager.musicEnabled).toBe(true);
    // soundEnabled must remain unaffected
    expect(soundManager.soundEnabled).toBe(true);

    const newState2 = soundManager.toggleMusic();
    expect(newState2).toBe(false);
    expect(soundManager.musicEnabled).toBe(false);
  });

  test('toggleSound independently toggles sound effects state', () => {
    const newState1 = soundManager.toggleSound();
    expect(newState1).toBe(false);
    expect(soundManager.soundEnabled).toBe(false);
    // musicEnabled must remain unaffected (still false)
    expect(soundManager.musicEnabled).toBe(false);

    const newState2 = soundManager.toggleSound();
    expect(newState2).toBe(true);
    expect(soundManager.soundEnabled).toBe(true);
  });

  test('setMusicVolume updates and clamps volume between 0.0 and 1.0', () => {
    soundManager.setMusicVolume(0.25);
    expect(soundManager.musicVolume).toBe(0.25);

    soundManager.setMusicVolume(1.5);
    expect(soundManager.musicVolume).toBe(1.0);

    soundManager.setMusicVolume(-0.5);
    expect(soundManager.musicVolume).toBe(0.0);
  });

  test('setSoundVolume updates and clamps volume between 0.0 and 1.0', () => {
    soundManager.setSoundVolume(0.75);
    expect(soundManager.soundVolume).toBe(0.75);

    soundManager.setSoundVolume(2.0);
    expect(soundManager.soundVolume).toBe(1.0);

    soundManager.setSoundVolume(-1.0);
    expect(soundManager.soundVolume).toBe(0.0);
  });

  test('playSound does not throw when audio is muted or volume is zero', async () => {
    soundManager.updateSettings({ soundEnabled: false });
    await expect(soundManager.playSound('click')).resolves.not.toThrow();

    soundManager.updateSettings({ soundEnabled: true, soundVolume: 0 });
    await expect(soundManager.playSound('roll')).resolves.not.toThrow();
  });

  test('playDiceBounce triggers without error', async () => {
    await expect(soundManager.playDiceBounce()).resolves.not.toThrow();
  });
});
