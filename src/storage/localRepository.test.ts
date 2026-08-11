import { describe, expect, test } from 'bun:test';
import type { CardData } from '../core/types';
import {
  LEGACY_BACKUP_KEY,
  LOCAL_REPOSITORY_KEY,
  LOCAL_SCHEMA_VERSION,
  MAX_LOCAL_CARDS,
  StorageLike,
  createLocalRepository,
} from './localRepository';

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();
  async getItem(key: string) { return this.values.get(key) ?? null; }
  async setItem(key: string, value: string) { this.values.set(key, value); }
  async removeItem(key: string) { this.values.delete(key); }
}

function card(id: string): CardData {
  return {
    id, categoryTag: 'TEST', locationName: 'Here', title: id,
    targetText: `target-${id}`, phonetic: '', subText: '', localTip: '', languageCode: 'en',
  };
}

describe('LocalRepository', () => {
  test('migrates v1 settings and retains a read-only legacy backup', async () => {
    const storage = new MemoryStorage();
    const legacy = JSON.stringify({
      schemaVersion: 1,
      settings: { countryCode: 'JP', countryZh: '日本', targetLang: '日语', targetLangCode: 'ja-JP', model: 'removed' },
      cards: [card('one')],
    });
    storage.values.set(LOCAL_REPOSITORY_KEY, legacy);
    const snapshot = await createLocalRepository(storage).getSnapshot();
    expect(snapshot.schemaVersion).toBe(LOCAL_SCHEMA_VERSION);
    expect(snapshot.settings?.destination.countryCode).toBe('JP');
    expect(snapshot.settings?.targetLanguage.code).toBe('ja-JP');
    expect(snapshot.settings).not.toHaveProperty('model');
    expect(storage.values.get(LEGACY_BACKUP_KEY)).toBe(legacy);
  });

  test('recovers corrupt data and preserves the original bytes', async () => {
    const storage = new MemoryStorage();
    storage.values.set(LOCAL_REPOSITORY_KEY, '{broken');
    const snapshot = await createLocalRepository(storage).getSnapshot();
    expect(snapshot.cards).toEqual([]);
    expect(storage.values.get(LEGACY_BACKUP_KEY)).toBe('{broken');
    expect(JSON.parse(storage.values.get(LOCAL_REPOSITORY_KEY) ?? '').schemaVersion).toBe(2);
  });

  test('bounds cards and strips photo/audio fields', async () => {
    const storage = new MemoryStorage();
    const repository = createLocalRepository(storage);
    const cards = Array.from({ length: MAX_LOCAL_CARDS + 5 }, (_, index) => ({
      ...card(String(index)), imageUri: 'photo.jpg', audioUri: 'voice.m4a',
    } as CardData));
    await repository.saveCards(cards);
    expect(await repository.getCards()).toHaveLength(MAX_LOCAL_CARDS);
    const raw = storage.values.get(LOCAL_REPOSITORY_KEY) ?? '';
    expect(raw).not.toContain('photo.jpg');
    expect(raw).not.toContain('voice.m4a');
  });

  test('clears repository, backup, and legacy settings', async () => {
    const storage = new MemoryStorage();
    storage.values.set(LOCAL_REPOSITORY_KEY, '{}');
    storage.values.set(LEGACY_BACKUP_KEY, 'backup');
    storage.values.set('scenego.settings', '{}');
    await createLocalRepository(storage).clearAllLocalData();
    expect(storage.values.size).toBe(0);
  });
});