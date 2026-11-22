/**
 * Ludo Champion - LudoCell Component
 * Renders individual grid cell elements, star safe markers, and home lane cells.
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLOR_THEMES } from '../game/constants';

export default function LudoCell({
  type = 'normal', // 'normal', 'safe', 'start', 'homeLane', 'yardSlot'
  colorKey = null,
  size = 24,
  label = null,
}) {
  const theme = colorKey ? COLOR_THEMES[colorKey] : null;

  let backgroundColor = '#FFFFFF';
  let borderColor = '#D1D5DB';

  if (type === 'homeLane' && theme) {
    backgroundColor = theme.primary;
    borderColor = theme.dark;
  } else if (type === 'start' && theme) {
    backgroundColor = theme.primary;
    borderColor = theme.dark;
  } else if (type === 'yardSlot') {
    backgroundColor = '#FFFFFF';
    borderColor = '#9E9E9E';
  }

  return (
    <View
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor,
          borderColor,
        },
      ]}
    >
      {type === 'safe' && (
        <MaterialCommunityIcons name="star" size={size * 0.7} color="#F59E0B" />
      )}
      {type === 'start' && (
        <MaterialCommunityIcons name="star-circle" size={size * 0.75} color="#FFFFFF" />
      )}
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
  },
});
