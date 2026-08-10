import React, { useEffect, useReducer, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { loadRuntimeConfig } from '../config/runtimeConfig';
import { toAppError } from '../errors/AppError';
import { Locale, TranslationKey, translate } from '../i18n';
import HomeScreen from '../screens/HomeScreen';
import CardResultScreen from '../screens/CardResultScreen';
import PresentationScreen from '../screens/PresentationScreen';
import CameraScreen from '../screens/CameraScreen';
import PhotoResultScreen from '../screens/PhotoResultScreen';
import { colors } from '../theme/tokens';
import { DEFAULT_APP_SETTINGS, loadAppSettings, getCachedSettings } from '../utils/appSettings';
import { appReducer, initialAppState } from './appReducer';
import { mediaLifecycle } from '../services/mediaLifecycle';
import CountryPickerScreen from '../screens/CountryPickerScreen';
import SafetyCardScreen from '../screens/SafetyCardScreen';
import SafetyDetailSheet from '../screens/SafetyDetailSheet';
import SettingsScreen from '../screens/SettingsScreen';
import { SafetyFAB } from '../components/SafetyFAB';

export function AppShell() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const [photoUri, setPhotoUri] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      try {
        loadRuntimeConfig();
        await loadAppSettings();
        if (!mounted) return;
        setIsReady(true);
        dispatch({ type: 'startupReady' });
      } catch (error) {
        if (mounted) dispatch({ type: 'startupFatal', error: toAppError(error, 'config') });
      }
    };
    void boot();
    
    const unsubscribe = mediaLifecycle.startBackgroundMonitor();
    
    return () => { 
      mounted = false; 
      unsubscribe();
    };
  }, []);

  const locale = isReady ? getCachedSettings().uiLocale : DEFAULT_APP_SETTINGS.uiLocale;

  if (state.startup === 'booting') {
    return <CenteredMessage text={translate(locale, 'common.loading')} />;
  }
  if (state.startup === 'fatal') {
    return <CenteredMessage text={translate(locale, 'common.fatal')} detail={state.fatalError?.message} />;
  }

  let screen;
  switch (state.route) {
    case 'home':
      screen = <HomeScreen locale={locale} dispatch={dispatch} taskState={state.task.status} taskError={state.task.error} />;
      break;
    case 'card':
      screen = <CardResultScreen locale={locale} dispatch={dispatch} />;
      break;
    case 'presentation':
      screen = <PresentationScreen locale={locale} dispatch={dispatch} />;
      break;
    case 'camera':
      screen = <CameraScreen locale={locale} dispatch={dispatch} onPhotoCaptured={setPhotoUri} />;
      break;
    case 'photoResult':
      screen = <PhotoResultScreen locale={locale} dispatch={dispatch} photoUri={photoUri} />;
      break;
    case 'country':
      screen = <CountryPickerScreen locale={locale} dispatch={dispatch} />;
      break;
    case 'settings':
      screen = <SettingsScreen locale={locale} dispatch={dispatch} />;
      break;
    case 'safety':
      screen = <SafetyCardScreen locale={locale} dispatch={dispatch} />;
      break;
    case 'safetyDetail':
      screen = <SafetyDetailSheet locale={locale} dispatch={dispatch} />;
      break;
    default:
      const titleKey = `screens.${state.route}.title` as TranslationKey;
      const descriptionKey = `screens.${state.route}.description` as TranslationKey;
      screen = (
        <SafeAreaView style={styles.root}>
          <View style={styles.content}>
            <Text style={styles.title}>{translate(locale, titleKey)}</Text>
            <Text style={styles.description}>{translate(locale, descriptionKey)}</Text>
          </View>
        </SafeAreaView>
      );
  }

  return (
    <>
      {screen}
      {(state.route === 'home' || state.route === 'card') && (
        <SafetyFAB locale={locale} dispatch={dispatch} />
      )}
    </>
  );
}

function CenteredMessage({ text, detail }: { text: string; detail?: string }) {
  return (
    <SafeAreaView style={styles.root}>
      <View accessibilityRole="alert" style={styles.content}>
        <Text style={styles.title}>{text}</Text>
        {detail ? <Text style={styles.description}>{detail}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '600', textAlign: 'center' },
  description: { color: colors.textTertiary, fontSize: 14, marginTop: 10, textAlign: 'center' },
});

export default AppShell;