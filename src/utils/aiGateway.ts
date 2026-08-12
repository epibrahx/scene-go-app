import { getOpenRouterApiKey } from './SecureConfig';
import { apiLogger } from './ApiLogger';
import { AppError, toAppError } from '../errors/AppError';

const DEFAULT_GATEWAY_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const AI_GATEWAY_URL = process.env.EXPO_PUBLIC_AI_GATEWAY_URL || DEFAULT_GATEWAY_URL;
export const DEFAULT_MODEL = 'openrouter/free';

const FETCH_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 2;

export interface AiChatMessage {
  role: string;
  content: unknown;
}

export interface AiChatRequest {
  messages: AiChatMessage[];
  maxTokens?: number;
  model?: string;
  logLabel?: string;
  signal?: AbortSignal;
}

export interface AiChatResult {
  status: number;
  text: string;
  content: string;
}

export type AiGatewayErrorCode =
  | 'NOT_CONFIGURED'
  | 'AUTHENTICATION'
  | 'NETWORK'
  | 'HTTP'
  | 'INVALID_RESPONSE';

export class AiGatewayError extends Error {
  readonly code: AiGatewayErrorCode;
  readonly status?: number;

  constructor(code: AiGatewayErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'AiGatewayError';
    this.code = code;
    this.status = status;
  }
}

async function postWithTimeoutRetry(
  url: string,
  headers: Record<string, string>,
  body: string,
  logId: string,
  signal?: AbortSignal
): Promise<{ ok: boolean; status: number; text: string; resp?: Response }> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const abortHandler = () => controller.abort();
      if (signal) signal.addEventListener('abort', abortHandler);
      
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      let resp: Response;
      try {
        resp = await fetch(url, {
          method: 'POST',
          headers,
          body,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', abortHandler);
      }
      const text = await resp.text();
      
      const duration = Date.now() - start;
      const byteCount = new Blob([text]).size;
      apiLogger.logResponse(logId, resp.status, duration, `[redacted] bytes: ${byteCount}`);
      
      return { ok: resp.ok, status: resp.status, text, resp };
    } catch (err) {
      lastError = err;
      if (err instanceof Error && err.name === 'AbortError') {
        if (signal?.aborted) {
           throw err; // user aborted
        } else {
           // timeout aborted
           throw new AppError('timeout', 'Request timed out');
        }
      }
      
      if (attempt < MAX_ATTEMPTS) {
        // continue retry
      }
    }
  }
  const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
  apiLogger.logResponse(logId, 0, 0, `network error: ${errMsg}`);
  throw new AppError('network', errMsg);
}

export async function chatCompletions(req: AiChatRequest): Promise<AiChatResult> {
  const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  
  const url = AI_GATEWAY_URL;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://scenego.app',
    'X-OpenRouter-Title': 'SceneGo',
    'X-Request-Id': requestId
  };

  const apiKey = await getOpenRouterApiKey();
  if (!apiKey) {
    throw new AiGatewayError('NOT_CONFIGURED', '未配置 OpenRouter API Key');
  }
  headers['Authorization'] = `Bearer ${apiKey}`;

  const model = req.model || DEFAULT_MODEL;
  const body = JSON.stringify({
    model,
    messages: req.messages,
    ...(req.maxTokens ? { max_tokens: req.maxTokens } : {}),
  });

  const logLabel = req.logLabel || '[redacted]';
  const logId = apiLogger.logRequest({
    url,
    model,
    requestBody: logLabel,
  });

  try {
    const { ok, status, text, resp } = await postWithTimeoutRetry(url, headers, body, logId, req.signal);
    
    if (!ok) {
      if (status === 429) {
        const retryAfter = resp?.headers.get('Retry-After');
        const retryAfterMs = retryAfter ? parseInt(retryAfter) * 1000 : undefined;
        throw new AppError('rate-limit', 'Rate limited', { status, details: { retryAfterMs } });
      }
      if (status >= 500) {
        throw new AppError('server', `Server error HTTP ${status}`, { status });
      }
      const code: AiGatewayErrorCode = status === 401 || status === 403 ? 'AUTHENTICATION' : 'HTTP';
      // keep backward compatibility for AiGatewayError for HTTP errs that aren't specific
      throw new AiGatewayError(code, `HTTP ${status}`, status);
    }

    try {
      const data = JSON.parse(text);
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) {
        throw new AppError('invalid-response', '云端响应缺少有效内容');
      }
      return { status, text, content };
    } catch (e) {
      throw new AppError('invalid-response', '云端响应不是有效 JSON');
    }
  } catch (error) {
    if (error instanceof AppError || error instanceof AiGatewayError) {
      throw error;
    }
    // ensure everything is mapped
    throw toAppError(error, 'network');
  }
}
