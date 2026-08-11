/** 电话号码规范化与安全校验 */

/** Dial-safe characters: plus sign and digits only */
const DIAL_SAFE_RE = /^\+?\d{1,15}$/;

/** Characters that indicate pauses, extensions, USSD codes — not dial safe */
const UNSAFE_CHARS_RE = /[,;*#pw]/i;

/**
 * 规范化电话号码：只保留 + 和数字。
 * 拒绝暂停符(,;)、分机(p/w)、USSD(*#)、空值。
 * @returns 规范化后的号码，或 null 表示不合法
 */
export function normalizePhoneNumber(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Check for unsafe characters before stripping
  if (UNSAFE_CHARS_RE.test(trimmed)) return null;
  // Strip spaces and dashes for normalization
  const normalized = trimmed.replace(/[\s-]/g, '');
  if (!normalized) return null;
  if (!DIAL_SAFE_RE.test(normalized)) return null;
  return normalized;
}

/**
 * 验证号码是否可安全用于 tel: URI。
 */
export function isDialSafe(number: string | undefined | null): boolean {
  return normalizePhoneNumber(number) !== null;
}

/**
 * 格式化显示号码（带空格的可读格式）。
 * 输入必须是已规范化的号码。
 */
export function formatDisplayNumber(normalized: string): string {
  // Simple formatting: +XX XXXX XXXX or short emergency numbers as-is
  if (normalized.length <= 4) return normalized;
  if (normalized.startsWith('+')) {
    const digits = normalized.slice(1);
    if (digits.length <= 4) return normalized;
    // Group as: +CC XXXX XXXX
    const cc = digits.slice(0, digits.length > 10 ? 2 : Math.min(3, digits.length - 4));
    const rest = digits.slice(cc.length);
    const groups = rest.match(/.{1,4}/g) || [rest];
    return `+${cc} ${groups.join(' ')}`;
  }
  return normalized;
}
