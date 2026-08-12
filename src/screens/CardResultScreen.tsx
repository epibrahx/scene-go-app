import React, { useState } from 'react';
import { Alert, Image, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStore } from 'zustand';
import { cardStackStore, TAP_TALK_CARD } from '../core/cardStackStore';
import { CardData } from '../core/types';
import { Locale, translate } from '../i18n';
import { AppAction } from '../app/appReducer';
import { AppError } from '../errors/AppError';
import { colors, fonts, radii } from '../theme/tokens';
import { expressionEngine } from '../core/expressionEngine';
import { getCachedSettings } from '../utils/appSettings';
import { getPlaceContext } from '../utils/locationContext';
import { ttsService } from '../services/ttsService';
import { useHoldToSpeak } from '../hooks/useHoldToSpeak';
import { InputBar, MicMode } from '../components/InputBar';

export interface CardResultScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
}

/**
 * 02 表达卡 · 成卡结果（DESIGN-v2.1.pen 02 屏）。
 * 聊天式双气泡：我的表达（ask）右、对方回话（reply）左 + 建议回复区；
 * 底部输入栏（MicBtn 点按切换 我说/对方说，按住说话）+ 安全链接。
 */
export default function CardResultScreen({ locale, dispatch }: CardResultScreenProps) {
  const cards = useStore(cardStackStore, (s) => s.cards);
  const index = useStore(cardStackStore, (s) => s.index);
  const add = useStore(cardStackStore, (s) => s.add);

  const [micMode, setMicMode] = useState<MicMode>('speak');
  const [placeName, setPlaceName] = useState('');
  const hold = useHoldToSpeak();

  React.useEffect(() => {
    let mounted = true;
    void getPlaceContext().then((p) => {
      if (mounted) setPlaceName(p?.city ? `${p.city}` : '');
    });
    return () => {
      mounted = false;
    };
  }, []);

  const card = cards[index] ?? TAP_TALK_CARD;
  const isReply = card.role === 'reply';
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

  const createCard = async (text: string) => {
    dispatch({ type: 'taskStart', status: 'submitting' });
    try {
      const generated = micMode === 'listen'
        ? await expressionEngine.replyToUtterance(text)
        : await expressionEngine.generateCard(text);
      add(generated);
      dispatch({ type: 'taskSuccess' });
      if (micMode === 'listen') {
        // 对方回话：顺手朗读给对方听
        void speak(generated.targetText, generated.languageCode);
      }
    } catch {
      dispatch({ type: 'taskError', error: new AppError('server', '生成失败') });
      Alert.alert(translate(locale, 'common.error'));
    }
  };

  const handleHoldStart = () => {
    void (async () => {
      const localeCode = micMode === 'listen' ? settings.targetLanguage.code : 'zh-CN';
      const res = await hold.start(localeCode);
      if (!res.ok) Alert.alert(translate(locale, 'speech.unavailable'));
    })();
  };

  const handleHoldEnd = () => {
    void (async () => {
      const text = await hold.stop();
      if (text) void createCard(text);
      else Alert.alert(translate(locale, 'idle.emptyTranscript'));
    })();
  };

  const selectReply = (option: { label: string; replyCard: Omit<CardData, 'reply'> }) => {
    add(option.replyCard as CardData);
    void speak(option.replyCard.targetText, option.replyCard.languageCode);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Head */}
      <View style={styles.head}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => dispatch({ type: 'navigate', route: 'home' })}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headTitle}>{translate(locale, 'card02.title')}</Text>
        <Text style={styles.headLoc}>{headLoc}</Text>
      </View>

      {/* CardWrap */}
      <View style={styles.cardWrap}>
        {/* 我方表达（ask）：右 */}
        {!isReply ? (
          <View style={styles.rowEnd}>
            <Bubble
              who={translate(locale, 'card02.whoMine')}
              targetText={card.targetText}
              phonetic={card.phonetic}
              zhText={card.subText}
              onPlay={() => void speak(card.targetText, card.languageCode)}
              onPress={() => dispatch({ type: 'navigate', route: 'presentation' })}
            />
          </View>
        ) : null}

        {/* 对方回话（reply）：左 */}
        {isReply ? (
          <View style={styles.rowStart}>
            <Bubble
              who={translate(locale, 'card02.whoOther')}
              targetText={card.targetText}
              phonetic={card.phonetic}
              zhText={card.subText}
              onPlay={() => void speak(card.targetText, card.languageCode)}
              onPress={() => dispatch({ type: 'navigate', route: 'presentation' })}
            />
          </View>
        ) : null}

        {/* 建议回复区 */}
        {card.reply?.options?.length ? (
          <View style={styles.replyArea}>
            <Text style={styles.replyLabel}>{translate(locale, 'card02.replyLabel')}</Text>
            <View style={styles.replyRow}>
              {card.reply.options.slice(0, 2).map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={styles.replyPill}
                  onPress={() => selectReply(opt)}
                  accessibilityRole="button"
                >
                  <Text style={styles.replyText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {/* InputWrap */}
      <View style={styles.inputWrap}>
        <InputBar
          placeholder={translate(locale, 'idle.placeholder')}
          onSubmitText={(text) => void createCard(text)}
          micMode={micMode}
          onToggleMicMode={() => setMicMode((m) => (m === 'speak' ? 'listen' : 'speak'))}
          onHoldStart={handleHoldStart}
          onHoldEnd={handleHoldEnd}
          disabled={hold.recording}
        />
      </View>

      {/* Hint */}
      <View style={styles.hintWrap}>
        <Text style={styles.hint}>
          {translate(locale, 'card02.hint', {
            mode: micMode === 'speak'
              ? translate(locale, 'card02.modeSpeak')
              : translate(locale, 'card02.modeListen'),
          })}
        </Text>
      </View>

      {/* SafetyLink → 07 */}
      <TouchableOpacity
        style={styles.safetyLink}
        onPress={() => dispatch({ type: 'navigate', route: 'safety' })}
        accessibilityRole="button"
      >
        <Text style={styles.safetyIcon}>◉</Text>
        <Text style={styles.safetyText}>
          {translate(locale, 'card02.safetyLink', { country: destName })}
        </Text>
        <Text style={styles.safetyIcon}>›</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

function Bubble({
  who,
  targetText,
  phonetic,
  zhText,
  onPlay,
  onPress,
}: {
  who: string;
  targetText: string;
  phonetic: string;
  zhText: string;
  onPlay: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.bubble} onPress={onPress} accessibilityRole="button" accessibilityLabel="放大展示">
      <View style={styles.metaRow}>
        <Text style={styles.whoTag}>{who}</Text>
        <Pressable onPress={onPlay} hitSlop={8} accessibilityRole="button" accessibilityLabel="播放">
          <Image source={require('../../assets/icon-play.png')} style={styles.playIcon} resizeMode="contain" />
        </Pressable>
      </View>
      <Text style={styles.targetText}>{targetText}</Text>
      {phonetic ? <Text style={styles.phonetic}>{phonetic}</Text> : null}
      {zhText ? <Text style={styles.zhText}>{zhText}</Text> : null}
    </Pressable>
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
  headLoc: {
    position: 'absolute',
    right: 20,
    fontFamily: fonts.body,
    color: colors.textTertiary,
    fontSize: 12,
  },
  cardWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  rowEnd: { flexDirection: 'row', justifyContent: 'flex-end' },
  rowStart: { flexDirection: 'row', justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '85%',
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r16,
    padding: 14,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  whoTag: { fontFamily: fonts.body, color: colors.textTertiary, fontSize: 12 },
  playIcon: { width: 18, height: 18, tintColor: colors.textSecondary },
  targetText: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 17, fontWeight: '500' },
  phonetic: { fontFamily: fonts.body, color: colors.textSecondary, fontSize: 12 },
  zhText: { fontFamily: fonts.body, color: colors.accentYellow, fontSize: 13 },
  replyArea: { gap: 10 },
  replyLabel: { fontFamily: fonts.body, color: colors.textTertiary, fontSize: 12 },
  replyRow: { flexDirection: 'row', gap: 10 },
  replyPill: {
    flex: 1,
    height: 40,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  replyText: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 14 },
  inputWrap: { paddingHorizontal: 20, paddingTop: 8 },
  hintWrap: { alignItems: 'center', paddingVertical: 14 },
  hint: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11 },
  safetyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  safetyIcon: { color: colors.accentGreen, fontSize: 14 },
  safetyText: { fontFamily: fonts.body, color: colors.accentGreen, fontSize: 12, fontWeight: '600' },
});
