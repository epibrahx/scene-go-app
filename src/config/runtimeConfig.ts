export type RuntimeEnvironment = 'development' | 'preview' | 'production';

export interface RuntimeConfig {
  environment: RuntimeEnvironment;
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
  // 运行环境只用于区分构建配置，不改变 AI 服务地址；所有环境均直连 OpenRouter。
  const environment = parseEnvironment(env.EXPO_PUBLIC_APP_ENV ?? env.APP_ENV);
  return { environment, isProduction: environment === 'production' };
}

export const loadRuntimeConfig = createRuntimeConfig;
