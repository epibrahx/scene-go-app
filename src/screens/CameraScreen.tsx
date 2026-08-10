import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';
import { Locale, translate } from '../i18n';
import { AppAction } from '../app/appReducer';
import { permissionService, PermissionState } from '../services/permissionService';
import { mediaLifecycle } from '../services/mediaLifecycle';
import { compressImage } from '../utils/imageCompress';
import { colors, fonts, radii } from '../theme/tokens';

export interface CameraScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
  onPhotoCaptured: (uri: string) => void;
}

export default function CameraScreen({ locale, dispatch, onPhotoCaptured }: CameraScreenProps) {
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    let mounted = true;
    const checkPerm = async () => {
      const status = await permissionService.request('camera');
      if (mounted) setPermission(status);
    };
    checkPerm();
    return () => { mounted = false; };
  }, []);

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
      });
      if (photo?.uri) {
        const compressedUri = await compressImage(photo.uri);
        mediaLifecycle.registerTempFile(compressedUri);
        if (photo.uri !== compressedUri) {
          mediaLifecycle.registerTempFile(photo.uri);
        }
        onPhotoCaptured(compressedUri);
        dispatch({ type: 'navigate', route: 'photoResult' });
      }
    } catch (e) {
      console.warn('capture error', e);
    } finally {
      setIsCapturing(false);
    }
  };

  if (permission === 'undetermined') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accentBlue} />
      </View>
    );
  }

  if (permission === 'denied' || permission === 'permanentlyDenied') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.head}>
          <TouchableOpacity style={styles.backBtn} onPress={() => dispatch({ type: 'navigate', route: 'home' })}>
            <Text style={styles.backIcon}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.permText}>{translate(locale, 'camera.permissionNeeded')}</Text>
          <Text style={styles.altText}>{translate(locale, 'camera.textAlternative')}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => permissionService.openSettings()}>
            <Text style={styles.btnText}>{translate(locale, 'permissions.openSettings')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="back">
        <SafeAreaView style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => dispatch({ type: 'navigate', route: 'home' })}>
              <Text style={styles.backIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{translate(locale, 'screens.camera.title')}</Text>
            <View style={{ width: 44 }} />
          </View>
          
          <View style={styles.bottomBar}>
            <TouchableOpacity 
              style={[styles.captureBtnOuter, isCapturing && styles.captureBtnDisabled]} 
              onPress={handleCapture}
              disabled={isCapturing}
              accessibilityLabel={translate(locale, 'camera.capture')}
            >
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  safeArea: { flex: 1, backgroundColor: colors.bgPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between' },
  head: {
    paddingHorizontal: 20,
    paddingTop: 16,
    height: 60,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    height: 60,
  },
  title: { color: colors.textPrimary, fontSize: 16, fontFamily: fonts.body },
  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.bgBar,
    borderRadius: radii.r22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: colors.textPrimary, fontSize: 20 },
  bottomBar: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  captureBtnOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.textPrimary,
  },
  captureBtnDisabled: { opacity: 0.5 },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permText: {
    color: colors.textPrimary,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  altText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  btn: {
    backgroundColor: colors.accentBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.r10,
  },
  btnText: { color: colors.bgPrimary, fontSize: 16, fontWeight: '600' },
});
