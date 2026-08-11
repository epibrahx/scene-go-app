import { describe, expect, test } from 'bun:test';
import { COUNTRY_SAFETY_CANDIDATES } from './candidates';
import { normalizePhoneNumber } from './phone';

describe('countrySafety data integrity', () => {
  test('has at least 1 country', () => {
    expect(COUNTRY_SAFETY_CANDIDATES.length).toBeGreaterThanOrEqual(1);
  });

  test('country codes are unique', () => {
    const codes = COUNTRY_SAFETY_CANDIDATES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  test('all countries have required fields and valid phone formats', () => {
    for (const c of COUNTRY_SAFETY_CANDIDATES) {
      expect(c.nameZh).toBeTruthy();
      expect(c.nameEn).toBeTruthy();
      expect(c.langCode).toMatch(/^[a-zA-Z]{2,3}(-[A-Z]{2})?$/);
      // Emergency phones must be normalizable
      expect(normalizePhoneNumber(c.emergency.police)).not.toBeNull();
      expect(normalizePhoneNumber(c.emergency.ambulance)).not.toBeNull();
      expect(normalizePhoneNumber(c.emergency.fire)).not.toBeNull();
      // Customs fields
      expect(c.tipping).toBeTruthy();
      expect(c.voltage).toBeTruthy();
      expect(c.currency).toBeTruthy();
      expect(c.water).toBeTruthy();
      expect(c.scams.length).toBeGreaterThanOrEqual(1);
      expect(c.sos?.local).toBeTruthy();
      expect(c.sos?.phonetic).toBeTruthy();
    }
  });
});
