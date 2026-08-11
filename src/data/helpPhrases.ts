/**
 * 求助句（当地语言大字卡）：按目标语言取「请帮帮我」的真实翻译。
 * 仅收录 appSettings 可选目标语言（泰/日/韩/英/法）；其余语言回退英语。
 */
export interface HelpPhrase {
  text: string;
  phonetic: string;
  zh: string;
}

const HELP_PHRASES: Record<string, HelpPhrase> = {
  'th-TH': { text: 'โปรดช่วยฉันด้วย', phonetic: 'bpròht chûay chăn dûay', zh: '请帮帮我' },
  'ja-JP': { text: '助けてください', phonetic: 'tasukete kudasai', zh: '请帮帮我' },
  'ko-KR': { text: '도와주세요', phonetic: 'dowajuseyo', zh: '请帮帮我' },
  'en-US': { text: 'Please help me', phonetic: '', zh: '请帮帮我' },
  'fr-FR': { text: "Aidez-moi, s'il vous plaît", phonetic: 'Aidez-moi', zh: '请帮帮我' },
};

const LANG_FAMILY_KEYS: Record<string, string> = {
  th: 'th-TH',
  ja: 'ja-JP',
  ko: 'ko-KR',
  en: 'en-US',
  fr: 'fr-FR',
};

export function getHelpPhrase(langCode: string): HelpPhrase {
  if (HELP_PHRASES[langCode]) return HELP_PHRASES[langCode];
  const family = LANG_FAMILY_KEYS[langCode.split('-')[0]];
  return HELP_PHRASES[family] ?? HELP_PHRASES['en-US'];
}
