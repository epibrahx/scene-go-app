import React from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Locale, translate } from '../i18n';
import { AppAction } from '../app/appReducer';
import { colors, fonts, radii } from '../theme/tokens';
import { getSafetyRecord } from '../data/safety/registry';
import { getPublishedSafetyView, isExpired, canPublishSafety } from '../data/safety/publicationGate';
import { getCachedSettings } from '../utils/appSettings';

export interface SafetyCardScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
}

export default function SafetyCardScreen({ locale, dispatch }: SafetyCardScreenProps) {
  const settings = getCachedSettings();
  const countryCode = settings.destination.countryCode;
  
  const record = getSafetyRecord(countryCode);
  const isDraft = !record || !canPublishSafety(record);
  const isDataExpired = record ? isExpired(record) : true;

  const view = record ? getPublishedSafetyView(record) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => dispatch({ type: 'navigate', route: 'home' })}>
          <Text style={styles.backText}>{translate(locale, 'card.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{translate(locale, 'safetyUI.title')}</Text>
      </View>
      <ScrollView style={styles.content}>
        
        {isDraft && (
          <View style={[styles.alertBanner, styles.draftBanner]}>
            <Text style={styles.alertText}>{translate(locale, 'safetyUI.unverifiedWarning')}</Text>
          </View>
        )}

        {!isDraft && isDataExpired && (
          <View style={[styles.alertBanner, styles.expiredBanner]}>
            <Text style={styles.alertText}>{translate(locale, 'safetyUI.expiredWarning')}</Text>
          </View>
        )}

        {view && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{locale === 'zh-Hans' ? '入境与风俗' : 'Customs Preview'}</Text>
              <Text style={styles.customsText}>{translate(locale, 'safetyUI.tipping')}: {view.tipping}</Text>
              <Text style={styles.customsText}>{translate(locale, 'safetyUI.voltage')}: {view.voltage}</Text>
              <Text style={styles.customsText}>{translate(locale, 'safetyUI.currency')}: {view.currency}</Text>
              <Text style={styles.customsText}>{translate(locale, 'safetyUI.water')}: {view.water}</Text>
            </View>

            <TouchableOpacity 
              style={styles.detailButton} 
              onPress={() => dispatch({ type: 'navigate', route: 'safetyDetail' })}
            >
              <Text style={styles.detailButtonText}>{translate(locale, 'safetyUI.viewDetail')}</Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
  },
  backButton: {
    paddingRight: 16,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: fonts.body,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: fonts.body,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingRight: 40,
  },
  content: {
    padding: 16,
  },
  alertBanner: {
    padding: 12,
    borderRadius: radii.r10,
    marginBottom: 16,
  },
  draftBanner: {
    backgroundColor: colors.accentYellow + '22',
    borderColor: colors.accentYellow,
    borderWidth: 1,
  },
  expiredBanner: {
    backgroundColor: colors.accentRed + '22',
    borderColor: colors.accentRed,
    borderWidth: 1,
  },
  alertText: {
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  section: {
    backgroundColor: colors.bgCardLight,
    padding: 16,
    borderRadius: radii.r16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: fonts.body,
  },
  customsText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    fontFamily: fonts.body,
  },
  detailButton: {
    backgroundColor: colors.accentBlue,
    padding: 16,
    borderRadius: radii.r12,
    alignItems: 'center',
  },
  detailButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.body,
  }
});
