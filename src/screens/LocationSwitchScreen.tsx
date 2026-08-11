import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Locale, translate } from '../i18n';
import { AppAction } from '../app/appReducer';
import { colors, fonts, radii } from '../theme/tokens';
import { getCachedSettings, saveAppSettings } from '../utils/appSettings';
import { getPlaceContext, PlaceContext } from '../utils/locationContext';
import { COUNTRY_SAFETY_CANDIDATES } from '../data/safety/candidates';
import { DEST_LANG_NAMES } from '../data/countries';

export interface LocationSwitchScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
}

/**
 * 09 位置切换提示（DESIGN-v2.1.pen 09 屏，模态）。
 * 检测到位置变化 → 预览切换后语言对与紧急电话 → 确认切换或保持。
 */
export default function LocationSwitchScreen({ locale, dispatch }: LocationSwitchScreenProps) {
  const settings = getCachedSettings();
  const [place, setPlace] = useState<PlaceContext | null>(null);

  useEffect(() => {
    let mounted = true;
    void getPlaceContext(true).then((p) => {
      if (mounted) setPlace(p);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const target = COUNTRY_SAFETY_CANDIDATES.find((c) => c.code === place?.countryCode);
  const sourceLang = locale === 'zh-Hans' ? '普通话' : 'English';
  const fromPlace = `${settings.destination.name}${place?.city ? ` · ${place.city}` : ''}`;
  const toPlace = place ? `${place.country ?? place.countryCode ?? ''}${place.city ? ` · ${place.city}` : ''}` : '';

  const doSwitch = async () => {
    if (!target) return;
    await saveAppSettings({
      ...settings,
      destination: { countryCode: target.code, name: target.nameZh },
      targetLanguage: { code: target.langCode, name: DEST_LANG_NAMES[target.code] ?? '泰语' },
    });
    dispatch({ type: 'navigate', route: 'safety' });
  };

  return (
    <View style={styles.mask}>
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>◎</Text>
        </View>
        <Text style={styles.title}>{translate(locale, 'loc09.title')}</Text>
        <Text style={styles.desc}>
          {translate(locale, 'loc09.desc', { from: fromPlace, to: toPlace || (place?.countryCode ?? '') })}
        </Text>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.keepBtn}
            onPress={() => dispatch({ type: 'navigate', route: 'home' })}
            accessibilityRole="button"
          >
            <Text style={styles.keepText}>{translate(locale, 'loc09.keep')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchBtn, !target ? styles.switchDisabled : null]}
            onPress={() => void doSwitch()}
            disabled={!target}
            accessibilityRole="button"
          >
            <Text style={styles.switchText}>{translate(locale, 'loc09.switch')}</Text>
          </TouchableOpacity>
        </View>

        {target ? (
          <View style={styles.previewCard}>
            <Text style={styles.prevLabel}>{translate(locale, 'loc09.preview')}</Text>
            <Text style={styles.prevLang}>
              {translate(locale, 'loc09.prevLang', {
                source: sourceLang,
                target: DEST_LANG_NAMES[target.code] ?? target.nameZh,
              })}
            </Text>
            <Text style={styles.prevEmer}>
              {translate(locale, 'loc09.prevEmer', {
                police: target.emergency.police,
                ambulance: target.emergency.ambulance,
              })}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mask: {
    flex: 1,
    backgroundColor: colors.mask,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 330,
    maxWidth: '92%',
    backgroundColor: colors.bgCard,
    borderRadius: radii.r16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 20,
    gap: 12,
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: '#000000',
    borderRadius: radii.r12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { color: colors.accentBlue, fontSize: 20 },
  title: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  desc: {
    fontFamily: fonts.body,
    color: colors.textTertiary,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
  },
  btnRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  keepBtn: {
    flex: 1,
    height: 42,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepText: { fontFamily: fonts.body, color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  switchBtn: {
    flex: 1,
    height: 42,
    backgroundColor: colors.accentBlue,
    borderRadius: radii.r12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchDisabled: { opacity: 0.4 },
  switchText: { fontFamily: fonts.body, color: '#0a0a1e', fontSize: 13, fontWeight: '700' },
  previewCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r16,
    padding: 14,
    gap: 6,
  },
  prevLabel: { fontFamily: fonts.body, color: colors.textTertiary, fontSize: 11 },
  prevLang: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 13 },
  prevEmer: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 13 },
});
