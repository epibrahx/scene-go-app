/**
 * 生产 bundle 扫描：检测敏感环境变量值和 OpenRouter key 前缀。
 * 只输出 pass/fail/计数，不打印匹配值。
 */
import * as fs from 'fs';
import * as path from 'path';

const BUNDLE_DIR = process.argv[2] || 'dist';

// Patterns to detect (we never print the actual matched value)
const SENSITIVE_PATTERNS = [
  /sk-or-[a-zA-Z0-9]{20,}/,           // OpenRouter key prefix
  /sk-[a-zA-Z0-9]{20,}/,              // OpenAI key prefix
  /EXPO_PUBLIC_OPENROUTER_API_KEY/,    // Env var name in bundle
  /EXPO_PUBLIC_OPENAI_API_KEY/,
  /EXPO_PUBLIC_AI_API_KEY/,
];

function scanFile(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let hits = 0;
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(content)) hits++;
    }
    return hits;
  } catch {
    return 0;
  }
}

function walkDir(dir: string): string[] {
  const files: string[] = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...walkDir(fullPath));
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.json') || entry.name.endsWith('.map')) {
        files.push(fullPath);
      }
    }
  } catch {
    // directory may not exist
  }
  return files;
}

console.log(`Scanning production bundle: ${BUNDLE_DIR}`);

if (!fs.existsSync(BUNDLE_DIR)) {
  console.log('Bundle directory not found — skipping scan');
  process.exit(0);
}

const files = walkDir(BUNDLE_DIR);
let totalHits = 0;
let filesScanned = 0;

for (const file of files) {
  const hits = scanFile(file);
  totalHits += hits;
  filesScanned++;
}

console.log(`Files scanned: ${filesScanned}`);
console.log(`Sensitive matches: ${totalHits}`);
console.log(totalHits === 0 ? 'PASSED ✅' : 'FAILED ❌');
process.exit(totalHits === 0 ? 0 : 1);
