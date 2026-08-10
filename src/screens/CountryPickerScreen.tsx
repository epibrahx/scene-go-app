import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Locale, translate } from '../i18n';
import { AppAction } from '../app/appReducer';
import { colors, fonts, radii } from '../theme/tokens';
import { COUNTRY_SAFETY_CANDIDATES } from '../data/safety/candidates';
import { getCachedSettings, saveAppSettings, TARGET_LANGS } from '../utils/appSettings';
import { getSafetyRecord } from '../data/safety/registry';

export interface CountryPickerScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
}

export default function CountryPickerScreen({ locale, dispatch }: CountryPickerScreenProps) {
  const [search, setSearch] = useState('');
  
  const filtered = COUNTRY_SAFETY_CANDIDATES.filter((c) => {
    const term = search.toLowerCase();
    return c.nameZh.toLowerCase().includes(term) || c.nameEn.toLowerCase().includes(term);
  });

  const handleSelect = (countryCode: string) => {
    const candidate = COUNTRY_SAFETY_CANDIDATES.find(c => c.code === countryCode);
    if (!candidate) return;

    const langName = TARGET_LANGS.find(l => l.code === candidate.langCode)?.name ?? candidate.langCode;
    const countryName = locale === 'zh-Hans' ? candidate.nameZh : candidate.nameEn;

    const message = translate(locale, 'countryUI.confirmSwitch')
      .replace('{{country}}', countryName)
      .replace('{{lang}}', langName);

    Alert.alert(
      translate(locale, 'countryUI.locationSuggestion'),
      message,
      [
        { text: translate(locale, 'common.cancel'), style: 'cancel' },
        { 
          text: translate(locale, 'common.success'), 
          onPress: async () => {
            const settings = getCachedSettings();
            await saveAppSettings({
              ...settings,
              destination: { countryCode, name: countryName },
              targetLanguage: { code: candidate.langCode, name: langName }
            });
            dispatch({ type: 'navigate', route: 'home' });
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
        <Text style={styles.title}>{translate(locale, 'countryUI.title')}</Text>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={translate(locale, 'countryUI.searchPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => item.code}
        renderItem={({ item }) => {
          const name = locale === 'zh-Hans' ? item.nameZh : item.nameEn;
          const record = getSafetyRecord(item.code);
          const isDraft = !record || record.publicationStatus === 'draft';
          return (
            <TouchableOpacity style={styles.row} onPress={() => handleSelect(item.code)}>
              <Text style={styles.rowText}>{name}</Text>
              <Text style={[styles.statusText, isDraft && styles.statusDraft]}>
                {isDraft ? translate(locale, 'safety.unverified') : translate(locale, 'countryUI.safetyStatus')}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>{translate(locale, 'common.empty')}</Text>}
      />
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
    paddingRight: 40, // offset back button
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: colors.bgCardLight,
    color: colors.textPrimary,
    padding: 12,
    borderRadius: radii.r10,
    fontSize: 16,
    fontFamily: fonts.body,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
  },
  rowText: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  statusText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.accentGreen,
  },
  statusDraft: {
    color: colors.textTertiary,
  },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    padding: 32,
    fontFamily: fonts.body,
  }
});
