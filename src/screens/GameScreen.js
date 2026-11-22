/**
 * Ludo Champion - Game Screen
 * Primary game screen coordinating LudoBoard, Dice, player cards, animations, and AI bots.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView, StatusBar, Text } from 'react-native';
import { useLudoGame } from '../hooks/useLudoGame';
import LudoBoard from '../components/LudoBoard';
import Dice from '../components/Dice';
import PlayerInfo from '../components/PlayerInfo';
import GameControls from '../components/GameControls';
import GameResultModal from '../components/GameResultModal';
import { soundManager } from '../utils/soundManager';
import { loadSettings } from '../utils/storage';
import { GAME_STATUS } from '../game/constants';

const { width, height } = Dimensions.get('window');

export default function GameScreen({
  playerCount = 4,
  customOptions = {},
  isVsComputer = false,
  onExitToMenu,
}) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const {
    gameState,
    currentPlayer,
    isRolling,
    movingTokenInfo,
    onRollDice,
    onSelectToken,
    onResetGame,
  } = useLudoGame(playerCount, customOptions);

  useEffect(() => {
    loadSettings().then((s) => {
      if (s) {
        setSoundEnabled(s.soundEnabled !== false);
        soundManager.updateSettings({
          soundEnabled: s.soundEnabled !== false,
          vibrationEnabled: s.vibrationEnabled !== false,
        });
      }
    });
  }, []);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.updateSettings({ soundEnabled: next });
  };

  // Smart Computer AI Bot turn automation
  useEffect(() => {
    if (!isVsComputer || gameState.isGameOver) return;

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* 1. Header Navigation & Turn Status */}
      <GameControls
        currentPlayer={currentPlayer}
        eventMessage={gameState.lastEvent?.message}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onResetGame={onResetGame}
        onExitToMenu={onExitToMenu}
      />

      <View style={styles.gameArea}>
        {/* 2. Top Player Docks */}
        <View style={styles.playerDockRow}>
          {topPlayers.map((player) => (
            <PlayerInfo
              key={player.id}
              player={player}
              isCurrentTurn={player.id === currentPlayer.id}
            />
          ))}
        </View>

        {/* 3. Scalable Ludo Board */}
        <View style={styles.boardContainer}>
          <LudoBoard
            players={gameState.players}
            currentPlayer={currentPlayer}
            validMoves={gameState.validMoves}
            movingTokenInfo={movingTokenInfo}
            onSelectToken={onSelectToken}
            boardSize={availableBoardSize}
          />
        </View>

        {/* 4. Bottom Player Docks */}
        <View style={styles.playerDockRow}>
          {bottomPlayers.map((player) => (
            <PlayerInfo
              key={player.id}
              player={player}
              isCurrentTurn={player.id === currentPlayer.id}
            />
          ))}
        </View>

        {/* 5. Center Dice Control Station */}
        <View style={styles.diceStation}>
          <View style={styles.diceWrapper}>
            <Dice
              value={gameState.diceValue}
              isRolling={isRolling}
              disabled={
                gameState.status !== GAME_STATUS.WAITING_ROLL ||
                (isVsComputer && gameState.currentPlayerIndex > 0)
              }
              onRoll={onRollDice}
              playerColor={currentPlayer.color}
              size={58}
            />
          </View>
          <Text style={styles.instructionText}>
            {gameState.status === GAME_STATUS.WAITING_TOKEN_SELECT
              ? `${currentPlayer.name}: Tap a pulsing token to move!`
              : gameState.status === GAME_STATUS.WAITING_ROLL
              ? isVsComputer && gameState.currentPlayerIndex > 0
                ? `${currentPlayer.name} is thinking...`
                : `${currentPlayer.name}: Tap dice to roll!`
              : 'Rolling dice...'}
          </Text>
        </View>
      </View>

      {/* 6. Game Over Celebration Modal */}
      <GameResultModal
        visible={gameState.isGameOver}
        winner={gameState.winner}
        rankings={gameState.rankings}
        players={gameState.players}
        onPlayAgain={onResetGame}
        onMainMenu={onExitToMenu}
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
  diceStation: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  diceWrapper: {
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  instructionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 6,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
