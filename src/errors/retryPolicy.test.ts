import { describe, expect, test } from 'bun:test';
import { AppError } from './AppError';
import { getRetryDelayMs, isRetryable, shouldRetry, withRetry } from './retryPolicy';

const policy = { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 1_000, jitterRatio: 0 };

describe('retryPolicy', () => {
  test('only retries transient application errors within the attempt limit', () => {
    expect(isRetryable(new AppError('network', 'offline'))).toBe(true);
    expect(isRetryable(new AppError('permission', 'denied'))).toBe(false);
    expect(shouldRetry(new AppError('timeout', 'late'), 2, policy)).toBe(true);
    expect(shouldRetry(new AppError('timeout', 'late'), 3, policy)).toBe(false);
  });

  test('uses exponential delay and Retry-After for rate limits', () => {
    expect(getRetryDelayMs(new AppError('network', 'offline'), 2, policy)).toBe(200);
    const limited = new AppError('rate-limit', 'slow down', { details: { retryAfterMs: 750 } });
    expect(getRetryDelayMs(limited, 1, policy)).toBe(750);
  });

  test('retries with injected sleep', async () => {
    const delays: number[] = [];
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      if (calls < 3) throw new AppError('network', 'offline');
      return 'ok';
    }, policy, { sleep: async (delay) => { delays.push(delay); }, random: () => 0.5 });
    expect(result).toBe('ok');
    expect(delays).toEqual([100, 200]);
  });
});