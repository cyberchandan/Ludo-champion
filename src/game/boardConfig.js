/**
 * Ludo Champion - Board Configuration and Coordinate System
 * 15x15 Logical Grid (rows 0-14, cols 0-14)
 */

import { PLAYER_COLORS, STEP } from './constants';

export const GRID_SIZE = 15;

// Main circular 52-cell track coordinates in clockwise order starting from RED start cell
export const MAIN_TRACK = [
  // 0 - 4: Left arm upper row (moving right towards top arm)
  { row: 6, col: 1 },  // 0: RED START (Safe)
  { row: 6, col: 2 },  // 1
  { row: 6, col: 3 },  // 2
  { row: 6, col: 4 },  // 3
  { row: 6, col: 5 },  // 4

  // 5 - 10: Top arm left col (moving up)
  { row: 5, col: 6 },  // 5
  { row: 4, col: 6 },  // 6
  { row: 3, col: 6 },  // 7
  { row: 2, col: 6 },  // 8: STAR SAFE
  { row: 1, col: 6 },  // 9
  { row: 0, col: 6 },  // 10

  // 11 - 12: Top edge crossing to right col
  { row: 0, col: 7 },  // 11
  { row: 0, col: 8 },  // 12

  // 13 - 17: Top arm right col (moving down)
  { row: 1, col: 8 },  // 13: GREEN START (Safe)
  { row: 2, col: 8 },  // 14
  { row: 3, col: 8 },  // 15
  { row: 4, col: 8 },  // 16
  { row: 5, col: 8 },  // 17

  // 18 - 23: Right arm top row (moving right)
  { row: 6, col: 9 },  // 18
  { row: 6, col: 10 }, // 19
  { row: 6, col: 11 }, // 20
  { row: 6, col: 12 }, // 21: STAR SAFE
  { row: 6, col: 13 }, // 22
  { row: 6, col: 14 }, // 23

  // 24 - 25: Right edge crossing to bottom row
  { row: 7, col: 14 }, // 24
  { row: 8, col: 14 }, // 25

  // 26 - 30: Right arm bottom row (moving left)
  { row: 8, col: 13 }, // 26: YELLOW START (Safe)
  { row: 8, col: 12 }, // 27
  { row: 8, col: 11 }, // 28
  { row: 8, col: 10 }, // 29
  { row: 8, col: 9 },  // 30

  // 31 - 36: Bottom arm right col (moving down)
  { row: 9, col: 8 },  // 31
  { row: 10, col: 8 }, // 32
  { row: 11, col: 8 }, // 33
  { row: 12, col: 8 }, // 34: STAR SAFE
  { row: 13, col: 8 }, // 35
  { row: 14, col: 8 }, // 36

  // 37 - 38: Bottom edge crossing to left col
  { row: 14, col: 7 }, // 37
  { row: 14, col: 6 }, // 38

  // 39 - 43: Bottom arm left col (moving up)
  { row: 13, col: 6 }, // 39: BLUE START (Safe)
  { row: 12, col: 6 }, // 40
  { row: 11, col: 6 }, // 41
  { row: 10, col: 6 }, // 42
  { row: 9, col: 6 },  // 43

  // 44 - 49: Left arm bottom row (moving left)
  { row: 8, col: 5 },  // 44
  { row: 8, col: 4 },  // 45
  { row: 8, col: 3 },  // 46
  { row: 8, col: 2 },  // 47: STAR SAFE
  { row: 8, col: 1 },  // 48
  { row: 8, col: 0 },  // 49

  // 50 - 51: Left edge crossing to top row
  { row: 7, col: 0 },  // 50
  { row: 6, col: 0 },  // 51
];

// Starting track index offset for each player
export const PLAYER_START_OFFSETS = {
  [PLAYER_COLORS.RED]: 0,
  [PLAYER_COLORS.GREEN]: 13,
  [PLAYER_COLORS.YELLOW]: 26,
  [PLAYER_COLORS.BLUE]: 39,
};

// 8 Traditional Safe Cells on the 52-cell track
export const SAFE_TRACK_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

// 5 colored Home Lane cells for each player
export const HOME_LANES = {
  [PLAYER_COLORS.RED]: [
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
  ],
  [PLAYER_COLORS.GREEN]: [
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 },
  ],
  [PLAYER_COLORS.YELLOW]: [
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col: 9 },
  ],
  [PLAYER_COLORS.BLUE]: [
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 7 },
  ],
};

// Yard slot positions (4 per player)
export const YARD_SLOTS = {
  [PLAYER_COLORS.RED]: [
    { row: 1.7, col: 1.7 },
    { row: 1.7, col: 3.7 },
    { row: 3.7, col: 1.7 },
    { row: 3.7, col: 3.7 },
  ],
  [PLAYER_COLORS.GREEN]: [
    { row: 1.7, col: 10.7 },
    { row: 1.7, col: 12.7 },
    { row: 3.7, col: 10.7 },
    { row: 3.7, col: 12.7 },
  ],
  [PLAYER_COLORS.YELLOW]: [
    { row: 10.7, col: 10.7 },
    { row: 10.7, col: 12.7 },
    { row: 12.7, col: 10.7 },
    { row: 12.7, col: 12.7 },
  ],
  [PLAYER_COLORS.BLUE]: [
    { row: 10.7, col: 1.7 },
    { row: 10.7, col: 3.7 },
    { row: 12.7, col: 1.7 },
    { row: 12.7, col: 3.7 },
  ],
};

// Center Home Destination positions for tokens that finished
export const HOME_DESTINATIONS = {
  [PLAYER_COLORS.RED]: { row: 7, col: 6.2 },
  [PLAYER_COLORS.GREEN]: { row: 6.2, col: 7 },
  [PLAYER_COLORS.YELLOW]: { row: 7, col: 7.8 },
  [PLAYER_COLORS.BLUE]: { row: 7.8, col: 7 },
};

/**
 * Converts a player's token step into grid row and col
 * @param {string} playerColor 
 * @param {number} step - (-1 for yard, 0..50 for main track, 51..55 for home lane, 56 for home)
 * @param {number} tokenIndex - 0..3
 * @returns {{ row: number, col: number, isSafe: boolean, isHome: boolean, isYard: boolean, isLane: boolean, trackIndex: number|null }}
 */
export function calculateTokenPosition(playerColor, step, tokenIndex = 0) {
  if (step === STEP.YARD) {
    const yard = YARD_SLOTS[playerColor][tokenIndex] || YARD_SLOTS[playerColor][0];
    return {
      row: yard.row,
      col: yard.col,
      isSafe: true,
      isHome: false,
      isYard: true,
      isLane: false,
      trackIndex: null,
    };
  }

  if (step === STEP.FINAL_HOME) {
    const home = HOME_DESTINATIONS[playerColor];
    // Slightly adjust per token index for neat stacking
    const offsetMap = [
      { r: -0.15, c: -0.15 },
      { r: -0.15, c: 0.15 },
      { r: 0.15, c: -0.15 },
      { r: 0.15, c: 0.15 },
    ];
    const off = offsetMap[tokenIndex % 4];
    return {
      row: home.row + off.r,
      col: home.col + off.c,
      isSafe: true,
      isHome: true,
      isYard: false,
      isLane: false,
      trackIndex: null,
    };
  }

  if (step >= STEP.HOME_LANE_START && step <= STEP.HOME_LANE_END) {
    const laneIndex = step - STEP.HOME_LANE_START;
    const laneCoord = HOME_LANES[playerColor][laneIndex];
    return {
      row: laneCoord.row,
      col: laneCoord.col,
      isSafe: true, // Home lanes are completely safe from capture
      isHome: false,
      isYard: false,
      isLane: true,
      trackIndex: null,
    };
  }

  if (step >= STEP.START && step <= STEP.MAIN_TRACK_END) {
    const startOffset = PLAYER_START_OFFSETS[playerColor];
    const trackIndex = (startOffset + step) % MAIN_TRACK.length;
    const trackCoord = MAIN_TRACK[trackIndex];
    const isSafe = SAFE_TRACK_INDICES.includes(trackIndex);

    return {
      row: trackCoord.row,
      col: trackCoord.col,
      isSafe,
      isHome: false,
      isYard: false,
      isLane: false,
      trackIndex,
    };
  }

  // Fallback
  return {
    row: 7,
    col: 7,
    isSafe: true,
    isHome: false,
    isYard: false,
    isLane: false,
    trackIndex: null,
  };
}

/**
 * Checks whether a main track index is a safe square
 * @param {number} trackIndex 
 * @returns {boolean}
 */
export function checkSafeSquare(trackIndex) {
  if (trackIndex === null || trackIndex === undefined) return true;
  return SAFE_TRACK_INDICES.includes(trackIndex);
}
