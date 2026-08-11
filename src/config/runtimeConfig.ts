export type RuntimeEnvironment = 'development' | 'preview' | 'production';

export interface RuntimeConfig {
  environment: RuntimeEnvironment;
  aiProxyUrl: string;
  isProduction: boolean;
}

export type RuntimeEnv = Readonly<Record<string, string | undefined>>;

function parseEnvironment(value: string | undefined): RuntimeEnvironment {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized === 'development') return 'development';
  if (normalized === 'preview' || normalized === 'production') return normalized;
  throw new Error(`Unsupported runtime environment: ${value}`);
}

export function createRuntimeConfig(env: RuntimeEnv = process.env): RuntimeConfig {
  // 环境只由显式 EXPO_PUBLIC_APP_ENV / APP_ENV 决定。
  // 不能回退 NODE_ENV：Release bundle 里 Babel 会把 process.env.NODE_ENV 内联为
  // 'production'，导致任何本地 Release 构建（模拟器/真机自测）被误判为生产环境。
  // 自用阶段不做生产门禁检查（代理 URL/客户端 Key 等断言）；上架时需恢复
  // scripts/assert-production-config.ts 的构建期断言。
  const environment = parseEnvironment(env.EXPO_PUBLIC_APP_ENV ?? env.APP_ENV);
  const aiProxyUrl = (env.EXPO_PUBLIC_AI_PROXY_URL ?? env.EXPO_PUBLIC_AI_GATEWAY_URL ?? '').trim();
  return { environment, aiProxyUrl, isProduction: environment === 'production' };
}

export const loadRuntimeConfig = createRuntimeConfig;
