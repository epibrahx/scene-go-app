/** @deprecated Use src/data/safety/registry.ts directly. */
import { getAllSafetyRecords, getSafetyRecord, getSupportedSafetyCodes } from './safety/registry';
import type { SafetyRecord } from './safety/types';
import type { CountrySafetyCandidate } from './safety/candidates';

export type CountrySafety = CountrySafetyCandidate;
export const COUNTRY_SAFETY: CountrySafety[] = getAllSafetyRecords();
export const SUPPORTED_COUNTRY_CODES: string[] = getSupportedSafetyCodes();
export function getCountrySafety(code: string): CountrySafety | undefined {
  return getSafetyRecord(code);
}
