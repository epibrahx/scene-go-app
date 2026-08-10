import React from 'react';
import AppShell from './src/app/AppShell';
import ErrorBoundary from './src/app/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}
