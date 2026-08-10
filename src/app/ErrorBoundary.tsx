import React, { ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/tokens';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <View accessibilityRole="alert" style={styles.root}>
        <Text style={styles.title}>SceneGo could not continue</Text>
        <Text style={styles.message}>{this.state.error.message}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bgPrimary },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  message: { color: colors.textTertiary, fontSize: 14, marginTop: 8, textAlign: 'center' },
});

export default ErrorBoundary;