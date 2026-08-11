/** 安全数据注册表：所有国家全部标记 draft/unverified */
import { COUNTRY_SAFETY_CANDIDATES } from './candidates';
import type { SafetyRecord } from './types';

// Build registry: ALL countries start as draft
const registry: Map<string, SafetyRecord> = new Map(
  COUNTRY_SAFETY_CANDIDATES.map((candidate) => [
    candidate.code,
    {
      ...candidate,
      publicationStatus: 'draft' as const,
      verifiedAt: null,
      expiresAt: null,
      reviewers: [],
      evidenceUrls: [],
    },
  ])
);

export function getSafetyRecord(code: string): SafetyRecord | undefined {
  return registry.get(code.toUpperCase());
}

export function getAllSafetyRecords(): SafetyRecord[] {
  return Array.from(registry.values());
}

export function getSupportedSafetyCodes(): string[] {
  return Array.from(registry.keys());
}
