import { describe, expect, test } from 'bun:test';
import type { SafetyRecord } from './types';
import { canPublishSafety, getPublishedSafetyView, isExpired } from './publicationGate';

function makeRecord(overrides: Partial<SafetyRecord> = {}): SafetyRecord {
  return {
    code: 'TH', nameZh: '泰国', nameEn: 'Thailand', langCode: 'th-TH',
    emergency: { police: '191', ambulance: '1669', fire: '199', touristPolice: '1155' },
    embassy: '+66 2 245 7010',
    tipping: '...', voltage: '220V', currency: 'THB', water: '...',
    scams: ['scam1'], sos: { local: 'help', phonetic: 'help' },
    publicationStatus: 'published',
    verifiedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    expiresAt: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000).toISOString(), // 80 days from now
    reviewers: [{ name: 'Alice', date: '2026-07-01' }, { name: 'Bob', date: '2026-07-02' }],
    evidenceUrls: [{ url: 'https://example.gov', title: 'Official', accessDate: '2026-07-01' }],
    ...overrides,
  };
}

describe('publicationGate', () => {
  test('draft record cannot be published', () => {
    expect(canPublishSafety(makeRecord({ publicationStatus: 'draft' }))).toBe(false);
  });

  test('unverified record (no verifiedAt) cannot be published', () => {
    expect(canPublishSafety(makeRecord({ verifiedAt: null }))).toBe(false);
  });

  test('expired record cannot be published', () => {
    const expired = makeRecord({ expiresAt: new Date(Date.now() - 1000).toISOString() });
    expect(canPublishSafety(expired)).toBe(false);
    expect(isExpired(expired)).toBe(true);
  });

  test('record not in production allowlist cannot be published', () => {
    // The allowlist is empty, so even a fully valid record should fail
    expect(canPublishSafety(makeRecord())).toBe(false);
  });

  test('record with fewer than 2 reviewers cannot be published', () => {
    expect(canPublishSafety(makeRecord({ reviewers: [{ name: 'Alice', date: '2026-07-01' }] }))).toBe(false);
  });

  test('record with no evidence cannot be published', () => {
    expect(canPublishSafety(makeRecord({ evidenceUrls: [] }))).toBe(false);
  });

  test('unpublishable record view omits emergency and embassy', () => {
    const view = getPublishedSafetyView(makeRecord({ publicationStatus: 'draft' }));
    expect(view.emergency).toBeUndefined();
    expect(view.embassy).toBeUndefined();
    expect(view.tipping).toBeDefined();
    expect(view.scams).toBeDefined();
  });

  test('expired record view omits phone numbers', () => {
    const expired = makeRecord({ expiresAt: new Date(Date.now() - 1000).toISOString() });
    const view = getPublishedSafetyView(expired);
    expect(view.emergency).toBeUndefined();
    expect(view.embassy).toBeUndefined();
  });

  test('no expiresAt treated as expired', () => {
    expect(isExpired(makeRecord({ expiresAt: null }))).toBe(true);
  });
});
