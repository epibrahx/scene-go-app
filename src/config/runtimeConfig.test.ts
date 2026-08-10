import { describe, expect, test } from 'bun:test';
import { AppError } from '../errors/AppError';
import { createRuntimeConfig } from './runtimeConfig';

describe('runtimeConfig production gate', () => {
  test('distinguishes all runtime environments', () => {
    expect(createRuntimeConfig({ NODE_ENV: 'development' }).environment).toBe('development');
    expect(createRuntimeConfig({ EXPO_PUBLIC_APP_ENV: 'preview' }).environment).toBe('preview');
    expect(createRuntimeConfig({
      EXPO_PUBLIC_APP_ENV: 'production',
      EXPO_PUBLIC_AI_PROXY_URL: 'https://api.scenego.app/ai',
    }).isProduction).toBe(true);
  });

  test('rejects insecure, localhost, OpenRouter, and client-key production config', () => {
    const production = (url: string, extra = {}) => () => createRuntimeConfig({
      EXPO_PUBLIC_APP_ENV: 'production', EXPO_PUBLIC_AI_PROXY_URL: url, ...extra,
    });
    expect(production('http://api.scenego.app/ai')).toThrow(AppError);
    expect(production('https://localhost:8787/ai')).toThrow(AppError);
    expect(production('https://openrouter.ai/api/v1')).toThrow(AppError);
    expect(production('https://api.scenego.app/ai', { EXPO_PUBLIC_OPENROUTER_API_KEY: 'client-key' })).toThrow(AppError);
  });
});