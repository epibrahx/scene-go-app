/**
 * 生产环境配置断言：发现客户端 Key、OpenRouter 域名、localhost、非 HTTPS 网关即失败。
 * 只输出 pass/fail，不打印秘密值。
 */
const env = process.env;
let failed = false;

function assert(name: string, condition: boolean) {
  if (condition) {
    console.log(`  ✓ ${name}`);
  } else {
    failed = true;
    console.error(`  ✗ ${name}`);
  }
}

console.log('Production config assertions:');

// Client key must not exist
const clientKeyNames = ['EXPO_PUBLIC_OPENROUTER_API_KEY', 'EXPO_PUBLIC_OPENAI_API_KEY', 'EXPO_PUBLIC_AI_API_KEY'];
for (const key of clientKeyNames) {
  assert(`${key} is not set`, !env[key]?.trim());
}

// AI proxy URL must be set, HTTPS, not OpenRouter, not localhost
const proxyUrl = env.EXPO_PUBLIC_AI_PROXY_URL ?? env.EXPO_PUBLIC_AI_GATEWAY_URL ?? '';
assert('AI proxy URL is set', !!proxyUrl.trim());
try {
  const url = new URL(proxyUrl);
  assert('AI proxy uses HTTPS', url.protocol === 'https:');
  assert('AI proxy is not localhost', !['localhost', '127.0.0.1', '::1'].includes(url.hostname.toLowerCase()));
  assert('AI proxy is not openrouter.ai', !url.hostname.toLowerCase().includes('openrouter.ai'));
} catch {
  if (proxyUrl.trim()) {
    failed = true;
    console.error('  ✗ AI proxy URL is not a valid URL');
  }
}

console.log(failed ? '\nFAILED ❌' : '\nPASSED ✅');
process.exit(failed ? 1 : 0);
