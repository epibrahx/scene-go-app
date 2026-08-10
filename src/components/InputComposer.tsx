import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Pressable } from 'react-native';
import { Locale, translate } from '../i18n';
import { colors, radii, fonts } from '../theme/tokens';
import { speechController } from '../core/speechController';

export interface InputComposerProps {
  locale: Locale;
  onSubmitText: (text: string) => void;
  onPressCamera: () => void;
  disabled: boolean;
}

export const InputComposer: React.FC<InputComposerProps> = ({
  locale,
  onSubmitText,
  onPressCamera,
  disabled,
}) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [partial, setPartial] = useState('');
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubPartial = speechController.onPartial((txt) => {
      setPartial(txt);
    });
    const unsubFinal = speechController.onFinal((txt) => {
      if (sessionIdRef.current) {
        // final text received
        onSubmitText(txt);
        setPartial('');
      }
    });
    const unsubError = speechController.onError((err) => {
      console.warn('speech error', err);
      setPartial('');
    });
    return () => {
      unsubPartial();
      unsubFinal();
      unsubError();
    };
  }, [onSubmitText]);

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSubmitText(text.trim());
      setText('');
    }
  };

  const handlePressIn = async () => {
    if (disabled) return;
    try {
      const sessionId = Date.now().toString();
      sessionIdRef.current = sessionId;
      await speechController.start(locale === 'zh-Hans' ? 'zh-CN' : 'en-US', sessionId);
      setIsListening(true);
      setPartial('');
    } catch (e) {
      console.warn(e);
      sessionIdRef.current = null;
    }
  };

  const handlePressOut = async () => {
    if (disabled || !sessionIdRef.current) return;
    const id = sessionIdRef.current;
    setIsListening(false);
    await speechController.stop(id);
    sessionIdRef.current = null;
  };

  return (
    <View style={styles.container}>
      {isListening && (
        <View style={styles.listeningOverlay}>
          <Text style={styles.listeningText}>
            {partial || translate(locale, 'home.listening')}
          </Text>
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, disabled && styles.disabled]}
          placeholder={translate(locale, 'home.textPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={text}
          onChangeText={setText}
          editable={!disabled}
          multiline
        />
        {text.trim() ? (
          <TouchableOpacity
            style={[styles.btn, disabled && styles.disabled]}
            onPress={handleSend}
            disabled={disabled}
            accessibilityLabel={translate(locale, 'home.sendButton')}
          >
            <Text style={styles.btnText}>{translate(locale, 'home.sendButton')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, disabled && styles.disabled]}
            onPress={onPressCamera}
            disabled={disabled}
            accessibilityLabel={translate(locale, 'home.cameraButton')}
          >
            <Text style={styles.btnText}>{translate(locale, 'home.cameraButton')}</Text>
          </TouchableOpacity>
        )}
      </View>
      <Pressable
        style={[styles.voiceBtn, disabled && styles.disabled]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityLabel={translate(locale, 'home.holdToSpeak')}
      >
        <Text style={styles.voiceBtnText}>
          {translate(locale, 'home.holdToSpeak')}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.bgCardLight,
    borderTopLeftRadius: radii.r16,
    borderTopRightRadius: radii.r16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.bgCard,
    borderRadius: radii.r10,
    color: colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.body,
  },
  btn: {
    minWidth: 60,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accentBlue,
    borderRadius: radii.r10,
    marginLeft: 8,
    paddingHorizontal: 12,
  },
  btnText: {
    color: colors.bgPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  voiceBtn: {
    height: 48,
    backgroundColor: colors.bgCard,
    borderRadius: radii.r10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  voiceBtnText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  listeningOverlay: {
    position: 'absolute',
    top: -60,
    left: 16,
    right: 16,
    backgroundColor: colors.bgCard,
    borderRadius: radii.r10,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.accentBlue,
    shadowColor: colors.accentBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  listeningText: {
    color: colors.textPrimary,
    fontSize: 16,
    textAlign: 'center',
  },
});
