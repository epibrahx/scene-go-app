import { AppError, AppErrorCode, toAppError } from './AppError';

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio: number;
}

export const DEFAULT_RETRY_POLICY: Readonly<RetryPolicy> = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 8_000,
  jitterRatio: 0.2,
};

const RETRYABLE_CODES: ReadonlySet<AppErrorCode> = new Set([
  'network',
  'timeout',
  'rate-limit',
  'server',
]);

export function isRetryable(error: unknown): boolean {
  return error instanceof AppError && RETRYABLE_CODES.has(error.code);
}

export function shouldRetry(error: unknown, attempt: number, policy: RetryPolicy = DEFAULT_RETRY_POLICY): boolean {
  return attempt >= 1 && attempt < policy.maxAttempts && isRetryable(error);
}

export function getRetryDelayMs(
  error: unknown,
  attempt: number,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
  random: () => number = Math.random,
): number {
  const exponential = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** Math.max(0, attempt - 1));
  const retryAfter = error instanceof AppError && error.code === 'rate-limit'
    ? Number(error.details?.retryAfterMs)
    : NaN;
  const base = Number.isFinite(retryAfter) && retryAfter >= 0 ? Math.min(policy.maxDelayMs, retryAfter) : exponential;
  const jitter = base * policy.jitterRatio * (random() * 2 - 1);
  return Math.max(0, Math.round(base + jitter));
}

export interface RetryDependencies {
  sleep?: (milliseconds: number) => Promise<void>;
  random?: () => number;
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
  dependencies: RetryDependencies = {},
): Promise<T> {
  const sleep = dependencies.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  let lastError: AppError | undefined;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = toAppError(error);
      if (!shouldRetry(lastError, attempt, policy)) throw lastError;
      await sleep(getRetryDelayMs(lastError, attempt, policy, dependencies.random));
    }
  }
  throw lastError ?? new AppError('server', 'Retry operation failed');
}