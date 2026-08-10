import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { colors, radii, fonts } from '../theme/tokens';
import { Locale, translate } from '../i18n';
import { AppAction } from '../app/appReducer';

export interface SafetyFABProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
}

export function SafetyFAB({ locale, dispatch }: SafetyFABProps) {
  const onPress = () => {
    dispatch({ type: 'navigate', route: 'safety' });
  };

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={translate(locale, 'safetyUI.title')}
      accessibilityHint={translate(locale, 'screens.safety.description')}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>🛡️</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 120, // Above tab bar/input composer
    right: 20,
    width: 56,
    height: 56,
    borderRadius: radii.r28,
    backgroundColor: colors.bgCardLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderColor: colors.borderLight,
    borderWidth: 1,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
});
