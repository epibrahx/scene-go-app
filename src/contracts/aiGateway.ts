/**
 * AI 网关共享契约：客户端与 Edge Function 共用的请求/响应/错误类型和纯校验器。
 */

/** 模型别名白名单 */
export const MODEL_ALLOWLIST = ['openrouter/free', 'openai/gpt-4o-mini', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet'] as const;
export type ModelAlias = typeof MODEL_ALLOWLIST[number];

/** 请求体限制 */
export const LIMITS = {
  maxMessages: 10,
  maxTextLength: 8_000,
  maxImageBytes: 2_000_000, // ~2MB base64
  maxBodyBytes: 3_000_000,
  maxTokens: 2_048,
  timeoutMs: 30_000,
} as const;

export interface GatewayRequest {
  model: string;
  messages: GatewayMessage[];
  max_tokens?: number;
}

export interface GatewayMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | GatewayContentPart[];
}

export interface GatewayContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

export interface GatewayResponse {
  choices: { message: { content: string } }[];
}

export interface GatewayError {
  error: {
    code: string;
    message: string;
    request_id: string;
    retryable: boolean;
  };
}

/** 请求 ID 生成 */
export function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/** 模型别名校验 */
export function isAllowedModel(model: string): model is ModelAlias {
  return (MODEL_ALLOWLIST as readonly string[]).includes(model);
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** 请求体校验 */
export function validateRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Request body must be an object' };
  const req = body as Record<string, unknown>;
  
  if (typeof req.model !== 'string' || !isAllowedModel(req.model)) {
    return { valid: false, error: `Model not in allowlist: ${String(req.model)}` };
  }
  if (!Array.isArray(req.messages)) return { valid: false, error: 'messages must be an array' };
  if (req.messages.length === 0 || req.messages.length > LIMITS.maxMessages) {
    return { valid: false, error: `messages count must be 1-${LIMITS.maxMessages}` };
  }
  if (req.max_tokens !== undefined) {
    if (typeof req.max_tokens !== 'number' || req.max_tokens < 1 || req.max_tokens > LIMITS.maxTokens) {
      return { valid: false, error: `max_tokens must be 1-${LIMITS.maxTokens}` };
    }
  }
  
  // Validate each message
  for (const msg of req.messages) {
    if (!msg || typeof msg !== 'object') return { valid: false, error: 'Invalid message' };
    const m = msg as Record<string, unknown>;
    if (!['system', 'user', 'assistant'].includes(m.role as string)) {
      return { valid: false, error: `Invalid role: ${String(m.role)}` };
    }
    // Text content length check
    if (typeof m.content === 'string' && m.content.length > LIMITS.maxTextLength) {
      return { valid: false, error: 'Text content exceeds limit' };
    }
    // Multimodal content check (array of parts)
    if (Array.isArray(m.content)) {
      for (const part of m.content) {
        if (!part || typeof part !== 'object') return { valid: false, error: 'Invalid content part' };
        const p = part as Record<string, unknown>;
        if (p.type === 'text' && typeof p.text === 'string' && p.text.length > LIMITS.maxTextLength) {
          return { valid: false, error: 'Text part exceeds limit' };
        }
        if (p.type === 'image_url') {
          const imgUrl = p.image_url as Record<string, unknown> | undefined;
          if (!imgUrl?.url || typeof imgUrl.url !== 'string') {
            return { valid: false, error: 'Invalid image_url' };
          }
          // Base64 size estimate
          if (imgUrl.url.startsWith('data:') && imgUrl.url.length > LIMITS.maxImageBytes * 1.37) {
            return { valid: false, error: 'Image too large' };
          }
        }
      }
    }
  }
  
  return { valid: true };
}

/** JSON body 字节数校验 */
export function validateBodySize(bodyString: string): ValidationResult {
  if (new Blob([bodyString]).size > LIMITS.maxBodyBytes) {
    return { valid: false, error: 'Request body exceeds size limit' };
  }
  return { valid: true };
}
