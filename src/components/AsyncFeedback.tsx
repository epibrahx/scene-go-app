import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TaskState } from '../app/appReducer';
import { AppError } from '../errors/AppError';
import { Locale, translate } from '../i18n';
import { colors, radii } from '../theme/tokens';

export interface AsyncFeedbackProps {
  status: TaskState;
  error: AppError | null;
  locale: Locale;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const AsyncFeedback: React.FC<AsyncFeedbackProps> = ({
  status,
  error,
  locale,
  onRetry,
  onDismiss,
}) => {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setShowSuccess(false);
    }
  }, [status]);

  if (status === 'idle' || status === 'listening' || status === 'requestingPermission' || status === 'cancelled') {
    if (!showSuccess) return null;
  }

  const renderContent = () => {
    if (showSuccess) {
      return (
        <View style={styles.card}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.text}>{translate(locale, 'common.success')}</Text>
        </View>
      );
    }

    if (status === 'submitting') {
      return (
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
          <Text style={styles.text}>{translate(locale, 'common.submitting')}</Text>
        </View>
      );
    }

    if (status === 'recoverableError' && error) {
      let errorMessage = error.message;
      if (error.code === 'network') errorMessage = translate(locale, 'common.noNetwork');
      else if (error.code === 'timeout') errorMessage = translate(locale, 'common.timeout');
      
      return (
        <View style={styles.card}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          {onRetry && (
            <TouchableOpacity style={styles.button} onPress={onRetry}>
              <Text style={styles.buttonText}>{translate(locale, 'common.retry')}</Text>
            </TouchableOpacity>
          )}
          {onDismiss && (
            <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={onDismiss}>
              <Text style={styles.buttonText}>{translate(locale, 'common.cancel')}</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  };

  const content = renderContent();
  if (!content) return null;

  return (
    <View style={styles.overlay}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bgOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  card: {
    backgroundColor: colors.bgCardLight,
    padding: 24,
    borderRadius: radii.r16,
    alignItems: 'center',
    minWidth: 200,
  },
  text: {
    color: colors.textPrimary,
    marginTop: 16,
    fontSize: 16,
  },
  successIcon: {
    fontSize: 48,
    color: colors.accentGreen,
  },
  errorText: {
    color: colors.accentRed,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.accentBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.r10,
    minWidth: 120,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 0,
  },
  buttonText: {
    color: colors.bgPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
