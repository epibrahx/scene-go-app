import React, { useReducer, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native';
import { colors } from '../theme/tokens';
import HomeScreen from '../screens/HomeScreen';
import CardResultScreen from '../screens/CardResultScreen';
import PresentationScreen from '../screens/PresentationScreen';
import CameraScreen from '../screens/CameraScreen';
import PhotoResultScreen from '../screens/PhotoResultScreen';
import CountryPickerScreen from '../screens/CountryPickerScreen';
import LocationSwitchScreen from '../screens/LocationSwitchScreen';
import SafetyInfoScreen from '../screens/SafetyInfoScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SafetyCardScreen from '../screens/SafetyCardScreen';
import SafetyDetailSheet from '../screens/SafetyDetailSheet';
import { appReducer, initialAppState, Route } from './appReducer';
import { ErrorBoundary } from './ErrorBoundary';
import { getCachedSettings } from '../utils/appSettings';

/**
 * 跟视图：按 DESIGN-v2.1.pen 的 11 屏路由分发。
 * 未实现的屏先渲染占位（自用过渡），逐屏替换为真实实现。
 */
export function AppShell() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const [photoUri, setPhotoUri] = useState('');
  const locale = getCachedSettings().uiLocale;

  switch (state.route) {
    case 'home':
      return (
        <HomeScreen
          locale={locale}
          dispatch={dispatch}
          taskState={state.task}
          taskError={state.taskError}
        />
      );
    case 'card':
      return <CardResultScreen locale={locale} dispatch={dispatch} />;
    case 'presentation':
      return <PresentationScreen locale={locale} dispatch={dispatch} />;
    case 'camera':
      return <CameraScreen locale={locale} dispatch={dispatch} onPhotoCaptured={setPhotoUri} />;
    case 'photoResult':
      return <PhotoResultScreen locale={locale} dispatch={dispatch} photoUri={photoUri} />;
    case 'country':
      return <CountryPickerScreen locale={locale} dispatch={dispatch} />;
    case 'locationSwitch':
      return <LocationSwitchScreen locale={locale} dispatch={dispatch} />;
    case 'safetyInfo':
      return <SafetyInfoScreen locale={locale} dispatch={dispatch} />;
    case 'settings':
      return <SettingsScreen locale={locale} dispatch={dispatch} />;
    case 'safety':
      return <SafetyCardScreen locale={locale} dispatch={dispatch} />;
    case 'safetyDetail':
      return <SafetyDetailSheet locale={locale} dispatch={dispatch} />;
    default:
      return <Placeholder route={state.route} />;
  }
}

function Placeholder({ route }: { route: Route }) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.title}>{route}</Text>
        <Text style={styles.description}>屏在建</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '600' },
  description: { color: colors.textTertiary, fontSize: 13, marginTop: 8 },
});

export default AppShell;
