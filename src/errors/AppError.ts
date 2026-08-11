export const APP_ERROR_CODES = [
  'consent',
  'permission',
  'network',
  'timeout',
  'rate-limit',
  'server',
  'invalid-response',
  'config',
  'storage',
  'speech',
  'tts',
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export interface AppErrorOptions {
  cause?: unknown;
  status?: number;
  details?: Readonly<Record<string, unknown>>;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status?: number;
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(code: AppErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = options.status;
    this.details = options.details;
    if (options.cause !== undefined) Object.defineProperty(this, 'cause', { value: options.cause });
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toAppError(error: unknown, fallbackCode: AppErrorCode = 'server'): AppError {
  if (isAppError(error)) return error;
  const message = error instanceof Error ? error.message : String(error || 'Unknown error');
  return new AppError(fallbackCode, message, { cause: error });
}