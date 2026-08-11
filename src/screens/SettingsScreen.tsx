import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native';
import Constants from 'expo-constants';
import { Locale, TranslationKey, translate } from '../i18n';
import { AppAction } from '../app/appReducer';
import { colors, fonts, radii } from '../theme/tokens';

export interface SettingsScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
}

/** 设置行：目的地与语言 / 安全信息 / 关于与帮助 / 隐私 */
interface SettingRow {
  key: 'country' | 'safetyInfo' | 'about' | 'privacy';
  icon: string;
  label: string;
}

const ROWS: SettingRow[] = [
  { key: 'country', icon: '◎', label: '目的地与语言' },
  { key: 'safetyInfo', icon: '◈', label: '安全信息' },
  { key: 'about', icon: 'ℹ', label: '关于与帮助' },
  { key: 'privacy', icon: '◇', label: '隐私' },
];

/**
 * 13 更多 · 设置聚合（DESIGN-v2.1.pen 13 屏）。
 * 设置组卡（目的地与语言→06 / 安全信息→10 / 关于与帮助 / 隐私）+ 版本号。
 */
export default function SettingsScreen({ locale, dispatch }: SettingsScreenProps) {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const onRow = (key: SettingRow['key']) => {
    switch (key) {
      case 'country':
        dispatch({ type: 'navigate', route: 'country' });
        return;
      case 'safetyInfo':
        dispatch({ type: 'navigate', route: 'safetyInfo' });
        return;
      case 'about':
        Alert.alert(
          translate(locale, 'settings13.aboutTitle'),
          translate(locale, 'settings13.aboutDesc', { version }),
        );
        return;
      case 'privacy':
        Alert.alert(
          translate(locale, 'settings13.privacyTitle'),
          translate(locale, 'settings13.privacyDesc'),
        );
        return;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Head（画布无返回钮；自用加返回入口回首页） */}
      <View style={styles.head}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => dispatch({ type: 'navigate', route: 'home' })}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headTitle}>{translate(locale, 'settings13.title')}</Text>
      </View>

      <View style={styles.settingsWrap}>
        <View style={styles.group}>
          {ROWS.map((row, idx) => (
            <React.Fragment key={row.key}>
              {idx > 0 ? <View style={styles.divider} /> : null}
              <TouchableOpacity
                style={styles.setRow}
                onPress={() => onRow(row.key)}
                accessibilityRole="button"
              >
                <Text style={styles.setIcon}>{row.icon}</Text>
                <Text style={styles.setLabel}>{translate(locale, `settings13.row${row.key}` as TranslationKey)}</Text>
                <Text style={styles.setChevron}>›</Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.appVersion}>{translate(locale, 'settings13.versionLabel', { version })}</Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgPrimary },
  head: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: colors.textPrimary, fontSize: 24, lineHeight: 26, marginTop: -2 },
  headTitle: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 20, fontWeight: '600', marginLeft: 8 },
  settingsWrap: {
    flex: 1,
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  group: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.r16,
    paddingVertical: 4,
  },
  divider: { height: 1, backgroundColor: colors.borderSubtle },
  setRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  setIcon: { color: colors.textSecondary, fontSize: 16, width: 22 },
  setLabel: { flex: 1, fontFamily: fonts.body, color: colors.textPrimary, fontSize: 15 },
  setChevron: { color: colors.textTertiary, fontSize: 16 },
  appVersion: { fontFamily: fonts.body, color: colors.textTertiary, fontSize: 12, textAlign: 'center' },
});
