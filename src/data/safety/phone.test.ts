import { describe, expect, test } from 'bun:test';
import { normalizePhoneNumber, isDialSafe, formatDisplayNumber } from './phone';

describe('phone normalization', () => {
  test('normalizes valid numbers', () => {
    expect(normalizePhoneNumber('+66 2 245 7010')).toBe('+6622457010');
    expect(normalizePhoneNumber('191')).toBe('191');
    expect(normalizePhoneNumber('+1-202-495-2266')).toBe('+12024952266');
    expect(normalizePhoneNumber('110')).toBe('110');
    expect(normalizePhoneNumber('+81 3 3403 3064')).toBe('+81334033064');
  });

  test('rejects pause/extension/USSD/empty', () => {
    expect(normalizePhoneNumber('')).toBeNull();
    expect(normalizePhoneNumber(null)).toBeNull();
    expect(normalizePhoneNumber(undefined)).toBeNull();
    expect(normalizePhoneNumber('191,2')).toBeNull(); // pause
    expect(normalizePhoneNumber('191;ext=2')).toBeNull(); // extension
    expect(normalizePhoneNumber('*123#')).toBeNull(); // USSD
    expect(normalizePhoneNumber('191p2')).toBeNull(); // pause
    expect(normalizePhoneNumber('191w2')).toBeNull(); // wait
    expect(normalizePhoneNumber('   ')).toBeNull(); // whitespace only
  });

  test('isDialSafe validates normalized numbers', () => {
    expect(isDialSafe('+6622457010')).toBe(true);
    expect(isDialSafe('191')).toBe(true);
    expect(isDialSafe('')).toBe(false);
    expect(isDialSafe(null)).toBe(false);
    expect(isDialSafe('abc')).toBe(false);
  });

  test('formatDisplayNumber formats correctly', () => {
    expect(formatDisplayNumber('191')).toBe('191');
    expect(formatDisplayNumber('+6622457010')).toMatch(/^\+66/);
  });
});
