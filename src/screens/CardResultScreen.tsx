import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from 'zustand';
import { cardStackStore, TAP_TALK_CARD } from '../core/cardStackStore';
import { ExpressionCard, BubbleProps } from '../components/ExpressionCard';
import { ReplyRow } from '../components/ReplyRow';
import { colors, fonts, radii } from '../theme/tokens';
import { ReplyOption } from '../core/types';
import { Locale, translate } from '../i18n';
import { AppAction } from '../app/appReducer';
import { TtsButton } from '../components/TtsButton';

const FALLBACK_REPLY_OPTIONS: ReplyOption[] = [
  {
    label: '好的，谢谢',
    replyCard: {
      id: 'rep-thanks',
      categoryTag: 'REPLY',
      locationName: '当前位置',
      title: '致谢',
      targetText: 'ขอบคุณครับ',
      phonetic: 'kòp-kun kráp',
      subText: '',
      localTip: '礼貌致谢',
      languageCode: 'th-TH',
    },
  },
  {
    label: '太贵了，能便宜点吗',
    replyCard: {
      id: 'rep-price',
      categoryTag: 'REPLY',
      locationName: '当前位置',
      title: '议价',
      targetText: 'แพงไป ขอถูกลงหน่อยได้ไหม',
      phonetic: 'paeng pai kǒ tǔuk long nòi dâi mái',
      subText: '',
      localTip: '议价常用语',
      languageCode: 'th-TH',
    },
  },
];

export interface CardResultScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
}

export default function CardResultScreen({ locale, dispatch }: CardResultScreenProps) {
  const cards = useStore(cardStackStore, (s) => s.cards);
  const index = useStore(cardStackStore, (s) => s.index);
  const add = useStore(cardStackStore, (s) => s.add);

  const card = cards[index] ?? TAP_TALK_CARD;
  const replyOptions = card.reply?.options?.length ? card.reply.options : FALLBACK_REPLY_OPTIONS;

  const mine: BubbleProps = {
    who: '我的表达', // Hardcoded as per original or we could i18n it, but keep to existing if not asked
    whoColor: colors.accentBlue,
    foreign: card.targetText,
    phonetic: card.phonetic || undefined,
    zh: card.subText || card.title,
  };

  return (
    <View style={styles.screen}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <Pressable style={styles.backBtn} onPress={() => dispatch({ type: 'navigate', route: 'home' })}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.headTitle}>{translate(locale, 'screens.card.title')}</Text>
            <Text style={styles.headLoc}>{card.locationName}</Text>
          </View>
        </View>
        <Pressable 
          style={styles.fullScreenBtn}
          onPress={() => dispatch({ type: 'navigate', route: 'presentation' })}
        >
          <Text style={styles.fullScreenText}>{translate(locale, 'card.fullScreen')}</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <ExpressionCard mine={mine} />
        
        <View style={styles.actionRow}>
          <TtsButton text={card.targetText} languageCode={card.languageCode} locale={locale} />
        </View>

        <ReplyRow
          label={translate(locale, 'card.replyHint')}
          options={replyOptions}
          onSelect={(opt) => add(opt.replyCard)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  head: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: colors.textPrimary, fontSize: 26, lineHeight: 30, marginTop: -2 },
  headTitle: { fontFamily: fonts.body, fontSize: 16, color: colors.textPrimary },
  headLoc: { fontFamily: fonts.body, fontSize: 12, color: colors.textTertiary },
  fullScreenBtn: {
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.r12,
  },
  fullScreenText: {
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  content: { flex: 1, gap: 16, paddingVertical: 16 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  }
});
