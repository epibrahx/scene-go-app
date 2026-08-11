/** Standalone country/language option data shared by profile and app settings. */
export interface CountryOption {
  code: string;
  name: string;
}

export interface LanguageOption {
  code: string;
  name: string;
}

/** Nationality options are intentionally broader than destination safety coverage. */
export const NATIONALITY_OPTIONS: CountryOption[] = [
  { code: 'CN', name: '中国' },
  { code: 'TH', name: '泰国' },
  { code: 'JP', name: '日本' },
  { code: 'KR', name: '韩国' },
  { code: 'SG', name: '新加坡' },
  { code: 'MY', name: '马来西亚' },
  { code: 'ID', name: '印度尼西亚' },
  { code: 'VN', name: '越南' },
  { code: 'PH', name: '菲律宾' },
  { code: 'US', name: '美国' },
  { code: 'GB', name: '英国' },
  { code: 'AU', name: '澳大利亚' },
];

/** UI language and expression preference options. */
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'en-US', name: 'English' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'th-TH', name: 'ไทย' },
  { code: 'ms-MY', name: 'Bahasa Melayu' },
  { code: 'id-ID', name: 'Bahasa Indonesia' },
  { code: 'vi-VN', name: 'Tiếng Việt' },
  { code: 'fil-PH', name: 'Filipino' },
];

/** Destination languages currently exposed by app settings. */
export const TARGET_LANGS: LanguageOption[] = [
  { name: '泰语', code: 'th-TH' },
  { name: '日语', code: 'ja-JP' },
  { name: '韩语', code: 'ko-KR' },
  { name: '英语', code: 'en-US' },
  { name: '法语', code: 'fr-FR' },
];

/** 目的地国家（ISO 码）→ 目标语言中文名，06/09 屏语言对展示共用 */
export const DEST_LANG_NAMES: Record<string, string> = {
  TH: '泰语',
  JP: '日语',
  KR: '韩语',
  VN: '越南语',
  SG: '英语',
  MY: '马来语',
  ID: '印尼语',
  LA: '老挝语',
};

/** BCP-47 语言码 → 中文名（10 屏 26 国列表展示用） */
export const LANG_NAME_BY_CODE: Record<string, string> = {
  'zh-CN': '中文',
  'zh-HK': '粤语',
  'zh-MO': '粤语',
  'ja-JP': '日语',
  'ko-KR': '韩语',
  'th-TH': '泰语',
  'vi-VN': '越南语',
  'en-SG': '英语',
  'en-GB': '英语',
  'en-US': '英语',
  'en-CA': '英语',
  'en-AU': '英语',
  'en-NZ': '英语',
  'ms-MY': '马来语',
  'id-ID': '印尼语',
  'fil-PH': '菲律宾语',
  'km-KH': '高棉语',
  'hi-IN': '印地语',
  'tr-TR': '土耳其语',
  'ar-AE': '阿拉伯语',
  'fr-FR': '法语',
  'de-DE': '德语',
  'it-IT': '意大利语',
  'es-ES': '西班牙语',
  'es-MX': '西班牙语',
  'ru-RU': '俄语',
};