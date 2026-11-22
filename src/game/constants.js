/**
 * Ludo Champion - Game Constants
 */

export const PLAYER_COLORS = {
  RED: 'RED',
  GREEN: 'GREEN',
  YELLOW: 'YELLOW',
  BLUE: 'BLUE',
};

export const COLOR_ORDER = [
  PLAYER_COLORS.RED,
  PLAYER_COLORS.GREEN,
  PLAYER_COLORS.YELLOW,
  PLAYER_COLORS.BLUE,
];

export const COLOR_THEMES = {
  RED: {
    primary: '#E53935',
    dark: '#B71C1C',
    light: '#FFCDD2',
    accent: '#FF5252',
    name: 'Red',
    contrastText: '#FFFFFF',
  },
  GREEN: {
    primary: '#2E7D32',
    dark: '#1B5E20',
    light: '#C8E6C9',
    accent: '#4CAF50',
    name: 'Green',
    contrastText: '#FFFFFF',
  },
  YELLOW: {
    primary: '#FBC02D',
    dark: '#F57F17',
    light: '#FFF9C4',
    accent: '#FFEB3B',
    name: 'Yellow',
    contrastText: '#1A1A2E',
  },
  BLUE: {
    primary: '#1976D2',
    dark: '#0D47A1',
    light: '#BBDEFB',
    accent: '#2196F3',
    name: 'Blue',
    contrastText: '#FFFFFF',
  },
};

export const STEP = {
  YARD: -1,
  START: 0,
  MAIN_TRACK_END: 50,
  HOME_LANE_START: 51,
  HOME_LANE_END: 55,
  FINAL_HOME: 56,
};

export const GAME_STATUS = {
  WAITING_ROLL: 'WAITING_ROLL',
  ROLLING: 'ROLLING',
  WAITING_TOKEN_SELECT: 'WAITING_TOKEN_SELECT',
  MOVING: 'MOVING',
  GAME_OVER: 'GAME_OVER',
};

export const RULES = {
  DICE_MIN: 1,
  DICE_MAX: 6,
  ROLL_TO_EXIT_YARD: 6,
  MAX_CONSECUTIVE_SIXES: 3,
  TOTAL_TOKENS_PER_PLAYER: 4,
};
