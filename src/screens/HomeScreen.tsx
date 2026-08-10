import React from 'react';
import { View, StyleSheet, SafeAreaView, Text, Alert } from 'react-native';
import { Locale, translate } from '../i18n';
import { AppAction, TaskState } from '../app/appReducer';
import { AppError } from '../errors/AppError';
import { InputComposer } from '../components/InputComposer';
import { AsyncFeedback } from '../components/AsyncFeedback';
import { colors, fonts } from '../theme/tokens';
import { expressionEngine } from '../core/expressionEngine';
import { cardStackStore } from '../core/cardStackStore';
import { getCachedSettings, saveAppSettings } from '../utils/appSettings';

export interface HomeScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
  taskState: TaskState;
  taskError: AppError | null;
}

export default function HomeScreen({ locale, dispatch, taskState, taskError }: HomeScreenProps) {
  const handleAsk = async (text: string) => {
    const settings = getCachedSettings();
    
    const execute = async () => {
      const requestId = Date.now().toString();
      dispatch({ type: 'taskStart', requestId, status: 'submitting' });
      try {
        const card = await expressionEngine.generateCard(text);
        cardStackStore.getState().add(card);
        dispatch({ type: 'taskSuccess', requestId });
        dispatch({ type: 'navigate', route: 'card' });
      } catch (err) {
        const error = err instanceof AppError ? err : new AppError('server', String(err));
        dispatch({ type: 'taskError', requestId, error });
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
              execute();
            },
          },
        ]
      );
      return;
    }

    execute();
  };

  const handleCamera = () => {
    dispatch({ type: 'navigate', route: 'camera' });
  };

  const isBusy = taskState === 'submitting' || taskState === 'requestingPermission' || taskState === 'listening';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{translate(locale, 'screens.home.title')}</Text>
          <Text style={styles.subtitle}>{translate(locale, 'screens.home.description')}</Text>
        </View>
        <View style={styles.spacer} />
        <InputComposer
          locale={locale}
          onSubmitText={handleAsk}
          onPressCamera={handleCamera}
          disabled={isBusy}
        />
      </View>
      <AsyncFeedback
        status={taskState}
        error={taskError}
        locale={locale}
        onDismiss={() => dispatch({ type: 'taskReset' })}
      />
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
    justifyContent: 'space-between',
  },
  header: {
    padding: 24,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  spacer: {
    flex: 1,
  },
});
