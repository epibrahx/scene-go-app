import React, { useRef } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Locale } from '../i18n';
import { AppAction } from '../app/appReducer';
import { colors, fonts, radii } from '../theme/tokens';

export interface CameraScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
  onPhotoCaptured: (uri: string) => void;
}

/**
 * 04 内联相机（DESIGN-v2.1.pen 04 屏）。
 * Header（SCENEGO + 取消）+ 全屏取景器 + 底部 72px 快门。极简，无引导。
 */
export default function CameraScreen({ dispatch, onPhotoCaptured }: CameraScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const busyRef = useRef(false);

  const take = async () => {
    if (busyRef.current) return;
    if (!permission?.granted) {
      await requestPermission();
      return;
    }
    busyRef.current = true;
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        onPhotoCaptured(photo.uri);
        dispatch({ type: 'navigate', route: 'photoResult' });
      }
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.top}>
        <View style={styles.header}>
          <Text style={styles.brand}>SCENEGO</Text>
          <Pressable
            style={styles.cancel}
            onPress={() => dispatch({ type: 'navigate', route: 'home' })}
            accessibilityRole="button"
            accessibilityLabel="取消"
          >
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={styles.viewfinder}>
        {permission?.granted ? (
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        ) : (
          <Pressable style={styles.permissionGate} onPress={() => void requestPermission()}>
            <Text style={styles.permissionText}>
              {permission?.canAskAgain ? '需要相机权限，点按授权' : '相机权限不可用'}
            </Text>
          </Pressable>
        )}
      </View>

      <SafeAreaView style={styles.bottomBar}>
        <Pressable
          style={styles.shutterOuter}
          onPress={() => void take()}
          accessibilityRole="button"
          accessibilityLabel="拍照"
        >
          <View style={styles.shutterInner} />
        </Pressable>
      </SafeAreaView>

      {busyRef.current ? <ActivityIndicator style={styles.busy} color={colors.textPrimary} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090b' },
  top: { backgroundColor: '#09090b' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: fonts.mono,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  cancel: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.r12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  cancelText: { color: colors.textSecondary, fontSize: 13 },
  viewfinder: { flex: 1 },
  camera: { flex: 1 },
  permissionGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: { color: colors.textSecondary, fontSize: 14 },
  bottomBar: {
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b',
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  busy: { position: 'absolute', top: '50%', left: '50%', marginLeft: -12, marginTop: -12 },
});
