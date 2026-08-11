import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Locale, translate } from '../i18n';
import { AppAction } from '../app/appReducer';
import { colors, fonts, radii } from '../theme/tokens';
import { getCachedSettings } from '../utils/appSettings';
import { getPlaceContext } from '../utils/locationContext';
import { getSafetyRecord } from '../data/safety/registry';
import { getHelpPhrase } from '../data/helpPhrases';
import { ttsService } from '../services/ttsService';

export interface SafetyDetailSheetProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
}

/**
 * 08 安全详情（DESIGN-v2.1.pen 08 屏，底部抽屉）。
 * 紧急电话（长按拨打）/ 求助句（朗读）/ 使领馆 / 本地提示 / 防骗提示。
 * ⚠️ 自用阶段直接显示候选号码；发布前需过 publicationGate 核验。
 */
export default function SafetyDetailSheet({ locale, dispatch }: SafetyDetailSheetProps) {
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

  const phones = [
    { num: record.emergency.police, label: translate(locale, 'safety08.police') },
    { num: record.emergency.ambulance, label: translate(locale, 'safety08.ambulance') },
    { num: record.emergency.touristPolice ?? record.emergency.fire, label: translate(locale, 'safety08.touristPolice') },
  ];

  const call = (num: string) => {
    void Linking.openURL(`tel:${num}`);
  };

  const speakHelp = async () => {
    try {
      await ttsService.play(help.text, record.langCode);
    } catch {
      Alert.alert(translate(locale, 'tts.unavailable'));
    }
  };

  const voltage = record.voltage.split('·')[0]?.trim() || record.voltage;

  return (
    <View style={styles.mask}>
      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          {/* Grabber */}
          <View style={styles.grabWrap}>
            <View style={styles.grabber} />
          </View>

          {/* SheetHeader */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{translate(locale, 'safety08.title')}</Text>
            <Text style={styles.sheetLoc}>{loc}</Text>
          </View>

          {/* 紧急电话 */}
          <Text style={styles.sec}>{translate(locale, 'safety08.sec1')}</Text>
          <View style={styles.phoneRow}>
            {phones.map((p) => (
              <Pressable
                key={p.label}
                style={styles.phone}
                onLongPress={() => call(p.num)}
                delayLongPress={600}
                accessibilityRole="button"
                accessibilityLabel={`${p.label} ${p.num} 长按拨打`}
              >
                <Text style={styles.num}>{p.num}</Text>
                <Text style={styles.numLabel}>{p.label}</Text>
                <Text style={styles.numHint}>{translate(locale, 'safety08.dialHint')}</Text>
              </Pressable>
            ))}
          </View>

          {/* 求助句 */}
          <Text style={styles.sec}>{translate(locale, 'safety08.sec2')}</Text>
          <TouchableOpacity style={styles.helpRow} onPress={() => void speakHelp()} accessibilityRole="button">
            <Text style={styles.helpIcon}>▶</Text>
            <Text style={styles.helpText} numberOfLines={1}>
              {help.text} · {help.zh}
            </Text>
            <Text style={styles.helpPlay}>▶</Text>
          </TouchableOpacity>

          {/* 使领馆 */}
          <Text style={styles.sec}>{translate(locale, 'safety08.sec3')}</Text>
          <TouchableOpacity
            style={styles.embRow}
            onPress={() => call(record.embassy)}
            accessibilityRole="button"
          >
            <Text style={styles.embIcon}>◇</Text>
            <Text style={styles.embName} numberOfLines={1}>
              {translate(locale, 'safety08.embassyName', { country: destName })}
            </Text>
            <Text style={styles.embPhone}>{record.embassy}</Text>
          </TouchableOpacity>

          {/* 本地提示 */}
          <Text style={styles.sec}>{translate(locale, 'safety08.sec4')}</Text>
          <View style={styles.tipRow}>
            <View style={styles.tip}>
              <Text style={styles.tipKey}>{translate(locale, 'safety08.tipVoltage')}</Text>
              <Text style={[styles.tipVal, { color: colors.accentYellow }]} numberOfLines={2}>
                {voltage}
              </Text>
            </View>
            <View style={styles.tip}>
              <Text style={styles.tipKey}>{translate(locale, 'safety08.tipWater')}</Text>
              <Text style={[styles.tipVal, { color: colors.accentCyan }]} numberOfLines={2}>
                {record.water}
              </Text>
            </View>
            <View style={styles.tip}>
              <Text style={styles.tipKey}>{translate(locale, 'safety08.tipTipping')}</Text>
              <Text style={[styles.tipVal, { color: colors.accentGreen }]} numberOfLines={2}>
                {record.tipping}
              </Text>
            </View>
          </View>

          {/* 防骗提示 */}
          {record.scams?.length ? (
            <View style={styles.scamRow}>
              <Text style={styles.scamIcon}>▲</Text>
              <Text style={styles.scamText}>{record.scams[0]}</Text>
            </View>
          ) : null}
        </ScrollView>
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
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radii.r16,
    borderTopRightRadius: radii.r16,
    maxHeight: '92%',
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 14,
    gap: 12,
  },
  grabWrap: { alignItems: 'center' },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textMuted },
  sheetHeader: { alignItems: 'center', gap: 8 },
  sheetTitle: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  sheetLoc: { fontFamily: fonts.body, color: colors.textTertiary, fontSize: 12 },
  sec: {
    fontFamily: fonts.mono,
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  phoneRow: { flexDirection: 'row', gap: 8, height: 73 },
  phone: {
    flex: 1,
    height: 73,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r10,
    padding: 10,
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: { fontFamily: fonts.mono, color: colors.accentGreen, fontSize: 18, fontWeight: '800' },
  numLabel: { fontFamily: fonts.body, color: colors.textSecondary, fontSize: 11 },
  numHint: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 9 },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r10,
    padding: 12,
  },
  helpIcon: { color: colors.accentCyan, fontSize: 14 },
  helpText: { flex: 1, fontFamily: fonts.body, color: colors.textPrimary, fontSize: 13 },
  helpPlay: { color: colors.accentCyan, fontSize: 12 },
  embRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r10,
    padding: 12,
  },
  embIcon: { color: colors.accentYellow, fontSize: 14 },
  embName: { flex: 1, fontFamily: fonts.body, color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  embPhone: { fontFamily: fonts.mono, color: colors.accentYellow, fontSize: 12 },
  tipRow: { flexDirection: 'row', gap: 8 },
  tip: {
    flex: 1,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r10,
    padding: 8,
    gap: 3,
    alignItems: 'center',
  },
  tipKey: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 10 },
  tipVal: { fontFamily: fonts.body, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  scamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.accentRedBg,
    borderRadius: radii.r10,
    padding: 12,
  },
  scamIcon: { color: colors.accentRed, fontSize: 14 },
  scamText: { flex: 1, fontFamily: fonts.body, color: colors.textPrimary, fontSize: 12, lineHeight: 18 },
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
