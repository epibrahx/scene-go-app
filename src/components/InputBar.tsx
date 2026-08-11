import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radii } from '../theme/tokens';

export type MicMode = 'speak' | 'listen';

export interface InputBarProps {
  placeholder: string;
  onSubmitText: (text: string) => void;
  onPressCamera?: () => void;
  /** 提供则渲染 MicBtn：点按切换模式，按住说话 */
  micMode?: MicMode;
  onToggleMicMode?: () => void;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
  disabled?: boolean;
}

/**
 * 输入栏（DESIGN-v2.1.pen InputBar 组件）。
 * 画布含 4 键（Cam/Mic/Field/Send）；01 屏实例禁用 MicBtn（MicMode 缺省不渲染），
 * 02 屏实例渲染 MicBtn（点按切换 我说/对方说，按住说话）。
 */
export function InputBar({
  placeholder,
  onSubmitText,
  onPressCamera,
  micMode,
  onToggleMicMode,
  onHoldStart,
  onHoldEnd,
  disabled,
}: InputBarProps) {
  const [text, setText] = useState('');

  const submit = () => {
    const value = text.trim();
    if (!value || disabled) return;
    setText('');
    onSubmitText(value);
  };

  return (
    <View style={styles.bar}>
      {onPressCamera ? (
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onPressCamera}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="拍照"
        >
          <Image source={require('../../assets/icon-camera.png')} style={styles.icon} resizeMode="contain" />
        </TouchableOpacity>
      ) : null}
      {micMode && onToggleMicMode ? (
        <Pressable
          style={[styles.iconBtn, micMode === 'listen' ? styles.micBtnListen : null]}
          onPress={onToggleMicMode}
          onPressIn={onHoldStart}
          onPressOut={onHoldEnd}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={micMode === 'speak' ? '我说' : '对方说'}
        >
          <Image
            source={require('../../assets/icon-mic.png')}
            style={[styles.icon, micMode === 'listen' ? styles.micIconListen : null]}
            resizeMode="contain"
          />
        </Pressable>
      ) : null}
      <View style={styles.field}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          returnKeyType="send"
          editable={!disabled}
          accessibilityLabel="输入你想说的话"
        />
      </View>
      <TouchableOpacity
        style={[styles.sendBtn, disabled ? styles.sendDisabled : null]}
        onPress={submit}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="发送"
      >
        <Image source={require('../../assets/icon-send.png')} style={styles.sendIcon} resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    height: 72,
    backgroundColor: colors.bgBar,
    borderRadius: radii.r16,
    gap: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { width: 18, height: 18, tintColor: colors.textSecondary },
  micBtnListen: {
    borderWidth: 1,
    borderColor: colors.accentBlue,
  },
  micIconListen: { tintColor: colors.accentBlue },
  field: {
    flex: 1,
    height: 40,
    backgroundColor: colors.bgCardLight,
    borderRadius: radii.r10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  input: {
    color: colors.textPrimary,
    fontSize: 13,
    padding: 0,
  },
  sendBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.accentBlue,
    borderRadius: radii.r10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  sendIcon: { width: 18, height: 18, tintColor: '#0a0a1e' },
});
