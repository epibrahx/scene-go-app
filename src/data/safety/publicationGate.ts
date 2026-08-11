import type { SafetyRecord, SafetyViewProjection } from './types';

/** Production allowlist — only explicitly listed countries can be published */
const PRODUCTION_ALLOWLIST: ReadonlySet<string> = new Set<string>([
  // Empty for now — no country has been verified yet
]);

/** Freshness periods in milliseconds */
const EMERGENCY_FRESHNESS_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const GENERAL_FRESHNESS_MS = 180 * 24 * 60 * 60 * 1000; // 180 days

export function isExpired(record: SafetyRecord, now: number = Date.now()): boolean {
  if (!record.expiresAt) return true; // no expiry set = treat as expired
  return now >= new Date(record.expiresAt).getTime();
}

export function isEmergencyFresh(record: SafetyRecord, now: number = Date.now()): boolean {
  if (!record.verifiedAt) return false;
  return now - new Date(record.verifiedAt).getTime() < EMERGENCY_FRESHNESS_MS;
}

export function isGeneralFresh(record: SafetyRecord, now: number = Date.now()): boolean {
  if (!record.verifiedAt) return false;
  return now - new Date(record.verifiedAt).getTime() < GENERAL_FRESHNESS_MS;
}

/**
 * 判断安全数据是否可发布。要求：
 * 1. publicationStatus === 'published'
 * 2. 在 production allowlist 中
 * 3. 至少 2 名 reviewer
 * 4. 至少 1 条官方证据 URL
 * 5. verifiedAt 不为 null
 * 6. expiresAt 不为 null 且未过期
 * 7. 紧急/使馆号码在 90 天复核期内
 */
export function canPublishSafety(record: SafetyRecord, now: number = Date.now()): boolean {
  if (record.publicationStatus !== 'published') return false;
  if (!PRODUCTION_ALLOWLIST.has(record.code)) return false;
  if (record.reviewers.length < 2) return false;
  if (record.evidenceUrls.length < 1) return false;
  if (!record.verifiedAt || !record.expiresAt) return false;
  if (isExpired(record, now)) return false;
  if (!isEmergencyFresh(record, now)) return false;
  return true;
}

/**
 * 获取安全视图投影。
 * 未通过发布门禁时，emergency 和 embassy 字段完全剥离。
 */
export function getPublishedSafetyView(record: SafetyRecord, now: number = Date.now()): SafetyViewProjection {
  const publishable = canPublishSafety(record, now);
  return {
    code: record.code,
    nameZh: record.nameZh,
    nameEn: record.nameEn,
    langCode: record.langCode,
    publicationStatus: record.publicationStatus,
    ...(publishable ? { emergency: record.emergency, embassy: record.embassy } : {}),
    tipping: record.tipping,
    voltage: record.voltage,
    currency: record.currency,
    water: record.water,
    scams: record.scams,
    sos: record.sos,
  };
}
