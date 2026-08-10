import React from 'react';
import { View, StyleSheet, SafeAreaView, Text, Pressable } from 'react-native';
import { useStore } from 'zustand';
import { cardStackStore, TAP_TALK_CARD } from '../core/cardStackStore';
import { Locale, translate } from '../i18n';
import { AppAction } from '../app/appReducer';
import { colors, fonts, radii } from '../theme/tokens';
import { TtsButton } from '../components/TtsButton';

export interface PresentationScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
}

export default function PresentationScreen({ locale, dispatch }: PresentationScreenProps) {
  const cards = useStore(cardStackStore, (s) => s.cards);
  const index = useStore(cardStackStore, (s) => s.index);
  const card = cards[index] ?? TAP_TALK_CARD;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.head}>
        <Pressable 
          style={styles.backBtn} 
          onPress={() => dispatch({ type: 'navigate', route: 'home' })}
          accessibilityLabel={translate(locale, 'card.back')}
        >
          <Text style={styles.backIcon}>✕</Text>
        </Pressable>
        <TtsButton text={card.targetText} languageCode={card.languageCode} locale={locale} />
      </View>

      <View style={styles.content}>
        <Text style={styles.targetText} adjustsFontSizeToFit minimumFontScale={0.5} numberOfLines={5}>
          {card.targetText}
        </Text>
        {!!card.phonetic && (
          <Text style={styles.phoneticText}>{card.phonetic}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    height: 60,
  },
  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.bgCard,
    borderRadius: radii.r22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.textPrimary,
    fontSize: 20,
    lineHeight: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  targetText: {
    fontFamily: fonts.body,
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  phoneticText: {
    fontFamily: fonts.body,
    fontSize: 24,
    color: colors.textSecondary,
    textAlign: 'center',
  }
});
