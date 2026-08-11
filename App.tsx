import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppShell } from './src/app/AppShell';
import { ErrorBoundary } from './src/app/ErrorBoundary';
import { loadAppSettings } from './src/utils/appSettings';

/**
 * 入口：挂 ErrorBoundary + AppShell（DESIGN-v2.1.pen 11 屏路由）。
 * loadAppSettings 异步水合设置到内存缓存（getCachedSettings 在未加载时回退默认值）。
 */
export default function App() {
  useEffect(() => {
    void loadAppSettings().catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <AppShell />
    </ErrorBoundary>
  );
}
