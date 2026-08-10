import React from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Locale, translate } from '../i18n';
import { AppAction } from '../app/appReducer';
import { colors, fonts, radii } from '../theme/tokens';
import { getCachedSettings, saveAppSettings } from '../utils/appSettings';
import { CompliancePanel } from '../components/CompliancePanel';
import { clearAllLocalData } from '../storage/localRepository';

export interface SettingsScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
}

export default function SettingsScreen({ locale, dispatch }: SettingsScreenProps) {
  const settings = getCachedSettings();

  const handleLanguageToggle = async () => {
    const nextLocale = settings.uiLocale === 'zh-Hans' ? 'en' : 'zh-Hans';
    await saveAppSettings({ ...settings, uiLocale: nextLocale });
    // Note: To fully apply locale instantly, AppShell usually listens to settings. 
    // This is handled by a listener or reload in production.
  };

  const handleClearData = () => {
    Alert.alert(
      translate(locale, 'settings.clearData'),
      translate(locale, 'settings.clearConfirm'),
      [
        { text: translate(locale, 'common.cancel'), style: 'cancel' },
        { 
          text: translate(locale, 'common.success'),
          style: 'destructive',
          onPress: async () => {
            await clearAllLocalData();
            Alert.alert(translate(locale, 'settings.clearDone'));
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => dispatch({ type: 'navigate', route: 'home' })}>
          <Text style={styles.backText}>{translate(locale, 'card.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{translate(locale, 'settings.title')}</Text>
      </View>
      <ScrollView style={styles.content}>
        
        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={handleLanguageToggle}>
            <Text style={styles.rowLabel}>{translate(locale, 'settings.uiLanguage')}</Text>
            <Text style={styles.rowValue}>{settings.uiLocale === 'zh-Hans' ? '简体中文' : 'English'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => dispatch({ type: 'navigate', route: 'country' })}>
            <Text style={styles.rowLabel}>{translate(locale, 'settings.destination')}</Text>
            <Text style={styles.rowValue}>{settings.destination.name} &gt;</Text>
          </TouchableOpacity>
        </View>

        <CompliancePanel locale={locale} />

        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={handleClearData}>
            <Text style={[styles.rowLabel, styles.dangerText]}>{translate(locale, 'settings.clearData')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>{translate(locale, 'settings.version')} 1.0.0</Text>
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
  section: {
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r16,
    marginTop: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  rowValue: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  dangerText: {
    color: colors.accentRed,
  },
  version: {
    textAlign: 'center',
    marginTop: 32,
    color: colors.textTertiary,
    fontSize: 13,
    fontFamily: fonts.body,
  }
});
