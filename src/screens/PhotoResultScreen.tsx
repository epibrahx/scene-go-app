import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { Locale, translate } from '../i18n';
import { AppAction } from '../app/appReducer';
import { expressionEngine, ProcessImageResult } from '../core/expressionEngine';
import { cardStackStore } from '../core/cardStackStore';
import { colors, fonts, radii } from '../theme/tokens';
import { AppError } from '../errors/AppError';

export interface PhotoResultScreenProps {
  locale: Locale;
  dispatch: React.Dispatch<AppAction>;
  photoUri: string;
}

export default function PhotoResultScreen({ locale, dispatch, photoUri }: PhotoResultScreenProps) {
  const [result, setResult] = useState<ProcessImageResult | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  const analyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await expressionEngine.processImage(photoUri);
      setResult(res);
    } catch (err) {
      setError(err instanceof AppError ? err : new AppError('server', String(err)));
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    analyze();
  }, [photoUri]);

  const handleGenerateCard = () => {
    if (result) {
      cardStackStore.getState().add(result.card);
      dispatch({ type: 'navigate', route: 'card' });
    }
  };

  const renderContent = () => {
    if (isAnalyzing) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
          <Text style={styles.statusText}>{translate(locale, 'photo.analyzing')}</Text>
        </View>
      );
    }

    if (error) {
      let errorMessage = error.message;
      if (error.code === 'network') errorMessage = translate(locale, 'common.noNetwork');
      else if (error.code === 'timeout') errorMessage = translate(locale, 'common.timeout');

      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.btn} onPress={analyze}>
            <Text style={styles.btnText}>{translate(locale, 'common.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (result) {
      return (
        <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
          <Text style={styles.title}>{result.scenario.title}</Text>
          {result.scenario.subText && <Text style={styles.subText}>{result.scenario.subText}</Text>}
          
          <View style={styles.detailsBox}>
            <Text style={styles.detailsTitle}>识别内容</Text>
            {result.scenario.recommendedPhrases?.map((p, i) => (
              <Text key={i} style={styles.detailItem}>• {p}</Text>
            ))}
            {result.scenario.tips?.map((t, i) => (
              <Text key={i} style={styles.detailItem}>💡 {t}</Text>
            ))}
          </View>
        </ScrollView>
      );
    }

    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{translate(locale, 'photo.noResult')}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.head}>
        <TouchableOpacity style={styles.backBtn} onPress={() => dispatch({ type: 'navigate', route: 'home' })}>
          <Text style={styles.backIcon}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.imageContainer}>
        <Image source={{ uri: photoUri }} style={styles.image} resizeMode="cover" />
      </View>
      
      <View style={styles.bottomPanel}>
        {renderContent()}
        
        {!isAnalyzing && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.actionBtnSecondary]} 
              onPress={() => dispatch({ type: 'navigate', route: 'camera' })}
            >
              <Text style={styles.actionBtnTextSecondary}>{translate(locale, 'camera.retake')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, !result && styles.disabledBtn]} 
              onPress={handleGenerateCard}
              disabled={!result}
            >
              <Text style={styles.actionBtnText}>{translate(locale, 'photo.generateCard')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgPrimary },
  head: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.bgBar,
    borderRadius: radii.r22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: colors.textPrimary, fontSize: 20 },
  imageContainer: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bottomPanel: {
    height: 320,
    backgroundColor: colors.bgCardLight,
    borderTopLeftRadius: radii.r20,
    borderTopRightRadius: radii.r20,
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: colors.textPrimary,
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: colors.accentRed,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: colors.accentBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.r10,
  },
  btnText: { color: colors.bgPrimary, fontSize: 16, fontWeight: '600' },
  resultContainer: {
    flex: 1,
  },
  resultContent: {
    paddingBottom: 20,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  detailsBox: {
    backgroundColor: colors.bgCard,
    padding: 16,
    borderRadius: radii.r12,
  },
  detailsTitle: {
    color: colors.textTertiary,
    fontSize: 12,
    marginBottom: 8,
  },
  detailItem: {
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 2,
    height: 48,
    backgroundColor: colors.accentBlue,
    borderRadius: radii.r12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  actionBtnText: {
    color: colors.bgPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  actionBtnTextSecondary: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
