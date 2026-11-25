/**
 * Ludo Champion - LudoBoard Component
 * Scalable SVG 15x15 board with real-time interactive pawn rendering and collision stacking.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Rect, Path, Circle, G, Polygon } from 'react-native-svg';
import {
  MAIN_TRACK,
  HOME_LANES,
  SAFE_TRACK_INDICES,
  PLAYER_START_OFFSETS,
  calculateTokenPosition,
} from '../game/boardConfig';
import { COLOR_THEMES, PLAYER_COLORS, STEP, GAME_STATUS } from '../game/constants';
import LudoToken from './LudoToken';
import Dice from './Dice';
import FireCaptureEffect from './FireCaptureEffect';

// Golden Star SVG Path centered at (cx, cy) with radius r
function renderStar(cx, cy, r, color = '#F59E0B') {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const currentR = i % 2 === 0 ? r : r * 0.45;
    points.push(`${cx + currentR * Math.cos(angle)},${cy + currentR * Math.sin(angle)}`);
  }
  return <Polygon key={`star-${cx}-${cy}`} points={points.join(' ')} fill={color} />;
}

export default function LudoBoard({
  players = [],
  currentPlayer,
  validMoves = [],
  movingTokenInfo = null,
  onSelectToken,
  boardSize = null,
  diceState = null,
  captureEvent = null,
  onClearCapture,
}) {
  const windowWidth = Dimensions.get('window').width;
  const size = boardSize || Math.min(windowWidth - 24, 380);
  const cellSize = size / 15;
  const tokenSize = cellSize * 0.82;

  // Center dice dimensions
  const centerBoxSize = cellSize * 3;
  const centerBoxLeft = cellSize * 6;
  const centerBoxTop = cellSize * 6;
  const boardDiceSize = Math.min(centerBoxSize * 0.76, 56);

  // Dynamic board rumble / physical impact shake
  const boardShakeX = useRef(new Animated.Value(0)).current;
  const boardShakeY = useRef(new Animated.Value(0)).current;

  const triggerBoardShake = (intensity = 2.5) => {
    Animated.sequence([
      Animated.timing(boardShakeX, { toValue: intensity, duration: 30, useNativeDriver: true }),
      Animated.timing(boardShakeX, { toValue: -intensity, duration: 30, useNativeDriver: true }),
      Animated.timing(boardShakeX, { toValue: intensity * 0.5, duration: 30, useNativeDriver: true }),
      Animated.timing(boardShakeX, { toValue: 0, duration: 30, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.timing(boardShakeY, { toValue: -intensity, duration: 30, useNativeDriver: true }),
      Animated.timing(boardShakeY, { toValue: intensity, duration: 30, useNativeDriver: true }),
      Animated.timing(boardShakeY, { toValue: 0, duration: 30, useNativeDriver: true }),
    ]).start();
  };

  // Shake board with high intensity on token capture fire blast
  useEffect(() => {
    if (captureEvent) {
      triggerBoardShake(5.0);
    }
  }, [captureEvent]);

  // Dice appears on the board only for rolling or displaying rolled result
  const showBoardDice =
    diceState &&
    (diceState.status === GAME_STATUS.WAITING_ROLL ||
      diceState.isRolling ||
      diceState.status === GAME_STATUS.WAITING_TOKEN_SELECT);

  const diceScaleAnim = useRef(new Animated.Value(showBoardDice ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(diceScaleAnim, {
      toValue: showBoardDice ? 1 : 0,
      friction: 5,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }, [showBoardDice, diceScaleAnim]);

  // Track safe cells mapping
  const safeCellKeys = new Set(
    SAFE_TRACK_INDICES.map((idx) => {
      const coord = MAIN_TRACK[idx];
      return `${coord.row},${coord.col}`;
    })
  );

  // Group tokens currently on the board by their coordinates for stacking
  const tokensOnBoard = [];

  players.forEach((player) => {
    player.tokens.forEach((token) => {
      // If token is currently in step-by-step animation, use animated step
      const isMovingThis =
        movingTokenInfo &&
        movingTokenInfo.playerId === player.id &&
        movingTokenInfo.tokenId === token.id;

      const effectiveStep = isMovingThis ? movingTokenInfo.step : token.step;

      const pos = calculateTokenPosition(player.color, effectiveStep, token.id);
      const isCurrentPlayerToken = currentPlayer && currentPlayer.id === player.id;
      const isSelectable = isCurrentPlayerToken && validMoves.includes(token.id);

      tokensOnBoard.push({
        player,
        token,
        row: pos.row,
        col: pos.col,
        effectiveStep,
        isSelectable,
        key: `${player.color}-${token.id}`,
      });
    });
  });

  // Calculate stacking offsets for multiple tokens sharing same row/col on the track
  const coordGroups = {};
  tokensOnBoard.forEach((item) => {
    // Only group tokens on the active track or home, not yard
    if (item.effectiveStep !== STEP.YARD) {
      const key = `${Math.round(item.row * 2) / 2},${Math.round(item.col * 2) / 2}`;
      if (!coordGroups[key]) coordGroups[key] = [];
      coordGroups[key].push(item);
    }
  });

  // Calculate visual pixel offsets
  const renderedTokens = tokensOnBoard.map((item) => {
    let offsetX = 0;
    let offsetY = 0;

    if (item.effectiveStep !== STEP.YARD) {
      const key = `${Math.round(item.row * 2) / 2},${Math.round(item.col * 2) / 2}`;
      const group = coordGroups[key];
      if (group && group.length > 1) {
        const indexInGroup = group.indexOf(item);
        const count = group.length;
        const angle = (2 * Math.PI * indexInGroup) / count;
        const stackRadius = cellSize * 0.22;
        offsetX = Math.cos(angle) * stackRadius;
        offsetY = Math.sin(angle) * stackRadius;
      }
    }

    const pixelX = item.col * cellSize + (cellSize - tokenSize) / 2 + offsetX;
    const pixelY = item.row * cellSize + (cellSize - tokenSize) / 2 + offsetY;

    return {
      ...item,
      pixelX,
      pixelY,
    };
  });

  return (
    <Animated.View
      style={[
        styles.boardWrapper,
        {
          width: size,
          height: size,
          transform: [
            { translateX: boardShakeX },
            { translateY: boardShakeY },
          ],
        },
      ]}
    >
      {/* 1. Scalable SVG Board Base */}
      <Svg width={size} height={size} viewBox="0 0 15 15">
        {/* Background / Track grid */}
        <Rect x="0" y="0" width="15" height="15" fill="#FAFAF9" stroke="#E2E8F0" strokeWidth="0.05" />

        {/* 4 Corner Home Yards (6x6 cells each) */}
        {/* Red Home Base (Top-Left) */}
        <Rect x="0" y="0" width="6" height="6" fill={COLOR_THEMES.RED.primary} />
        <Rect x="0.8" y="0.8" width="4.4" height="4.4" rx="0.5" fill="#FFFFFF" />
        {/* 4 Red Yard Token Base Rings */}
        <Circle cx="1.7" cy="1.7" r="0.65" fill={COLOR_THEMES.RED.light} stroke={COLOR_THEMES.RED.primary} strokeWidth="0.1" />
        <Circle cx="4.3" cy="1.7" r="0.65" fill={COLOR_THEMES.RED.light} stroke={COLOR_THEMES.RED.primary} strokeWidth="0.1" />
        <Circle cx="1.7" cy="4.3" r="0.65" fill={COLOR_THEMES.RED.light} stroke={COLOR_THEMES.RED.primary} strokeWidth="0.1" />
        <Circle cx="4.3" cy="4.3" r="0.65" fill={COLOR_THEMES.RED.light} stroke={COLOR_THEMES.RED.primary} strokeWidth="0.1" />

        {/* Green Home Base (Top-Right) */}
        <Rect x="9" y="0" width="6" height="6" fill={COLOR_THEMES.GREEN.primary} />
        <Rect x="9.8" y="0.8" width="4.4" height="4.4" rx="0.5" fill="#FFFFFF" />
        {/* 4 Green Yard Token Base Rings */}
        <Circle cx="10.7" cy="1.7" r="0.65" fill={COLOR_THEMES.GREEN.light} stroke={COLOR_THEMES.GREEN.primary} strokeWidth="0.1" />
        <Circle cx="13.3" cy="1.7" r="0.65" fill={COLOR_THEMES.GREEN.light} stroke={COLOR_THEMES.GREEN.primary} strokeWidth="0.1" />
        <Circle cx="10.7" cy="4.3" r="0.65" fill={COLOR_THEMES.GREEN.light} stroke={COLOR_THEMES.GREEN.primary} strokeWidth="0.1" />
        <Circle cx="13.3" cy="4.3" r="0.65" fill={COLOR_THEMES.GREEN.light} stroke={COLOR_THEMES.GREEN.primary} strokeWidth="0.1" />

        {/* Yellow Home Base (Bottom-Right) */}
        <Rect x="9" y="9" width="6" height="6" fill={COLOR_THEMES.YELLOW.primary} />
        <Rect x="9.8" y="9.8" width="4.4" height="4.4" rx="0.5" fill="#FFFFFF" />
        {/* 4 Yellow Yard Token Base Rings */}
        <Circle cx="10.7" cy="10.7" r="0.65" fill={COLOR_THEMES.YELLOW.light} stroke={COLOR_THEMES.YELLOW.primary} strokeWidth="0.1" />
        <Circle cx="13.3" cy="10.7" r="0.65" fill={COLOR_THEMES.YELLOW.light} stroke={COLOR_THEMES.YELLOW.primary} strokeWidth="0.1" />
        <Circle cx="10.7" cy="13.3" r="0.65" fill={COLOR_THEMES.YELLOW.light} stroke={COLOR_THEMES.YELLOW.primary} strokeWidth="0.1" />
        <Circle cx="13.3" cy="13.3" r="0.65" fill={COLOR_THEMES.YELLOW.light} stroke={COLOR_THEMES.YELLOW.primary} strokeWidth="0.1" />

        {/* Blue Home Base (Bottom-Left) */}
        <Rect x="0" y="9" width="6" height="6" fill={COLOR_THEMES.BLUE.primary} />
        <Rect x="0.8" y="9.8" width="4.4" height="4.4" rx="0.5" fill="#FFFFFF" />
        {/* 4 Blue Yard Token Base Rings */}
        <Circle cx="1.7" cy="10.7" r="0.65" fill={COLOR_THEMES.BLUE.light} stroke={COLOR_THEMES.BLUE.primary} strokeWidth="0.1" />
        <Circle cx="4.3" cy="10.7" r="0.65" fill={COLOR_THEMES.BLUE.light} stroke={COLOR_THEMES.BLUE.primary} strokeWidth="0.1" />
        <Circle cx="1.7" cy="13.3" r="0.65" fill={COLOR_THEMES.BLUE.light} stroke={COLOR_THEMES.BLUE.primary} strokeWidth="0.1" />
        <Circle cx="4.3" cy="13.3" r="0.65" fill={COLOR_THEMES.BLUE.light} stroke={COLOR_THEMES.BLUE.primary} strokeWidth="0.1" />

        {/* 52 Perimeter Track Cells */}
        {MAIN_TRACK.map((cell, index) => {
          let cellFill = '#FFFFFF';
          let hasStar = false;
          let isStart = false;

          if (index === PLAYER_START_OFFSETS[PLAYER_COLORS.RED]) {
            cellFill = COLOR_THEMES.RED.primary;
            isStart = true;
          } else if (index === PLAYER_START_OFFSETS[PLAYER_COLORS.GREEN]) {
            cellFill = COLOR_THEMES.GREEN.primary;
            isStart = true;
          } else if (index === PLAYER_START_OFFSETS[PLAYER_COLORS.YELLOW]) {
            cellFill = COLOR_THEMES.YELLOW.primary;
            isStart = true;
          } else if (index === PLAYER_START_OFFSETS[PLAYER_COLORS.BLUE]) {
            cellFill = COLOR_THEMES.BLUE.primary;
            isStart = true;
          } else if (SAFE_TRACK_INDICES.includes(index)) {
            hasStar = true;
          }

          return (
            <G key={`track-${index}`}>
              <Rect
                x={cell.col}
                y={cell.row}
                width="1"
                height="1"
                fill={cellFill}
                stroke="#CBD5E1"
                strokeWidth="0.04"
              />
              {/* Star on safe cells */}
              {hasStar && renderStar(cell.col + 0.5, cell.row + 0.5, 0.38, '#F59E0B')}
              {/* White star / marker on start cells */}
              {isStart && renderStar(cell.col + 0.5, cell.row + 0.5, 0.38, '#FFFFFF')}
            </G>
          );
        })}

        {/* Colored Home Lanes (5 cells each) */}
        {/* Red Home Lane (Row 7, cols 1-5) */}
        {HOME_LANES[PLAYER_COLORS.RED].map((cell, idx) => (
          <Rect
            key={`red-lane-${idx}`}
            x={cell.col}
            y={cell.row}
            width="1"
            height="1"
            fill={COLOR_THEMES.RED.primary}
            stroke="#CBD5E1"
            strokeWidth="0.04"
          />
        ))}

        {/* Green Home Lane (Col 7, rows 1-5) */}
        {HOME_LANES[PLAYER_COLORS.GREEN].map((cell, idx) => (
          <Rect
            key={`green-lane-${idx}`}
            x={cell.col}
            y={cell.row}
            width="1"
            height="1"
            fill={COLOR_THEMES.GREEN.primary}
            stroke="#CBD5E1"
            strokeWidth="0.04"
          />
        ))}

        {/* Yellow Home Lane (Row 7, cols 9-13) */}
        {HOME_LANES[PLAYER_COLORS.YELLOW].map((cell, idx) => (
          <Rect
            key={`yellow-lane-${idx}`}
            x={cell.col}
            y={cell.row}
            width="1"
            height="1"
            fill={COLOR_THEMES.YELLOW.primary}
            stroke="#CBD5E1"
            strokeWidth="0.04"
          />
        ))}

        {/* Blue Home Lane (Col 7, rows 9-13) */}
        {HOME_LANES[PLAYER_COLORS.BLUE].map((cell, idx) => (
          <Rect
            key={`blue-lane-${idx}`}
            x={cell.col}
            y={cell.row}
            width="1"
            height="1"
            fill={COLOR_THEMES.BLUE.primary}
            stroke="#CBD5E1"
            strokeWidth="0.04"
          />
        ))}

        {/* Central Home Destination (3x3 units: rows 6-8, cols 6-8) */}
        {/* Left triangle: Red */}
        <Polygon points="6,6 7.5,7.5 6,9" fill={COLOR_THEMES.RED.primary} />
        {/* Top triangle: Green */}
        <Polygon points="6,6 7.5,7.5 9,6" fill={COLOR_THEMES.GREEN.primary} />
        {/* Right triangle: Yellow */}
        <Polygon points="9,6 7.5,7.5 9,9" fill={COLOR_THEMES.YELLOW.primary} />
        {/* Bottom triangle: Blue */}
        <Polygon points="6,9 7.5,7.5 9,9" fill={COLOR_THEMES.BLUE.primary} />

        {/* Center Royal Arena Stadium Rings */}
        <Circle cx="7.5" cy="7.5" r="1.38" fill="rgba(255, 255, 255, 0.16)" stroke="#FFD700" strokeWidth="0.08" strokeDasharray="0.2, 0.1" />
        <Circle cx="7.5" cy="7.5" r="0.95" fill="rgba(255, 215, 0, 0.22)" stroke="#FFFFFF" strokeWidth="0.05" />
        {/* Center Golden Medal */}
        <Circle cx="7.5" cy="7.5" r="0.65" fill="#FFD700" stroke="#FFFFFF" strokeWidth="0.08" />
      </Svg>

      {/* 2. Interactive Tokens Layer Overlay */}
      {renderedTokens.map((item) => (
        <View
          key={item.key}
          style={[
            styles.tokenAbsolute,
            {
              left: item.pixelX,
              top: item.pixelY,
            },
          ]}
        >
          <LudoToken
            colorKey={item.player.color}
            size={tokenSize}
            isSelectable={item.isSelectable}
            onPress={() => onSelectToken(item.token.id)}
            tokenIndex={item.token.id}
          />
        </View>
      ))}

      {/* 3. Center Game Board Dice Station (Tumbles dynamically within board bounds) */}
      {showBoardDice && diceState && (
        <Animated.View
          style={[
            styles.centerDiceContainer,
            {
              left: centerBoxLeft,
              top: centerBoxTop,
              width: centerBoxSize,
              height: centerBoxSize,
              transform: [{ scale: diceScaleAnim }],
            },
          ]}
        >
          <Dice
            value={diceState.diceValue}
            isRolling={diceState.isRolling}
            disabled={diceState.disabled}
            onRoll={diceState.onRoll}
            playerColor={currentPlayer ? currentPlayer.color : 'RED'}
            size={boardDiceSize}
            boardSize={size}
            onBounceImpact={() => triggerBoardShake(2.0)}
            showBadge={diceState.status === GAME_STATUS.WAITING_ROLL && !diceState.isRolling}
          />
        </Animated.View>
      )}

      {/* 4. Fire Blast Knockout Effect Overlay */}
      {captureEvent && (
        <FireCaptureEffect
          key={captureEvent.id}
          x={captureEvent.col * cellSize}
          y={captureEvent.row * cellSize}
          cellSize={cellSize}
          onComplete={onClearCapture}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  boardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#1E293B',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    position: 'relative',
    alignSelf: 'center',
  },
  centerDiceContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    zIndex: 200,
  },
  tokenAbsolute: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
