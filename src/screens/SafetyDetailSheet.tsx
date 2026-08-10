import React, { useRef, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, ScrollView, Animated, Linking, Alert } from 'react-native';
import { Locale, translate } from '../i18n';
import { AppAction } from '../app/appReducer';
import { colors, fonts, radii } from '../theme/tokens';
import { getSafetyRecord } from '../data/safety/registry';
import { getPublishedSafetyView, canPublishSafety } from '../data/safety/publicationGate';
import { getCachedSettings } from '../utils/appSettings';
import { isDialSafe, normalizePhoneNumber } from '../data/safety/phone';

export interface SafetyDetailSheetProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
}

function DialButton({ locale, label, number }: { locale: Locale; label: string; number: string }) {
  const progress = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const startPress = () => {
    setHint(null);
    Animated.timing(progress, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();

    timerRef.current = setTimeout(() => {
      const normalized = normalizePhoneNumber(number);
      if (normalized && isDialSafe(normalized)) {
        Linking.openURL(`tel:${normalized}`);
      }
    }, 600);
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    progress.stopAnimation();
    progress.setValue(0);
  };

  const handlePressOut = () => {
    cancelPress();
  };

  const handleShortPress = () => {
    setHint(translate(locale, 'safetyUI.longPressToDial'));
    cancelPress();
  };

  return (
    <View style={styles.dialContainer}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={startPress}
        onPressOut={handlePressOut}
        onPress={handleShortPress}
        onLongPress={() => {}} // Handled by setTimeout
        delayLongPress={600}
        style={styles.dialButton}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${number}`}
        accessibilityHint={translate(locale, 'safetyUI.longPressToDial')}
        accessibilityActions={[{ name: 'magicTap' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'magicTap') {
            const normalized = normalizePhoneNumber(number);
            if (normalized && isDialSafe(normalized)) {
              Alert.alert(
                translate(locale, 'safetyUI.dialConfirm').replace('{{number}}', normalized),
                '',
                [
                  { text: translate(locale, 'common.cancel'), style: 'cancel' },
                  { text: translate(locale, 'common.success'), onPress: () => Linking.openURL(`tel:${normalized}`) }
                ]
              );
            }
          }
        }}
      >
        <Animated.View style={[styles.dialProgress, {
          width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
        }]} />
        <View style={styles.dialContent}>
          <Text style={styles.dialLabel}>{label}</Text>
          <Text style={styles.dialNumber}>{number}</Text>
        </View>
      </TouchableOpacity>
      {hint && <Text style={styles.dialHint}>{hint}</Text>}
    </View>
  );
}

export default function SafetyDetailSheet({ locale, dispatch }: SafetyDetailSheetProps) {
  const settings = getCachedSettings();
  const countryCode = settings.destination.countryCode;
  const record = getSafetyRecord(countryCode);
  const view = record && canPublishSafety(record) ? getPublishedSafetyView(record) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => dispatch({ type: 'navigate', route: 'safety' })}>
          <Text style={styles.backText}>{translate(locale, 'card.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{translate(locale, 'safetyUI.detailTitle')}</Text>
      </View>
      <ScrollView style={styles.content}>
        
        {view?.emergency && (
          <View style={styles.section}>
            {view.emergency.police && <DialButton locale={locale} label={translate(locale, 'safetyUI.police')} number={view.emergency.police} />}
            {view.emergency.ambulance && <DialButton locale={locale} label={translate(locale, 'safetyUI.ambulance')} number={view.emergency.ambulance} />}
            {view.emergency.fire && <DialButton locale={locale} label={translate(locale, 'safetyUI.fire')} number={view.emergency.fire} />}
            {view.emergency.touristPolice && <DialButton locale={locale} label={translate(locale, 'safetyUI.touristPolice')} number={view.emergency.touristPolice} />}
          </View>
        )}

        {view?.embassy ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translate(locale, 'safetyUI.embassy')}</Text>
            <DialButton locale={locale} label={translate(locale, 'safetyUI.embassy')} number={view.embassy} />
          </View>
        ) : null}

        {view?.scams?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translate(locale, 'safetyUI.scams')}</Text>
            {view.scams.map((scam, idx) => (
              <View key={idx} style={styles.textBlock}>
                <Text style={styles.textBlockDesc}>• {scam}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {view?.sos ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translate(locale, 'safetyUI.sosSentence')}</Text>
            <View style={styles.textBlock}>
              <Text style={styles.textBlockTitle}>{view.sos.local}</Text>
              {view.sos.phonetic && <Text style={styles.textBlockDesc}>{translate(locale, 'safetyUI.phonetic')}: {view.sos.phonetic}</Text>}
            </View>
          </View>
        ) : null}

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
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: fonts.body,
  },
  dialContainer: {
    marginBottom: 12,
  },
  dialButton: {
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r12,
    overflow: 'hidden',
    position: 'relative',
    height: 56,
  },
  dialContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dialProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.accentRedBg,
  },
  dialLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: fonts.body,
  },
  dialNumber: {
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: fonts.mono,
  },
  dialHint: {
    color: colors.accentRed,
    fontSize: 12,
    marginTop: 4,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  textBlock: {
    backgroundColor: colors.bgCardLight,
    padding: 16,
    borderRadius: radii.r12,
    marginBottom: 12,
  },
  textBlockTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: fonts.body,
  },
  textBlockDesc: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
  },
});
