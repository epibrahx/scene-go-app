import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from 'zustand';
import { cardStackStore, TAP_TALK_CARD } from '../core/cardStackStore';
import { Locale } from '../i18n';
import { AppAction } from '../app/appReducer';
import { colors, fonts, radii } from '../theme/tokens';

export interface PresentationScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
}

/**
 * 03 全屏大字展示（DESIGN-v2.1.pen 03 屏）。
 * 遮罩 + 居中大卡（目标语言 40px + 音标 18px）；点任意处返回表达卡。
 */
export default function PresentationScreen({ dispatch }: PresentationScreenProps) {
  const cards = useStore(cardStackStore, (s) => s.cards);
  const index = useStore(cardStackStore, (s) => s.index);
  const card = cards[index] ?? TAP_TALK_CARD;

  return (
    <Pressable
      style={styles.root}
      onPress={() => dispatch({ type: 'navigate', route: 'card' })}
      accessibilityRole="button"
      accessibilityLabel="关闭大字展示"
    >
      <View style={styles.bigCard}>
        <Text style={styles.bigText}>{card.targetText}</Text>
        {card.phonetic ? <Text style={styles.phonetic}>{card.phonetic}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.mask,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigCard: {
    width: 360,
    maxWidth: '92%',
    backgroundColor: colors.bgPrimary,
    borderRadius: radii.r20,
    paddingVertical: 40,
    paddingHorizontal: 32,
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigText: {
    fontFamily: fonts.body,
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '600',
    textAlign: 'center',
  },
  phonetic: {
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontSize: 18,
    textAlign: 'center',
  },
});
