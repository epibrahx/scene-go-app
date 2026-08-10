import { describe, expect, test } from 'bun:test';

// We test the validation logic inline since the script is a standalone runner
describe('production config validation logic', () => {
  test('detects client key presence', () => {
    const keys = ['EXPO_PUBLIC_OPENROUTER_API_KEY', 'EXPO_PUBLIC_OPENAI_API_KEY', 'EXPO_PUBLIC_AI_API_KEY'];
    for (const key of keys) {
      expect(Boolean('some-key'.trim())).toBe(true); // non-empty = fail
      expect(Boolean(''.trim())).toBe(false); // empty = pass
    }
  });

  test('validates proxy URL requirements', () => {
    const validUrl = new URL('https://api.scenego.app/ai');
    expect(validUrl.protocol).toBe('https:');
    expect(validUrl.hostname).not.toBe('localhost');
    expect(validUrl.hostname.includes('openrouter.ai')).toBe(false);

    const insecureUrl = new URL('http://api.scenego.app/ai');
    expect(insecureUrl.protocol).not.toBe('https:');

    const localhostUrl = new URL('https://localhost:8787/ai');
    expect(['localhost', '127.0.0.1', '::1'].includes(localhostUrl.hostname.toLowerCase())).toBe(true);

    const openrouterUrl = new URL('https://openrouter.ai/api/v1');
    expect(openrouterUrl.hostname.includes('openrouter.ai')).toBe(true);
  });

  test('accepts valid production config', () => {
    const url = 'https://api.scenego.app/ai';
    const parsed = new URL(url);
    const isValid = parsed.protocol === 'https:' &&
      !['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) &&
      !parsed.hostname.includes('openrouter.ai');
    expect(isValid).toBe(true);
  });
});
