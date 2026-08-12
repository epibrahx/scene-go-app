import { describe, expect, test } from 'bun:test';
import { createRuntimeConfig } from './runtimeConfig';

describe('runtimeConfig', () => {
  test('ignores NODE_ENV (release bundles inline it as production)', () => {
    // 回归：Release bundle 内联 process.env.NODE_ENV='production'，若用它判环境，
    // 本地 Release 构建会被误判为生产环境。
    expect(createRuntimeConfig({ NODE_ENV: 'production' }).environment).toBe('development');
    expect(createRuntimeConfig({ NODE_ENV: 'development' }).environment).toBe('development');
  });

  test('distinguishes explicit runtime environments', () => {
    expect(createRuntimeConfig({ EXPO_PUBLIC_APP_ENV: 'preview' }).environment).toBe('preview');
    expect(createRuntimeConfig({ EXPO_PUBLIC_APP_ENV: 'production' }).isProduction).toBe(true);
    expect(createRuntimeConfig({}).isProduction).toBe(false);
  });
});
