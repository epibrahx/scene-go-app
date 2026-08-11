import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native';
import { Locale, translate } from '../i18n';
import { AppAction } from '../app/appReducer';
import { colors, fonts, radii } from '../theme/tokens';
import { getCachedSettings } from '../utils/appSettings';
import { getPlaceContext } from '../utils/locationContext';
import { getSafetyRecord } from '../data/safety/registry';
import { getHelpPhrase } from '../data/helpPhrases';
import { ttsService } from '../services/ttsService';

export interface SafetyCardScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
}

/**
 * 07 安全卡（DESIGN-v2.1.pen 07 屏）。
 * 求助句大字卡 + 朗读/安全信息入口 + 3 拨号块（长按拨打）。
 * ⚠️ 自用阶段直接显示候选号码；发布前需过 publicationGate 核验（号码会被剥离）。
 */
export default function SafetyCardScreen({ locale, dispatch }: SafetyCardScreenProps) {
  const settings = getCachedSettings();
  const [placeName, setPlaceName] = useState('');

  useEffect(() => {
    let mounted = true;
    void getPlaceContext().then((p) => {
      if (mounted) setPlaceName(p?.city ? `${p.city}` : '');
    });
    return () => {
      mounted = false;
    };
  }, []);

  const record = getSafetyRecord(settings.destination.countryCode) ?? getSafetyRecord('TH');
  const help = getHelpPhrase(record?.langCode ?? settings.targetLanguage.code);
  const destName = settings.destination.name;
  const loc = placeName ? `${destName} · ${placeName}` : destName;

  if (!record) return null;

  const dials = [
    { num: record.emergency.police, label: translate(locale, 'safety07.dialPolice') },
    { num: record.emergency.ambulance, label: translate(locale, 'safety07.dialAmbulance') },
    { num: record.emergency.touristPolice ?? record.emergency.fire, label: translate(locale, 'safety07.dialTourist') },
  ];

  const speakHelp = async () => {
    try {
      await ttsService.play(help.text, record.langCode);
    } catch {
      Alert.alert(translate(locale, 'tts.unavailable'));
    }
  };

  const call = (num: string) => {
    void Linking.openURL(`tel:${num}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* TopRow */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => dispatch({ type: 'navigate', route: 'home' })}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Text style={styles.closeIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.catPill}>
          <Text style={styles.catText}>{translate(locale, 'safety07.cat')}</Text>
        </View>
        <Text style={styles.loc}>{loc}</Text>
        <View style={styles.sp} />
        <View style={styles.safetyPill}>
          <Text style={styles.safetyText}>{translate(locale, 'safety07.safety')}</Text>
        </View>
      </View>

      {/* BigArea：求助句 */}
      <View style={styles.bigWrap}>
        <View style={styles.bigArea}>
          <Text style={styles.bigText}>{help.text}</Text>
          <Text style={styles.phonetic}>
            {help.phonetic ? `${help.phonetic} · ${help.zh}` : help.zh}
          </Text>
          <Text style={styles.supplement}>
            {translate(locale, 'safety07.emergency', {
              police: record.emergency.police,
              ambulance: record.emergency.ambulance,
              tourist: record.emergency.touristPolice ?? record.emergency.fire,
            })}
          </Text>
        </View>
      </View>

      {/* ActionWrap */}
      <View style={styles.actionWrap}>
        <TouchableOpacity style={styles.playBtn} onPress={() => void speakHelp()} accessibilityRole="button">
          <Text style={styles.playIcon}>▶</Text>
          <Text style={styles.playText}>{translate(locale, 'safety07.play')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.safeBtn}
          onPress={() => dispatch({ type: 'navigate', route: 'safetyDetail' })}
          accessibilityRole="button"
        >
          <Text style={styles.safeBtnIcon}>ℹ</Text>
          <Text style={styles.safeBtnText}>{translate(locale, 'safety07.safeBtn')}</Text>
        </TouchableOpacity>
      </View>

      {/* DialWrap */}
      <View style={styles.dialWrap}>
        {dials.map((d) => (
          <Pressable
            key={d.label}
            style={styles.dial}
            onLongPress={() => call(d.num)}
            delayLongPress={600}
            accessibilityRole="button"
            accessibilityLabel={`${d.label} ${d.num} 长按拨打`}
          >
            <Text style={styles.dialNum}>{d.num}</Text>
            <Text style={styles.dialLabel}>{d.label}</Text>
            <Text style={styles.dialHint}>{translate(locale, 'safety07.dialHint')}</Text>
          </Pressable>
        ))}
      </View>

      {/* Hint */}
      <View style={styles.hintWrap}>
        <Text style={styles.hint}>{translate(locale, 'safety07.hint')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgPrimary },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgCardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { color: colors.textSecondary, fontSize: 18, lineHeight: 20, marginTop: -1 },
  catPill: {
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  catText: { fontFamily: fonts.body, color: colors.accentGreen, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  loc: { fontFamily: fonts.body, color: colors.textTertiary, fontSize: 12 },
  sp: { flex: 1, height: 8 },
  safetyPill: {
    backgroundColor: colors.accentGreenBg,
    borderRadius: radii.r12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  safetyText: { fontFamily: fonts.mono, color: colors.accentGreen, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  bigWrap: { padding: 20 },
  bigArea: {
    backgroundColor: '#000000',
    borderRadius: radii.r12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 20,
    gap: 10,
  },
  bigText: { fontFamily: fonts.body, color: '#ffffff', fontSize: 44, fontWeight: '800', lineHeight: 57 },
  phonetic: { fontFamily: fonts.body, color: colors.textSecondary, fontSize: 14 },
  supplement: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 13 },
  actionWrap: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  playIcon: { color: colors.accentGreen, fontSize: 14 },
  playText: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 12, fontWeight: '700' },
  safeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentBlue,
    borderRadius: radii.r12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  safeBtnIcon: { color: '#0a0a1e', fontSize: 14 },
  safeBtnText: { fontFamily: fonts.body, color: '#0a0a1e', fontSize: 12, fontWeight: '700' },
  dialWrap: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 14,
    height: 66,
  },
  dial: {
    flex: 1,
    height: 66,
    backgroundColor: colors.accentGreenBg,
    borderRadius: radii.r10,
    padding: 10,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialNum: { fontFamily: fonts.mono, color: colors.accentGreen, fontSize: 16, fontWeight: '800' },
  dialLabel: { fontFamily: fonts.body, color: colors.textSecondary, fontSize: 10 },
  dialHint: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 9 },
  hintWrap: { alignItems: 'center', paddingVertical: 10 },
  hint: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11 },
});
