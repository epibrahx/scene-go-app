import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Locale, translate } from '../i18n';
import { AppAction } from '../app/appReducer';
import { colors, fonts, radii } from '../theme/tokens';
import { getCachedSettings, saveAppSettings } from '../utils/appSettings';
import { getPlaceContext, PlaceContext } from '../utils/locationContext';
import { COUNTRY_SAFETY_CANDIDATES } from '../data/safety/candidates';
import { DEST_LANG_NAMES } from '../data/countries';

export interface CountryPickerScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
}

/** 画布 06 屏展示的 8 国（按 Row1-4 顺序）；其余 18 国走「更多国家」入口 */
const QUICK_CODES = ['TH', 'JP', 'KR', 'VN', 'SG', 'MY', 'ID', 'LA'];

/**
 * 06 国家选择（DESIGN-v2.1.pen 06 屏，模态）。
 * 8 国快捷卡 + 更多国家入口 + Profile；确认后保存目的地与目标语言并生成安全卡。
 */
export default function CountryPickerScreen({ locale, dispatch }: CountryPickerScreenProps) {
  const settings = getCachedSettings();
  const [selected, setSelected] = useState(settings.destination.countryCode);
  const [place, setPlace] = useState<PlaceContext | null>(null);

  useEffect(() => {
    let mounted = true;
    void getPlaceContext().then((p) => {
      if (mounted) setPlace(p);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const quick = QUICK_CODES
    .map((code) => COUNTRY_SAFETY_CANDIDATES.find((c) => c.code === code))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const confirm = async () => {
    const country = quick.find((c) => c.code === selected);
    if (!country) return;
    await saveAppSettings({
      ...settings,
      destination: { countryCode: country.code, name: country.nameZh },
      targetLanguage: { code: country.langCode, name: DEST_LANG_NAMES[country.code] ?? '泰语' },
    });
    dispatch({ type: 'navigate', route: 'safety' });
  };

  const sourceLang = locale === 'zh-Hans' ? '普通话' : 'English';
  const gpsPlace = place?.city ? `${place.country ?? ''} · ${place.city}` : place?.country ?? '';

  return (
    <View style={styles.mask}>
      <View style={styles.card}>
        {place ? (
          <View style={styles.gpsRow}>
            <Text style={styles.gpsIcon}>◎</Text>
            <Text style={styles.gpsText} numberOfLines={1}>
              {translate(locale, 'country06.locateOk', { place: gpsPlace || place.countryCode || '' })}
            </Text>
            <Text style={styles.gpsBadge}>{translate(locale, 'country06.gpsBadge')}</Text>
          </View>
        ) : null}

        <Text style={styles.cardTitle}>{translate(locale, 'country06.title')}</Text>

        {/* 4 行 × 2 国 */}
        {[0, 2, 4, 6].map((start) => (
          <View key={start} style={styles.row}>
            {quick.slice(start, start + 2).map((c) => {
              const active = c.code === selected;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.countryBtn, active ? styles.countryActive : null]}
                  onPress={() => setSelected(c.code)}
                  accessibilityRole="button"
                  accessibilityLabel={c.nameZh}
                >
                  <Text style={[styles.flag, active ? styles.textDark : null]}>{c.code}</Text>
                  <Text style={[styles.cName, active ? styles.textDark : null]}>{c.nameZh}</Text>
                  {active ? <Text style={styles.check}>✓</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* 更多国家入口 */}
        <TouchableOpacity
          style={styles.moreRow}
          onPress={() => {
            Alert.alert(translate(locale, 'country06.more'), translate(locale, 'country06.moreSoon'));
          }}
          accessibilityRole="button"
        >
          <Text style={styles.moreText}>{translate(locale, 'country06.more')}</Text>
          <Text style={styles.moreChevron}>›</Text>
        </TouchableOpacity>

        {/* Profile */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>途</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.userName}>{translate(locale, 'country06.traveler')}</Text>
            <Text style={styles.userLang}>
              {translate(locale, 'idle.langPair', {
                source: sourceLang,
                target: settings.targetLanguage.name,
              })}
            </Text>
          </View>
        </View>

        {/* Confirm */}
        <TouchableOpacity style={styles.confirmBtn} onPress={() => void confirm()} accessibilityRole="button">
          <Text style={styles.confirmText}>{translate(locale, 'country06.confirm')}</Text>
        </TouchableOpacity>
      </View>

      {/* Close */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => dispatch({ type: 'navigate', route: 'home' })}
        accessibilityRole="button"
        accessibilityLabel="关闭"
      >
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>
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
    width: 350,
    maxWidth: '92%',
    backgroundColor: colors.bgCard,
    borderRadius: radii.r16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 20,
    gap: 14,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accentGreenBg,
    borderRadius: radii.r10,
    padding: 10,
  },
  gpsIcon: { color: colors.accentGreen, fontSize: 14 },
  gpsText: { flex: 1, color: colors.accentGreen, fontSize: 12, fontWeight: '600' },
  gpsBadge: { fontFamily: fonts.mono, color: colors.accentGreen, fontSize: 10, fontWeight: '700' },
  cardTitle: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8, height: 44 },
  countryBtn: {
    flex: 1,
    height: 44,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r10,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryActive: {
    backgroundColor: colors.accentBlue,
    borderWidth: 2,
    borderColor: colors.bgPrimary,
  },
  flag: { fontFamily: fonts.mono, color: colors.textPrimary, fontSize: 11 },
  cName: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  textDark: { color: '#0a0a1e' },
  check: { color: '#0a0a1e', fontSize: 13, fontWeight: '700' },
  moreRow: {
    height: 36,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moreText: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 13 },
  moreChevron: { color: colors.textTertiary, fontSize: 16 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r10,
    padding: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: { fontFamily: fonts.mono, color: colors.textPrimary, fontSize: 11 },
  profileText: { flex: 1 },
  userName: { fontFamily: fonts.body, color: colors.textTertiary, fontSize: 12, fontWeight: '600' },
  userLang: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11, marginTop: 2 },
  confirmBtn: {
    height: 44,
    backgroundColor: colors.accentBlue,
    borderRadius: radii.r12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { fontFamily: fonts.body, color: '#0a0a1e', fontSize: 14, fontWeight: '700' },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgCardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { color: colors.textSecondary, fontSize: 14 },
});
