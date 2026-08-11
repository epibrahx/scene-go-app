import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppAction, TaskStatus } from '../app/appReducer';
import { AppError } from '../errors/AppError';
import { Locale, translate } from '../i18n';
import { colors, fonts, radii } from '../theme/tokens';
import { expressionEngine } from '../core/expressionEngine';
import { cardStackStore } from '../core/cardStackStore';
import { getCachedSettings, saveAppSettings } from '../utils/appSettings';
import { getPlaceContext, PlaceContext } from '../utils/locationContext';
import { useHoldToSpeak } from '../hooks/useHoldToSpeak';
import { InputBar } from '../components/InputBar';

export interface HomeScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
  taskState: TaskStatus;
  taskError: AppError | null;
}

/**
 * 01 IDLE 待机 · 触发入口（DESIGN-v2.1.pen 01 屏）。
 * 中央 HoldMic 按住说话 → 松开成卡；底部输入栏（拍照/文字）；顶部位置行 + 齿轮。
 */
export default function HomeScreen({ locale, dispatch, taskState }: HomeScreenProps) {
  const [place, setPlace] = useState<PlaceContext | null>(null);
  const hold = useHoldToSpeak();
  const recording = hold.recording;

  useEffect(() => {
    let mounted = true;
    void getPlaceContext().then((p) => {
      if (mounted) setPlace(p);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const settings = getCachedSettings();
  const sourceLang = locale === 'zh-Hans' ? '普通话' : 'English';
  const showBanner =
    !!place?.countryCode && place.countryCode !== settings.destination.countryCode;

  const startRecording = async () => {
    const res = await hold.start('zh-CN');
    if (!res.ok) {
      dispatch({ type: 'taskReset' });
      Alert.alert(translate(locale, 'speech.unavailable'));
    } else {
      dispatch({ type: 'taskStart', status: 'listening' });
    }
  };

  const stopRecording = async () => {
    const text = await hold.stop();
    dispatch({ type: 'taskReset' });
    if (text) {
      void submitText(text);
    } else {
      Alert.alert(translate(locale, 'idle.emptyTranscript'));
    }
  };

  const submitText = async (text: string) => {
    const execute = async () => {
      dispatch({ type: 'taskStart', status: 'submitting' });
      try {
        const card = await expressionEngine.generateCard(text);
        cardStackStore.getState().add(card);
        dispatch({ type: 'taskSuccess' });
        dispatch({ type: 'navigate', route: 'card' });
      } catch (err) {
        const error = err instanceof AppError ? err : new AppError('server', String(err));
        dispatch({ type: 'taskError', error });
        Alert.alert(translate(locale, 'common.error'), error.message);
      }
    };
    if (!settings.aiConsent) {
      Alert.alert(
        translate(locale, 'consent.title'),
        translate(locale, 'consent.description'),
        [
          { text: translate(locale, 'consent.decline'), style: 'cancel' },
          {
            text: translate(locale, 'consent.accept'),
            onPress: async () => {
              await saveAppSettings({ ...settings, aiConsent: true });
              void execute();
            },
          },
        ],
      );
      return;
    }
    void execute();
  };

  const handleCamera = () => {
    dispatch({ type: 'navigate', route: 'camera' });
  };

  const busy = taskState === 'submitting' || taskState === 'listening';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* BrandRow：SCENEGO + 齿轮（→13 更多/设置） */}
        <View style={styles.brandRow}>
          <Text style={styles.brand}>SCENEGO</Text>
          <TouchableOpacity
            style={styles.gearBtn}
            onPress={() => dispatch({ type: 'navigate', route: 'settings' })}
            accessibilityRole="button"
            accessibilityLabel="更多"
          >
            <Text style={styles.gearIcon}>≡</Text>
          </TouchableOpacity>
        </View>

        {/* LocRow：当前位置 + 语言对（→09 位置切换） */}
        <TouchableOpacity
          style={styles.locRow}
          onPress={() => dispatch({ type: 'navigate', route: 'locationSwitch' })}
          accessibilityRole="button"
          accessibilityLabel="切换目的地"
        >
          <View style={styles.locDot} />
          <Text style={styles.locText}>
            {settings.destination.name}
            {place?.city ? ` · ${place.city}` : ''}
          </Text>
          <Text style={styles.locSub}>
            {translate(locale, 'idle.langPair', { source: sourceLang, target: settings.targetLanguage.name })}
          </Text>
          <Text style={styles.locChevron}>⌄</Text>
        </TouchableOpacity>

        {/* TriggerArea：中央 HoldMic */}
        <View style={styles.triggerArea}>
          <Text style={styles.mainHint}>{translate(locale, 'idle.mainHint')}</Text>
          <Pressable
            style={[styles.holdMic, recording ? styles.holdMicActive : null]}
            onPressIn={() => void startRecording()}
            onPressOut={() => void stopRecording()}
            disabled={busy && !recording}
            accessibilityRole="button"
            accessibilityLabel={translate(locale, 'idle.holdLabel')}
          >
            <Image
              source={require('../../assets/icon-mic.png')}
              style={[styles.micIcon, recording ? styles.micIconActive : null]}
              resizeMode="contain"
            />
            <Text style={styles.holdLabel}>
              {recording ? translate(locale, 'idle.holdActive') : translate(locale, 'idle.holdLabel')}
            </Text>
          </Pressable>
          <Text style={styles.subHint}>{translate(locale, 'idle.subHint')}</Text>
        </View>

        {/* InputWrap：拍照 / 文字 */}
        <View style={styles.inputWrap}>
          <InputBar
            placeholder={translate(locale, 'idle.placeholder')}
            onSubmitText={(text) => void submitText(text)}
            onPressCamera={handleCamera}
            disabled={busy}
          />
        </View>

        {/* Hint */}
        <View style={styles.hintWrap}>
          <Text style={styles.hint}>{translate(locale, 'idle.hint')}</Text>
        </View>
      </View>

      {/* 位置变化横幅（→09） */}
      {showBanner ? (
        <TouchableOpacity
          style={styles.locBanner}
          onPress={() => dispatch({ type: 'navigate', route: 'locationSwitch' })}
          accessibilityRole="button"
        >
          <Text style={styles.bannerIcon}>◎</Text>
          <Text style={styles.bannerText}>
            {translate(locale, 'idle.banner', { country: place?.country ?? place?.countryCode ?? '' })}
          </Text>
        </TouchableOpacity>
      ) : null}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  brandRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: fonts.mono,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
  },
  gearBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: {
    color: colors.textSecondary,
    fontSize: 22,
    fontWeight: '700',
  },
  locRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentGreen,
  },
  locText: {
    fontFamily: fonts.body,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  locSub: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 11,
  },
  locChevron: {
    color: colors.textTertiary,
    fontSize: 14,
  },
  triggerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 40,
  },
  mainHint: {
    fontFamily: fonts.body,
    color: colors.textTertiary,
    fontSize: 12,
  },
  holdMic: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.bgCardLight,
    borderWidth: 1.5,
    borderColor: colors.borderBlue,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  holdMicActive: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.userBubble,
  },
  micIcon: {
    width: 36,
    height: 36,
    tintColor: colors.accentBlue,
  },
  micIconActive: {
    tintColor: colors.accentRed,
  },
  holdLabel: {
    fontFamily: fonts.body,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  subHint: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 11,
  },
  inputWrap: {
    height: 72,
    justifyContent: 'center',
  },
  hintWrap: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  hint: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 11,
  },
  locBanner: {
    position: 'absolute',
    top: 8,
    left: 20,
    right: 20,
    height: 36,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  bannerIcon: {
    color: colors.accentBlue,
    fontSize: 14,
  },
  bannerText: {
    fontFamily: fonts.body,
    color: colors.textPrimary,
    fontSize: 13,
  },
});
