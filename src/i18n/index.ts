import { en } from './en';
import { zhHans } from './zh-Hans';

export const SUPPORTED_LOCALES = ['zh-Hans', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const dictionaries = { 'zh-Hans': zhHans, en } as const;

type LeafKeysAtMostThreeLevels<T> = {
  [K1 in keyof T & string]: T[K1] extends string
    ? K1
    : {
        [K2 in keyof T[K1] & string]: T[K1][K2] extends string
          ? `${K1}.${K2}`
          : {
              [K3 in keyof T[K1][K2] & string]: T[K1][K2][K3] extends string
                ? `${K1}.${K2}.${K3}`
                : never;
            }[keyof T[K1][K2] & string];
      }[keyof T[K1] & string];
}[keyof T & string];

export type TranslationKey = LeafKeysAtMostThreeLevels<typeof zhHans>;
export type InterpolationValues = Readonly<Record<string, string | number>>;

function lookup(dictionary: unknown, key: string): string | undefined {
  let current: unknown = dictionary;
  for (const segment of key.split('.')) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === 'string' ? current : undefined;
}

export function interpolate(template: string, values: InterpolationValues = {}): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match,
  );
}

export function translate(locale: Locale, key: TranslationKey, values?: InterpolationValues): string {
  const template = lookup(dictionaries[locale], key) ?? lookup(zhHans, key) ?? key;
  return interpolate(template, values);
}

export function createTranslator(locale: Locale) {
  return (key: TranslationKey, values?: InterpolationValues) => translate(locale, key, values);
}

export const t = translate;

export function getDictionaryKeys(dictionary: unknown): string[] {
  const keys: string[] = [];
  const visit = (value: unknown, prefix: string) => {
    if (typeof value === 'string') {
      keys.push(prefix);
      return;
    }
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) visit(child, prefix ? `${prefix}.${key}` : key);
  };
  visit(dictionary, '');
  return keys.sort();
}

export { en, zhHans };