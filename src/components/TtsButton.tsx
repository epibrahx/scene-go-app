import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { ttsService } from '../services/ttsService';
import { Locale, translate } from '../i18n';
import { colors, radii } from '../theme/tokens';
import { AppError } from '../errors/AppError';

export interface TtsButtonProps {
  text: string;
  languageCode: string;
  locale: Locale;
}

export const TtsButton: React.FC<TtsButtonProps> = ({ text, languageCode, locale }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const unsub = ttsService.onStateChange((state) => {
      setIsPlaying(state === 'playing');
    });
    return () => {
      unsub();
      if (ttsService.isPlaying()) {
        ttsService.stop();
      }
    };
  }, []);

  const handlePress = async () => {
    if (isPlaying) {
      await ttsService.stop();
    } else {
      try {
        await ttsService.play(text, languageCode);
      } catch (e) {
        if (e instanceof AppError && e.code === 'tts') {
          Alert.alert('', translate(locale, 'tts.unavailable'));
        }
      }
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, isPlaying && styles.buttonPlaying]}
      onPress={handlePress}
      accessibilityLabel={isPlaying ? translate(locale, 'card.stopTts') : translate(locale, 'card.playTts')}
      accessibilityHint={translate(locale, 'card.playTts')}
    >
      <Text style={[styles.text, isPlaying && styles.textPlaying]}>
        {isPlaying ? translate(locale, 'tts.playing') : translate(locale, 'card.playTts')}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 44,
    minWidth: 80,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  buttonPlaying: {
    backgroundColor: colors.accentBlue,
    borderColor: colors.accentBlue,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  textPlaying: {
    color: colors.bgPrimary,
  },
});
