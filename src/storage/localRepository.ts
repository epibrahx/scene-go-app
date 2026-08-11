import type { CardData } from '../core/types';
import { AppError } from '../errors/AppError';
import type { AppSettings } from '../utils/appSettings';

export interface StorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const LOCAL_REPOSITORY_KEY = '@scenego/local-repository';
export const LEGACY_BACKUP_KEY = '@scenego/local-repository:legacy-backup';
export const LOCAL_SCHEMA_VERSION = 2;
export const MAX_LOCAL_CARDS = 50;
export const MAX_SETTINGS_BYTES = 8_192;

const LEGACY_SETTINGS_KEYS = ['scenego.settings', '@scenego/app-settings'] as const;
const KNOWN_LOCAL_DATA_KEYS = [
  ...LEGACY_SETTINGS_KEYS,
  'scenego_sessions_v1',
  'scenego_notes_v1',
  '@scenego/user-profile',
] as const;

export interface LocalSnapshot {
  schemaVersion: typeof LOCAL_SCHEMA_VERSION;
  settings: AppSettings | null;
  cards: CardData[];
  updatedAt: number;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, fallback: string, maxLength = 500): string {
  return typeof value === 'string' && value.trim() ? value.slice(0, maxLength) : fallback;
}

function normalizeSettings(value: unknown): AppSettings {
  const source = isRecord(value) ? value : {};
  const destination = isRecord(source.destination) ? source.destination : {};
  const targetLanguage = isRecord(source.targetLanguage) ? source.targetLanguage : {};
  const locale = source.uiLocale === 'en' ? 'en' : 'zh-Hans';
  return {
    uiLocale: locale,
    destination: {
      countryCode: text(destination.countryCode ?? source.countryCode, 'TH', 2).toUpperCase(),
      name: text(destination.name ?? source.countryZh, '泰国', 80),
    },
    targetLanguage: {
      code: text(targetLanguage.code ?? source.targetLangCode, 'th-TH', 20),
      name: text(targetLanguage.name ?? source.targetLang, '泰语', 80),
    },
    aiConsent: source.aiConsent === true,
  };
}

function optionalText(value: unknown, maxLength = 2_000): string | undefined {
  return typeof value === 'string' ? value.slice(0, maxLength) : undefined;
}

function stringList(value: unknown, limit = 10): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value.filter((item): item is string => typeof item === 'string').slice(0, limit);
  return list.length ? list : undefined;
}

function normalizeSteps(value: unknown): CardData['steps'] {
  if (!Array.isArray(value)) return undefined;
  const steps = value.filter(isRecord).slice(0, 10).map((step) => ({
    tag: text(step.tag, '', 80),
    tagColor: text(step.tagColor, '', 30),
    targetText: text(step.targetText, '', 2_000),
    ...(optionalText(step.phonetic, 500) !== undefined ? { phonetic: optionalText(step.phonetic, 500) } : {}),
    ...(optionalText(step.supplement, 1_000) !== undefined ? { supplement: optionalText(step.supplement, 1_000) } : {}),
    ...(Array.isArray(step.chips) ? {
      chips: step.chips.filter(isRecord).slice(0, 10).map((chip) => ({ label: text(chip.label, '', 100) })),
    } : {}),
  }));
  return steps.length ? steps : undefined;
}

function normalizeDials(value: unknown): CardData['dials'] {
  if (!Array.isArray(value)) return undefined;
  const dials = value.filter(isRecord).slice(0, 10).map((dial) => ({
    num: text(dial.num, '', 30),
    label: text(dial.label, '', 100),
  }));
  return dials.length ? dials : undefined;
}

function normalizeCard(value: unknown): CardData | null {
  if (!isRecord(value)) return null;
  const id = optionalText(value.id, 120);
  const targetText = optionalText(value.targetText);
  if (!id || !targetText) return null;
  const card: CardData = {
    id,
    categoryTag: text(value.categoryTag, 'OTHER', 80),
    locationName: text(value.locationName, '', 120),
    title: text(value.title, '', 200),
    targetText,
    phonetic: text(value.phonetic, '', 500),
    subText: text(value.subText, '', 1_000),
    localTip: text(value.localTip, '', 1_000),
    languageCode: text(value.languageCode, 'und', 20),
  };
  const badgeColor = optionalText(value.badgeColor, 30);
  const phrases = stringList(value.phrases);
  const tips = stringList(value.tips);
  const dials = normalizeDials(value.dials);
  const steps = normalizeSteps(value.steps);
  if (badgeColor) card.badgeColor = badgeColor;
  if (phrases) card.phrases = phrases;
  if (tips) card.tips = tips;
  if (dials) card.dials = dials;
  if (steps) card.steps = steps;
  if (typeof value.sessionId === 'string') card.sessionId = value.sessionId.slice(0, 120);
  if (typeof value.stepsLead === 'string') card.stepsLead = value.stepsLead.slice(0, 500);
  if (typeof value.allPillText === 'string') card.allPillText = value.allPillText.slice(0, 100);
  if (isRecord(value.reply) && Array.isArray(value.reply.options)) {
    const options = value.reply.options.filter(isRecord).slice(0, 5).flatMap((option) => {
      const replyCard = normalizeCard(option.replyCard);
      if (!replyCard) return [];
      const { reply: _reply, ...flatReplyCard } = replyCard;
      return [{ label: text(option.label, '', 200), replyCard: flatReplyCard }];
    });
    if (options.length) card.reply = { label: text(value.reply.label, '', 200), options };
  }
  return card;
}

function emptySnapshot(): LocalSnapshot {
  return { schemaVersion: LOCAL_SCHEMA_VERSION, settings: null, cards: [], updatedAt: Date.now() };
}

function migrate(parsed: unknown): LocalSnapshot {
  if (!isRecord(parsed)) throw new Error('Repository payload must be an object');
  const version = parsed.schemaVersion ?? parsed.version;
  if (version !== 1 && version !== LOCAL_SCHEMA_VERSION) throw new Error(`Unsupported schema version: ${String(version)}`);
  const payload = isRecord(parsed.data) ? parsed.data : parsed;
  const cards = Array.isArray(payload.cards)
    ? payload.cards.map(normalizeCard).filter((card): card is CardData => card !== null).slice(0, MAX_LOCAL_CARDS)
    : [];
  return {
    schemaVersion: LOCAL_SCHEMA_VERSION,
    settings: payload.settings == null ? null : normalizeSettings(payload.settings),
    cards,
    updatedAt: typeof payload.updatedAt === 'number' ? payload.updatedAt : Date.now(),
  };
}

export class LocalRepository {
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly storage: StorageLike) {}

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.writeQueue.then(operation);
    this.writeQueue = result.then(() => undefined, () => undefined);
    return result;
  }

  private async backupOnce(raw: string): Promise<void> {
    if ((await this.storage.getItem(LEGACY_BACKUP_KEY)) === null) {
      await this.storage.setItem(LEGACY_BACKUP_KEY, raw);
    }
  }

  private async read(): Promise<LocalSnapshot> {
    const raw = await this.storage.getItem(LOCAL_REPOSITORY_KEY);
    if (raw === null) return this.migrateLegacySettings();
    try {
      const parsed = JSON.parse(raw) as UnknownRecord;
      const snapshot = migrate(parsed);
      if (parsed.schemaVersion !== LOCAL_SCHEMA_VERSION) {
        await this.backupOnce(raw);
        await this.storage.setItem(LOCAL_REPOSITORY_KEY, JSON.stringify(snapshot));
      }
      return snapshot;
    } catch (cause) {
      await this.backupOnce(raw);
      const recovered = emptySnapshot();
      await this.storage.setItem(LOCAL_REPOSITORY_KEY, JSON.stringify(recovered));
      return recovered;
    }
  }

  private async migrateLegacySettings(): Promise<LocalSnapshot> {
    for (const key of LEGACY_SETTINGS_KEYS) {
      const raw = await this.storage.getItem(key);
      if (raw === null) continue;
      await this.backupOnce(raw);
      try {
        const snapshot = { ...emptySnapshot(), settings: normalizeSettings(JSON.parse(raw)) };
        await this.storage.setItem(LOCAL_REPOSITORY_KEY, JSON.stringify(snapshot));
        return snapshot;
      } catch {
        break;
      }
    }
    return emptySnapshot();
  }

  async getSnapshot(): Promise<LocalSnapshot> {
    try {
      return await this.read();
    } catch (cause) {
      throw new AppError('storage', 'Unable to read local data', { cause });
    }
  }

  async getSettings(): Promise<AppSettings | null> {
    return (await this.getSnapshot()).settings;
  }

  saveSettings(settings: AppSettings): Promise<void> {
    const normalized = normalizeSettings(settings);
    if (JSON.stringify(normalized).length > MAX_SETTINGS_BYTES) {
      return Promise.reject(new AppError('storage', 'Settings exceed local capacity'));
    }
    return this.enqueue(async () => {
      const snapshot = await this.read();
      await this.storage.setItem(LOCAL_REPOSITORY_KEY, JSON.stringify({ ...snapshot, settings: normalized, updatedAt: Date.now() }));
    });
  }

  async getCards(): Promise<CardData[]> {
    return (await this.getSnapshot()).cards;
  }

  saveCards(cards: readonly CardData[]): Promise<void> {
    const bounded = cards.map(normalizeCard).filter((card): card is CardData => card !== null).slice(0, MAX_LOCAL_CARDS);
    return this.enqueue(async () => {
      const snapshot = await this.read();
      await this.storage.setItem(LOCAL_REPOSITORY_KEY, JSON.stringify({ ...snapshot, cards: bounded, updatedAt: Date.now() }));
    });
  }

  saveCard(card: CardData): Promise<void> {
    return this.enqueue(async () => {
      const snapshot = await this.read();
      const normalized = normalizeCard(card);
      if (!normalized) throw new AppError('storage', 'Card is invalid');
      const cards = [normalized, ...snapshot.cards.filter((item) => item.id !== normalized.id)].slice(0, MAX_LOCAL_CARDS);
      await this.storage.setItem(LOCAL_REPOSITORY_KEY, JSON.stringify({ ...snapshot, cards, updatedAt: Date.now() }));
    });
  }

  async getLegacyBackup(): Promise<string | null> {
    return this.storage.getItem(LEGACY_BACKUP_KEY);
  }

  clearAllLocalData(): Promise<void> {
    return this.enqueue(async () => {
      await Promise.all([
        this.storage.removeItem(LOCAL_REPOSITORY_KEY),
        this.storage.removeItem(LEGACY_BACKUP_KEY),
        ...KNOWN_LOCAL_DATA_KEYS.map((key) => this.storage.removeItem(key)),
      ]);
    });
  }
}

export function createLocalRepository(storage: StorageLike): LocalRepository {
  return new LocalRepository(storage);
}

let defaultRepository: LocalRepository | null = null;

export function configureLocalRepository(storage: StorageLike): LocalRepository {
  defaultRepository = createLocalRepository(storage);
  return defaultRepository;
}

export function clearAllLocalData(repository: LocalRepository | null = defaultRepository): Promise<void> {
  if (!repository) return Promise.reject(new AppError('storage', 'Local repository is not configured'));
  return repository.clearAllLocalData();
}