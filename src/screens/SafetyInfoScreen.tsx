import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native';
import { Locale, translate } from '../i18n';
import { AppAction } from '../app/appReducer';
import { colors, fonts, radii } from '../theme/tokens';
import { COUNTRY_SAFETY_CANDIDATES } from '../data/safety/candidates';
import { LANG_NAME_BY_CODE } from '../data/countries';
import { getCachedSettings } from '../utils/appSettings';

export interface SafetyInfoScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
}

/**
 * 10 安全信息 · 26 国（DESIGN-v2.1.pen 10 屏）。
 * 摘要卡（离线可用）+ 26 国列表（国家 / 语言 / 已就绪）。
 */
export default function SafetyInfoScreen({ locale, dispatch }: SafetyInfoScreenProps) {
  const settings = getCachedSettings();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Head */}
      <View style={styles.head}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => dispatch({ type: 'navigate', route: 'settings' })}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headTitle}>{translate(locale, 'safety10.title')}</Text>
        <Text style={styles.headLoc}>{translate(locale, 'safety10.headLoc')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary */}
        <View style={styles.sumCard}>
          <View style={styles.sumRow}>
            <View style={styles.sumIconBox}>
              <Text style={styles.sumIcon}>◉</Text>
            </View>
            <View style={styles.sumCol}>
              <Text style={styles.sumTitle}>{translate(locale, 'safety10.ready')}</Text>
              <Text style={styles.sumSub}>{translate(locale, 'safety10.readySub')}</Text>
            </View>
            <Text style={styles.sumBadge}>{translate(locale, 'safety10.offline')}</Text>
          </View>
        </View>

        {/* Country list */}
        <Text style={styles.listLabel}>
          {translate(locale, 'safety10.listLabel', { count: String(COUNTRY_SAFETY_CANDIDATES.length) })}
        </Text>
        {COUNTRY_SAFETY_CANDIDATES.map((c) => {
          const current = c.code === settings.destination.countryCode;
          return (
            <TouchableOpacity
              key={c.code}
              style={[styles.row, current ? styles.rowCurrent : null]}
              onPress={current ? () => dispatch({ type: 'navigate', route: 'safety' }) : undefined}
              disabled={!current}
              accessibilityRole={current ? 'button' : undefined}
            >
              <Text style={styles.rowName}>{c.nameZh}</Text>
              <Text style={styles.rowLang}>{LANG_NAME_BY_CODE[c.langCode] ?? c.langCode}</Text>
              <View style={styles.rowOk}>
                <Text style={styles.rowOkIcon}>✓</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Hint */}
      <View style={styles.hintWrap}>
        <Text style={styles.hint}>{translate(locale, 'safety10.hint')}</Text>
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
  headTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.body,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  headLoc: { position: 'absolute', right: 20, fontFamily: fonts.body, color: colors.textTertiary, fontSize: 12 },
  content: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  sumCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.r16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 16,
  },
  sumRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sumIconBox: {
    width: 44,
    height: 44,
    backgroundColor: colors.accentGreenBg,
    borderRadius: radii.r12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sumIcon: { color: colors.accentGreen, fontSize: 20 },
  sumCol: { flex: 1, gap: 3 },
  sumTitle: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  sumSub: { fontFamily: fonts.body, color: colors.textTertiary, fontSize: 11 },
  sumBadge: {
    fontFamily: fonts.mono,
    color: colors.accentGreen,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  listLabel: {
    fontFamily: fonts.mono,
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bgCard,
    borderRadius: radii.r12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  rowCurrent: { borderColor: colors.borderBlue },
  rowName: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  rowLang: { fontFamily: fonts.body, color: colors.textTertiary, fontSize: 11 },
  rowOk: { flex: 1, alignItems: 'flex-end' },
  rowOkIcon: { color: colors.accentGreen, fontSize: 13 },
  hintWrap: { alignItems: 'center', paddingVertical: 14 },
  hint: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11 },
});
