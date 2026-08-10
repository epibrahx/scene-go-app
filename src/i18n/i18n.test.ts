import { describe, expect, test } from 'bun:test';
import { dictionaries, getDictionaryKeys, translate } from './index';

describe('i18n', () => {
  test('keeps English and Simplified Chinese keys aligned', () => {
    expect(getDictionaryKeys(dictionaries.en)).toEqual(getDictionaryKeys(dictionaries['zh-Hans']));
  });

  test('interpolates named values', () => {
    expect(translate('en', 'common.rateLimit', { seconds: 12 })).toBe(
      'Too many requests. Try again in 12 seconds.',
    );
    expect(translate('zh-Hans', 'common.rateLimit', { seconds: 3 })).toContain('3 秒');
  });
});