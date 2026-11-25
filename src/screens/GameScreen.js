/**
 * Ludo Champion - Game Screen
 * Primary game screen coordinating LudoBoard, Dice, player cards, animations, and AI bots.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView, StatusBar, Text } from 'react-native';
import { useLudoGame } from '../hooks/useLudoGame';
import { useMultiplayerLudo } from '../hooks/useMultiplayerLudo';
import { useLiveKitVoice } from '../hooks/useLiveKitVoice';
import LudoBoard from '../components/LudoBoard';
import PlayerInfo from '../components/PlayerInfo';
import GameControls from '../components/GameControls';
import GameResultModal from '../components/GameResultModal';
import AudioControlModal from '../components/AudioControlModal';
import VoiceControls from '../components/VoiceControls';
import { soundManager } from '../utils/soundManager';
import { loadSettings, saveSettings } from '../utils/storage';
import { GAME_STATUS, COLOR_THEMES } from '../game/constants';

const { width, height } = Dimensions.get('window');

export default function GameScreen({
  isMultiplayer = false,
  roomCode = null,
  initialGameState = null,
  playerCount = 4,
  customOptions = {},
  isVsComputer = false,
  onExitToMenu,
}) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [soundVolume, setSoundVolume] = useState(1.0);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [isAudioModalVisible, setIsAudioModalVisible] = useState(false);

  // Offline game state hook
  const offlineGame = useLudoGame(playerCount, customOptions);

  // Online multiplayer state hook
  const mpGame = useMultiplayerLudo(isMultiplayer ? roomCode : null, initialGameState);

  // LiveKit voice chat hook
  const voice = useLiveKitVoice(isMultiplayer ? roomCode : null, isMultiplayer);

  const activeGame = isMultiplayer && mpGame.gameState ? mpGame : offlineGame;
  const gameState = activeGame.gameState;
  const currentPlayer = activeGame.currentPlayer || gameState?.players?.[gameState.currentPlayerIndex];
  const isRolling = activeGame.isRolling;
  const movingTokenInfo = activeGame.movingTokenInfo;
  const captureEvent = activeGame.captureEvent;
  const clearCaptureEvent = activeGame.clearCaptureEvent;
  const onRollDice = activeGame.onRollDice;
  const onSelectToken = activeGame.onSelectToken;
  const onResetGame = activeGame.onResetGame;

  useEffect(() => {
    // When user starts playing the game, ensure background music is stopped
    // Only sound effects will respond when interacting with dice and tokens
    soundManager.stopMusic();

    loadSettings().then((s) => {
      if (s) {
        const soundOn = s.soundEnabled !== false;
        const musicOn = s.musicEnabled === true;
        const vibOn = s.vibrationEnabled !== false;
        const sVol = s.soundVolume !== undefined ? Number(s.soundVolume) : 1.0;
        const mVol = s.musicVolume !== undefined ? Number(s.musicVolume) : 0.5;

        setSoundEnabled(soundOn);
        setMusicEnabled(musicOn);
        setVibrationEnabled(vibOn);
        setSoundVolume(sVol);
        setMusicVolume(mVol);

        soundManager.updateSettings({
          soundEnabled: soundOn,
          musicEnabled: musicOn,
          vibrationEnabled: vibOn,
          soundVolume: sVol,
          musicVolume: mVol,
        });
      }
    });

    return () => {
      soundManager.stopMusic();
    };
  }, []);

  const handleToggleSound = (nextVal) => {
    const next = typeof nextVal === 'boolean' ? nextVal : !soundEnabled;
    setSoundEnabled(next);
    soundManager.updateSettings({ soundEnabled: next });
    saveSettings({ soundEnabled: next });
    if (next) soundManager.playClick();
  };

  const handleToggleMusic = (nextVal) => {
    const next = typeof nextVal === 'boolean' ? nextVal : !musicEnabled;
    setMusicEnabled(next);
    soundManager.updateSettings({ musicEnabled: next });
    saveSettings({ musicEnabled: next });
    if (soundEnabled) soundManager.playClick();
  };

  const handleChangeSoundVolume = (vol) => {
    setSoundVolume(vol);
    const shouldEnable = vol > 0;
    if (shouldEnable !== soundEnabled) {
      setSoundEnabled(shouldEnable);
    }
    soundManager.updateSettings({ soundVolume: vol, soundEnabled: shouldEnable });
    saveSettings({ soundVolume: vol, soundEnabled: shouldEnable });
  };

  const handleChangeMusicVolume = (vol) => {
    setMusicVolume(vol);
    const shouldEnable = vol > 0;
    if (shouldEnable !== musicEnabled) {
      setMusicEnabled(shouldEnable);
    }
    soundManager.updateSettings({ musicVolume: vol, musicEnabled: shouldEnable });
    saveSettings({ musicVolume: vol, musicEnabled: shouldEnable });
  };

  const handleToggleVibration = (nextVal) => {
    const next = typeof nextVal === 'boolean' ? nextVal : !vibrationEnabled;
    setVibrationEnabled(next);
    soundManager.updateSettings({ vibrationEnabled: next });
    saveSettings({ vibrationEnabled: next });
  };

  // Smart Computer AI Bot turn automation
  useEffect(() => {
    if (isMultiplayer || !isVsComputer || gameState.isGameOver) return;

    // Player 0 is the human player. Players 1..N are AI bots!
    const isBotTurn = gameState.currentPlayerIndex > 0;
    if (!isBotTurn) return;

    let timer;

    if (gameState.status === GAME_STATUS.WAITING_ROLL && !isRolling) {
      // Bot rolls dice after human-like deliberation delay
      timer = setTimeout(() => {
        onRollDice();
      }, 700);
    } else if (gameState.status === GAME_STATUS.WAITING_TOKEN_SELECT) {
      // Bot selects best valid move
      timer = setTimeout(() => {
        if (gameState.validMoves.length > 0) {
          // Heuristic: Prefer exiting yard (6), or furthest advanced token
          const tokens = currentPlayer.tokens;
          let bestTokenId = gameState.validMoves[0];

          for (const tId of gameState.validMoves) {
            const t = tokens.find((tok) => tok.id === tId);
            if (t && t.step === -1) {
              bestTokenId = tId; // Exit yard
              break;
            }
          }

          onSelectToken(bestTokenId);
        }
      }, 650);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    isVsComputer,
    gameState.currentPlayerIndex,
    gameState.status,
    gameState.validMoves,
    gameState.isGameOver,
    isRolling,
    currentPlayer,
    onRollDice,
    onSelectToken,
  ]);

  // Split players into top and bottom rows
  const players = gameState.players || [];
  const topPlayers = players.slice(0, Math.ceil(players.length / 2));
  const bottomPlayers = players.slice(Math.ceil(players.length / 2));

  // Determine dynamic board size to fit various portrait screens comfortably
  const availableBoardSize = Math.min(width - 20, height * 0.46, 380);
  const theme = currentPlayer ? COLOR_THEMES[currentPlayer.color] : COLOR_THEMES.RED;

  const getStatusText = () => {
    if (isMultiplayer) {
      if (mpGame.connectionStatus === 'RECONNECTING' || mpGame.connectionStatus === 'DISCONNECTED') {
        return 'Reconnecting to match...';
      }
      if (gameState.status === GAME_STATUS.WAITING_TOKEN_SELECT) {
        return mpGame.isMyTurn
          ? `Your Turn! Rolled a ${gameState.diceValue}! Tap a token to move.`
          : `${currentPlayer?.name}: Rolled a ${gameState.diceValue}! Choosing a token...`;
      }
      if (gameState.status === GAME_STATUS.WAITING_ROLL) {
        return mpGame.isMyTurn
          ? 'Your Turn! Tap center dice to roll!'
          : `Waiting for ${currentPlayer?.name} to roll dice...`;
      }
      if (isRolling) return `${currentPlayer?.name} is rolling dice...`;
      return `${currentPlayer?.name}'s Turn`;
    }

    if (gameState.status === GAME_STATUS.WAITING_TOKEN_SELECT) {
      return `${currentPlayer?.name}: Rolled a ${gameState.diceValue}! Tap a token to move.`;
    }
    if (gameState.status === GAME_STATUS.WAITING_ROLL) {
      return isVsComputer && gameState.currentPlayerIndex > 0
        ? `${currentPlayer?.name} is thinking...`
        : `${currentPlayer?.name}: Tap dice on board to roll!`;
    }
    if (isRolling) return 'Rolling dice...';
    return `${currentPlayer?.name}'s Turn`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* 1. Header Navigation & Turn Status */}
      <GameControls
        currentPlayer={currentPlayer}
        eventMessage={
          isMultiplayer
            ? (gameState.lastEvent?.message || (roomCode ? `Room: ${roomCode}` : null))
            : gameState.lastEvent?.message
        }
        soundEnabled={soundEnabled}
        musicEnabled={musicEnabled}
        onToggleSound={handleToggleSound}
        onToggleMusic={handleToggleMusic}
        onOpenAudioModal={() => {
          if (soundEnabled) soundManager.playClick();
          setIsAudioModalVisible(true);
        }}
        onResetGame={isMultiplayer ? null : onResetGame}
        onExitToMenu={onExitToMenu}
      />

      {/* Live Voice Chat Bar for Online Multiplayer */}
      {isMultiplayer && (
        <VoiceControls
          isVoiceConnected={voice.isVoiceConnected}
          isConnecting={voice.isConnecting}
          isMuted={voice.isMuted}
          isSpeakerOn={voice.isSpeakerOn}
          speakingPlayers={voice.speakingPlayers}
          players={gameState.players}
          isExpoGoFallback={voice.isExpoGoFallback}
          onToggleMic={voice.toggleMicrophone}
          onToggleSpeaker={voice.toggleSpeaker}
          onLeaveVoice={voice.leaveVoice}
        />
      )}

      <View style={styles.gameArea}>
        {/* 2. Top Player Docks */}
        <View style={styles.playerDockRow}>
          {topPlayers.map((player) => (
            <PlayerInfo
              key={player.id}
              player={player}
              isCurrentTurn={player.id === currentPlayer?.id}
              isSpeaking={isMultiplayer && voice.speakingPlayers.includes(player.id)}
              isVoiceMuted={isMultiplayer && voice.mutedPlayers[player.id] === true}
              rolledValue={
                player.id === currentPlayer?.id &&
                gameState.status === GAME_STATUS.WAITING_TOKEN_SELECT
                  ? gameState.diceValue
                  : null
              }
            />
          ))}
        </View>

        {/* 3. Scalable Ludo Board (Contains Center Rolling Dice and Fire Knockout Blast) */}
        <View style={styles.boardContainer}>
          <LudoBoard
            players={gameState.players}
            currentPlayer={currentPlayer}
            validMoves={gameState.validMoves}
            movingTokenInfo={movingTokenInfo}
            onSelectToken={onSelectToken}
            boardSize={availableBoardSize}
            diceState={{
              diceValue: gameState.diceValue,
              isRolling,
              disabled:
                gameState.status !== GAME_STATUS.WAITING_ROLL ||
                (isMultiplayer
                  ? !mpGame.isMyTurn
                  : (isVsComputer && gameState.currentPlayerIndex > 0)),
              onRoll: onRollDice,
              status: gameState.status,
            }}
            captureEvent={captureEvent}
            onClearCapture={clearCaptureEvent}
          />
        </View>

        {/* 4. Bottom Player Docks */}
        <View style={styles.playerDockRow}>
          {bottomPlayers.map((player) => (
            <PlayerInfo
              key={player.id}
              player={player}
              isCurrentTurn={player.id === currentPlayer?.id}
              isSpeaking={isMultiplayer && voice.speakingPlayers.includes(player.id)}
              isVoiceMuted={isMultiplayer && voice.mutedPlayers[player.id] === true}
              rolledValue={
                player.id === currentPlayer?.id &&
                gameState.status === GAME_STATUS.WAITING_TOKEN_SELECT
                  ? gameState.diceValue
                  : null
              }
            />
          ))}
        </View>

        {/* 5. Safe Bottom Turn Status Pill (Clear of Android navigation bar) */}
        <View style={styles.bottomStatusStation}>
          <View style={[styles.statusPill, { borderColor: theme.primary }]}>
            <View style={[styles.statusDot, { backgroundColor: theme.primary }]} />
            <Text style={styles.statusInstructionText} numberOfLines={1}>
              {getStatusText()}
            </Text>
          </View>
        </View>
      </View>

      {/* 6. Game Over Celebration Modal */}
      <GameResultModal
        visible={gameState.isGameOver}
        winner={gameState.winner}
        rankings={gameState.rankings}
        players={gameState.players}
        onPlayAgain={
          isMultiplayer
            ? null
            : () => {
                soundManager.playClick();
                onResetGame();
              }
        }
        onMainMenu={() => {
          soundManager.playClick();
          onExitToMenu?.();
        }}
      />

      {/* 7. In-Game Audio & Music Control Modal */}
      <AudioControlModal
        visible={isAudioModalVisible}
        onClose={() => setIsAudioModalVisible(false)}
        soundEnabled={soundEnabled}
        musicEnabled={musicEnabled}
        vibrationEnabled={vibrationEnabled}
        soundVolume={soundVolume}
        musicVolume={musicVolume}
        onToggleSound={handleToggleSound}
        onToggleMusic={handleToggleMusic}
        onToggleVibration={handleToggleVibration}
        onChangeSoundVolume={handleChangeSoundVolume}
        onChangeMusicVolume={handleChangeMusicVolume}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  playerDockRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 8,
    gap: 8,
  },
  boardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  bottomStatusStation: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    gap: 8,
    maxWidth: '92%',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusInstructionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.3,
  },
});
