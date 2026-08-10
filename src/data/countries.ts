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