import { AppError } from '../errors/AppError';

export type RuntimeEnvironment = 'development' | 'preview' | 'production';

export interface RuntimeConfig {
  environment: RuntimeEnvironment;
  aiProxyUrl: string;
  isProduction: boolean;
}

export type RuntimeEnv = Readonly<Record<string, string | undefined>>;

const CLIENT_KEY_NAMES = [
  'EXPO_PUBLIC_OPENROUTER_API_KEY',
  'EXPO_PUBLIC_OPENAI_API_KEY',
  'EXPO_PUBLIC_AI_API_KEY',
] as const;

function parseEnvironment(value: string | undefined): RuntimeEnvironment {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized === 'development') return 'development';
  if (normalized === 'preview' || normalized === 'production') return normalized;
  throw new AppError('config', `Unsupported runtime environment: ${value}`);
}

function parseUrl(value: string): URL {
  try {
    return new URL(value);
  } catch (cause) {
    throw new AppError('config', 'AI proxy URL is invalid', { cause });
  }
}

function isLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.localhost');
}

export function createRuntimeConfig(env: RuntimeEnv = process.env): RuntimeConfig {
  const environment = parseEnvironment(env.EXPO_PUBLIC_APP_ENV ?? env.APP_ENV ?? env.NODE_ENV);
  const aiProxyUrl = (env.EXPO_PUBLIC_AI_PROXY_URL ?? env.EXPO_PUBLIC_AI_GATEWAY_URL ?? '').trim();

  if (environment === 'production') {
    if (!aiProxyUrl) throw new AppError('config', 'Production requires an AI proxy URL');
    const url = parseUrl(aiProxyUrl);
    if (url.protocol !== 'https:') throw new AppError('config', 'Production AI proxy must use HTTPS');
    if (isLocalHost(url.hostname)) throw new AppError('config', 'Production AI proxy cannot use localhost');
    if (url.username || url.password) throw new AppError('config', 'Production AI proxy cannot contain client credentials');
    if (url.hostname.toLowerCase() === 'openrouter.ai' || url.hostname.toLowerCase().endsWith('.openrouter.ai')) {
      throw new AppError('config', 'Production must use the SceneGo-owned proxy, not OpenRouter');
    }
    if (CLIENT_KEY_NAMES.some((name) => Boolean(env[name]?.trim()))) {
      throw new AppError('config', 'Production cannot expose an AI provider key to the client');
    }
  }

  return { environment, aiProxyUrl, isProduction: environment === 'production' };
}

export const loadRuntimeConfig = createRuntimeConfig;