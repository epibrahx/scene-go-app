import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { colors, radii, fonts } from '../theme/tokens';
import { Locale, translate } from '../i18n';

export interface CompliancePanelProps {
  locale: Locale;
}

export function CompliancePanel({ locale }: CompliancePanelProps) {
  const openPrivacy = () => {
    Linking.openURL('https://scenego.app/privacy');
  };

  const openTerms = () => {
    Linking.openURL('https://scenego.app/terms');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.disclaimer}>
        {translate(locale, 'consent.description')}
      </Text>
      <View style={styles.links}>
        <TouchableOpacity onPress={openPrivacy}>
          <Text style={styles.linkText}>{translate(locale, 'settings.privacyPolicy')}</Text>
        </TouchableOpacity>
        <Text style={styles.separator}>・</Text>
        <TouchableOpacity onPress={openTerms}>
          <Text style={styles.linkText}>{translate(locale, 'settings.termsOfService')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCardLight,
    padding: 16,
    borderRadius: radii.r16,
    marginTop: 16,
  },
  disclaimer: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.accentBlue,
  },
  separator: {
    color: colors.textTertiary,
    marginHorizontal: 8,
  },
});
