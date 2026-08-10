/** Application preferences. AI provider selection is intentionally server-owned. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Locale } from '../i18n';
import { configureLocalRepository } from '../storage/localRepository';

export { TARGET_LANGS } from '../data/countries';

export interface DestinationSetting {
  countryCode: string;
  name: string;
}

export interface TargetLanguageSetting {
  code: string;
  name: string;
}

export interface AppSettings {
  uiLocale: Locale;
  destination: DestinationSetting;
  targetLanguage: TargetLanguageSetting;
  aiConsent: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  uiLocale: 'zh-Hans',
  destination: { countryCode: 'TH', name: '泰国' },
  targetLanguage: { code: 'th-TH', name: '泰语' },
  aiConsent: false,
};

let cached: AppSettings | null = null;
const repository = configureLocalRepository(AsyncStorage);

export async function loadAppSettings(): Promise<AppSettings> {
  try {
    const stored = await repository.getSettings();
    if (stored) cached = stored;
  } catch {
    // Fall back to safe defaults when local storage is unavailable.
  }
  if (cached) return cached;
  cached = { ...DEFAULT_APP_SETTINGS };
  return cached;
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  cached = {
    ...settings,
    destination: { ...settings.destination },
    targetLanguage: { ...settings.targetLanguage },
  };
  try {
    await repository.saveSettings(cached);
  } catch (err) {
    console.warn('[AppSettings] save failed:', err);
  }
}

/** 同步读取内存设置（引擎侧调用；未加载时用默认值） */
export function getCachedSettings(): AppSettings {
  return cached ?? {
    ...DEFAULT_APP_SETTINGS,
    destination: { ...DEFAULT_APP_SETTINGS.destination },
    targetLanguage: { ...DEFAULT_APP_SETTINGS.targetLanguage },
  };
}
