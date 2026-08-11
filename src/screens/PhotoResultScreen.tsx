import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useStore } from 'zustand';
import { cardStackStore } from '../core/cardStackStore';
import { expressionEngine } from '../core/expressionEngine';
import { Locale, translate } from '../i18n';
import { AppAction } from '../app/appReducer';
import { AppError } from '../errors/AppError';
import { colors, fonts, radii } from '../theme/tokens';
import { getCachedSettings } from '../utils/appSettings';
import { getPlaceContext } from '../utils/locationContext';
import { ttsService } from '../services/ttsService';
import { InputBar } from '../components/InputBar';

export interface PhotoResultScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
  photoUri: string;
}

/** 「当地语言 (中文翻译)」→ [外语, 中文] */
function splitPhrase(phrase: string): [string, string] {
  const m = phrase.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return m ? [m[1].trim(), m[2].trim()] : [phrase, ''];
}

/**
 * 05 图片解读 · 拍图识别（DESIGN-v2.1.pen 05 屏）。
 * 照片 + 识别结果（母语单行 44px）+ 可用短语 + 输入/重拍/朗读全部。
 */
export default function PhotoResultScreen({ locale, dispatch, photoUri }: PhotoResultScreenProps) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const add = useStore(cardStackStore, (s) => s.add);
  const card = useStore(cardStackStore, (s) => s.cards[s.index]);

  const analyze = useCallback(async () => {
    if (!photoUri) return;
    setLoading(true);
    setFailed(false);
    try {
      const { card: analyzed } = await expressionEngine.processImage(photoUri);
      add(analyzed);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [photoUri, add]);

  useEffect(() => {
    void analyze();
  }, [analyze]);

  useEffect(() => {
    let mounted = true;
    void getPlaceContext().then((p) => {
      if (mounted) setPlaceName(p?.city ? `${p.city}` : '');
    });
    return () => {
      mounted = false;
    };
  }, []);

  const settings = getCachedSettings();
  const destName = settings.destination.name;
  const headLoc = placeName ? `${destName} · ${placeName}` : destName;

  const speak = async (text: string, languageCode: string) => {
    try {
      await ttsService.play(text, languageCode || settings.targetLanguage.code);
    } catch {
      Alert.alert(translate(locale, 'tts.unavailable'));
    }
  };

  const playAll = async () => {
    const phrases = (card?.phrases ?? []).slice(0, 3);
    const target = card?.targetText;
    for (const phrase of phrases) {
      const [foreign] = splitPhrase(phrase);
      await speak(foreign, card?.languageCode || settings.targetLanguage.code);
    }
    if (target && !phrases.some((p) => splitPhrase(p)[0] === target)) {
      await speak(target, card?.languageCode || settings.targetLanguage.code);
    }
  };

  const submitText = async (text: string) => {
    dispatch({ type: 'taskStart', status: 'submitting' });
    try {
      const generated = await expressionEngine.generateCard(text);
      add(generated);
      dispatch({ type: 'taskSuccess' });
      dispatch({ type: 'navigate', route: 'card' });
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError('server', String(err));
      dispatch({ type: 'taskError', error });
      Alert.alert(translate(locale, 'common.error'), error.message);
    }
  };

  const phrases = (card?.phrases ?? []).slice(0, 2);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Head */}
      <View style={styles.head}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => dispatch({ type: 'navigate', route: 'camera' })}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headTitle}>{translate(locale, 'photo05.title')}</Text>
        <Text style={styles.headLoc}>{headLoc}</Text>
      </View>

      <View style={styles.content}>
        {/* PhotoCard */}
        <View style={styles.photoWrap}>
          <View style={styles.photoCard}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImg} resizeMode="cover" />
            ) : (
              <>
                <Text style={styles.photoIcon}>▧</Text>
                <Text style={styles.photoLabel}>{translate(locale, 'photo05.photoLabel')}</Text>
              </>
            )}
          </View>
        </View>

        {/* 识别结果：母语单行 */}
        {loading ? (
          <View style={styles.recItem}>
            <ActivityIndicator color={colors.textTertiary} />
            <Text style={styles.recZh}>{translate(locale, 'photo05.recognizing')}</Text>
          </View>
        ) : failed ? (
          <TouchableOpacity style={styles.recItem} onPress={() => void analyze()}>
            <Text style={styles.recZh}>{translate(locale, 'photo05.recognizeFailed')}</Text>
            <Text style={styles.retryHint}>{translate(locale, 'common.retry')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.nameCard}>
            <View style={styles.recItem}>
              <Text style={styles.recZh}>{card?.title || '场景'}</Text>
            </View>
          </View>
        )}

        {/* 可用短语 */}
        {!loading && !failed && phrases.length > 0 ? (
          <View style={styles.phraseWrap}>
            <Text style={styles.phraseLabel}>{translate(locale, 'photo05.phraseLabel')}</Text>
            <View style={styles.phraseRow}>
              {phrases.map((phrase) => {
                const [foreign, native] = splitPhrase(phrase);
                return (
                  <TouchableOpacity
                    key={phrase}
                    style={styles.phraseCard}
                    onPress={() => void speak(foreign, card?.languageCode || settings.targetLanguage.code)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.phraseZh}>{native || foreign}</Text>
                    <Text style={styles.phraseEn}>{foreign}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      {/* InputWrap */}
      <View style={styles.inputWrap}>
        <InputBar
          placeholder={translate(locale, 'idle.placeholder')}
          onSubmitText={(text) => void submitText(text)}
          onPressCamera={() => dispatch({ type: 'navigate', route: 'camera' })}
          disabled={loading}
        />
      </View>

      {/* Hint + Retake/PlayAll */}
      <View style={styles.hintWrap}>
        <Text style={styles.hint}>{translate(locale, 'photo05.hint')}</Text>
      </View>
      <View style={styles.retakeWrap}>
        <View style={styles.retakeRow}>
          <TouchableOpacity
            style={styles.retakeBtn}
            onPress={() => dispatch({ type: 'navigate', route: 'camera' })}
            accessibilityRole="button"
          >
            <Text style={styles.retakeIcon}>▣</Text>
            <Text style={styles.retakeText}>{translate(locale, 'photo05.retake')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.playAllBtn}
            onPress={() => void playAll()}
            disabled={loading || failed}
            accessibilityRole="button"
          >
            <Text style={styles.playAllIcon}>▶</Text>
            <Text style={styles.playAllText}>{translate(locale, 'photo05.playAll')}</Text>
          </TouchableOpacity>
        </View>
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
  content: { flex: 1, paddingHorizontal: 20, paddingVertical: 16, gap: 16 },
  photoWrap: { height: 120 },
  photoCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radii.r16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  photoImg: { width: '100%', height: '100%' },
  photoIcon: { color: colors.textTertiary, fontSize: 28 },
  photoLabel: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 12 },
  nameCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.r16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 4,
  },
  recItem: {
    height: 44,
    backgroundColor: colors.bgCard,
    borderRadius: radii.r12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  recZh: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 15 },
  retryHint: { fontFamily: fonts.body, color: colors.textTertiary, fontSize: 13 },
  phraseWrap: { gap: 8 },
  phraseLabel: {
    fontFamily: fonts.mono,
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  phraseRow: { flexDirection: 'row', gap: 8 },
  phraseCard: {
    flex: 1,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
    gap: 4,
  },
  phraseZh: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  phraseEn: { fontFamily: fonts.body, color: colors.accentYellow, fontSize: 11 },
  inputWrap: { paddingHorizontal: 20, paddingTop: 8 },
  hintWrap: { alignItems: 'center', paddingVertical: 14 },
  hint: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11 },
  retakeWrap: { paddingHorizontal: 20, alignItems: 'center' },
  retakeRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center' },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.r20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  retakeIcon: { color: colors.textSecondary, fontSize: 15 },
  retakeText: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentBlue,
    borderRadius: radii.r20,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  playAllIcon: { color: '#0a0a1e', fontSize: 15 },
  playAllText: { fontFamily: fonts.body, color: '#0a0a1e', fontSize: 12, fontWeight: '700' },
});
