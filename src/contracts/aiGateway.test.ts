import { describe, expect, test } from 'bun:test';
import { validateRequest, validateBodySize, isAllowedModel, generateRequestId, LIMITS } from './aiGateway';

describe('aiGateway contract', () => {
  test('allows valid models', () => {
    expect(isAllowedModel('openrouter/free')).toBe(true);
    expect(isAllowedModel('openai/gpt-4o-mini')).toBe(true);
    expect(isAllowedModel('unknown-model')).toBe(false);
  });

  test('generates unique request IDs', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(5);
  });

  test('validates well-formed request', () => {
    const result = validateRequest({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: 'hello' }],
      max_tokens: 100,
    });
    expect(result.valid).toBe(true);
  });

  test('rejects missing body', () => {
    expect(validateRequest(null).valid).toBe(false);
    expect(validateRequest(undefined).valid).toBe(false);
  });

  test('rejects invalid model', () => {
    expect(validateRequest({ model: 'evil-model', messages: [{ role: 'user', content: 'x' }] }).valid).toBe(false);
  });

  test('rejects empty messages', () => {
    expect(validateRequest({ model: 'openrouter/free', messages: [] }).valid).toBe(false);
  });

  test('rejects too many messages', () => {
    const messages = Array.from({ length: LIMITS.maxMessages + 1 }, () => ({ role: 'user', content: 'x' }));
    expect(validateRequest({ model: 'openrouter/free', messages }).valid).toBe(false);
  });

  test('rejects invalid max_tokens', () => {
    expect(validateRequest({ model: 'openrouter/free', messages: [{ role: 'user', content: 'x' }], max_tokens: 99999 }).valid).toBe(false);
    expect(validateRequest({ model: 'openrouter/free', messages: [{ role: 'user', content: 'x' }], max_tokens: 0 }).valid).toBe(false);
  });

  test('rejects oversized text', () => {
    const longText = 'x'.repeat(LIMITS.maxTextLength + 1);
    expect(validateRequest({ model: 'openrouter/free', messages: [{ role: 'user', content: longText }] }).valid).toBe(false);
  });

  test('validates body size', () => {
    expect(validateBodySize('small body').valid).toBe(true);
    expect(validateBodySize('x'.repeat(LIMITS.maxBodyBytes + 1)).valid).toBe(false);
  });

  test('rejects invalid role', () => {
    expect(validateRequest({ model: 'openrouter/free', messages: [{ role: 'hacker', content: 'x' }] }).valid).toBe(false);
  });
});
