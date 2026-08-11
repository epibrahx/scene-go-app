import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radii } from '../theme/tokens';

export interface SafetyFABProps {
  onPress: () => void;
}

/**
 * 全局安全悬浮球（DESIGN-v2.1.pen SafetyFAB 组件）。
 * 56px 红圆；无 SVG 库，以「安」字替代 shield 图标（红线：图标用文字）。
 */
export function SafetyFAB({ onPress }: SafetyFABProps) {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="安全"
    >
      <Text style={styles.icon}>安</Text>
      <Text style={styles.badge}>安全</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    backgroundColor: colors.accentRed,
    borderRadius: radii.r28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  icon: { color: '#ffffff', fontSize: 18, fontWeight: '700', lineHeight: 20 },
  badge: { color: '#ffffff', fontSize: 8, fontWeight: '500', marginTop: 1 },
});
