// supabase/functions/ai-gateway/index.ts
// Deno Edge Function: AI 代理网关
// 上游 Key 从服务端 secret 读取；禁止记录图片、提示词、译文、Authorization

const UPSTREAM_URL = 'https://openrouter.ai/api/v1/chat/completions';
const UPSTREAM_KEY = Deno.env.get('OPENROUTER_API_KEY') ?? '';

const CORS_ALLOWLIST = [
  'https://scenego.app',
  'https://*.scenego.app',
];

const MODEL_ALLOWLIST = new Set(['openrouter/free', 'openai/gpt-4o-mini', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet']);
const MAX_MESSAGES = 10;
const MAX_TEXT_LENGTH = 8_000;
const MAX_BODY_BYTES = 3_000_000;
const MAX_TOKENS_LIMIT = 2_048;
const TIMEOUT_MS = 30_000;

function corsHeaders(origin: string): Record<string, string> {
  const allowed = CORS_ALLOWLIST.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(origin);
    }
    return pattern === origin;
  });
  if (!allowed) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Request-Id, X-Install-Id',
    'Access-Control-Max-Age': '86400',
  };
}

function errorResponse(status: number, code: string, message: string, requestId: string, retryable: boolean, origin: string): Response {
  return new Response(JSON.stringify({
    error: { code, message, request_id: requestId, retryable }
  }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin') ?? '';
  const cors = corsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  
  if (req.method !== 'POST') {
    return errorResponse(405, 'method_not_allowed', 'Only POST is accepted', '', false, origin);
  }

  const requestId = req.headers.get('X-Request-Id') ?? crypto.randomUUID();
  const installId = req.headers.get('X-Install-Id') ?? 'unknown';
  const installHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(installId))
    .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16));
  
  const startMs = Date.now();
  
  try {
    if (!UPSTREAM_KEY) {
      return errorResponse(503, 'not_configured', 'Gateway not configured', requestId, false, origin);
    }
    
    const bodyText = await req.text();
    if (new TextEncoder().encode(bodyText).length > MAX_BODY_BYTES) {
      return errorResponse(413, 'body_too_large', 'Request body too large', requestId, false, origin);
    }
    
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return errorResponse(400, 'invalid_json', 'Invalid JSON', requestId, false, origin);
    }
    
    // Validate model
    if (typeof body.model !== 'string' || !MODEL_ALLOWLIST.has(body.model)) {
      return errorResponse(400, 'invalid_model', 'Model not allowed', requestId, false, origin);
    }
    
    // Validate messages
    if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
      return errorResponse(400, 'invalid_messages', `Messages count must be 1-${MAX_MESSAGES}`, requestId, false, origin);
    }
    
    // Validate max_tokens
    if (body.max_tokens !== undefined) {
      if (typeof body.max_tokens !== 'number' || body.max_tokens < 1 || body.max_tokens > MAX_TOKENS_LIMIT) {
        return errorResponse(400, 'invalid_max_tokens', `max_tokens must be 1-${MAX_TOKENS_LIMIT}`, requestId, false, origin);
      }
    }
    
    // Forward to upstream (strip client auth, add server key)
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    let upstreamResp: Response;
    try {
      upstreamResp = await fetch(UPSTREAM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${UPSTREAM_KEY}`,
          'HTTP-Referer': 'https://scenego.app',
          'X-OpenRouter-Title': 'SceneGo',
        },
        body: bodyText,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    
    const respText = await upstreamResp.text();
    const durationMs = Date.now() - startMs;
    const respBytes = new TextEncoder().encode(respText).length;
    
    // Metadata-only log (no content)
    console.log(JSON.stringify({
      request_id: requestId,
      install_hash: installHash,
      model: body.model,
      status: upstreamResp.status,
      duration_ms: durationMs,
      req_bytes: new TextEncoder().encode(bodyText).length,
      resp_bytes: respBytes,
    }));
    
    return new Response(respText, {
      status: upstreamResp.status,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
        ...cors,
      },
    });
  } catch (err) {
    const durationMs = Date.now() - startMs;
    const message = err instanceof Error ? err.name : 'Unknown';
    console.log(JSON.stringify({ request_id: requestId, install_hash: installHash, error: message, duration_ms: durationMs }));
    
    if (err instanceof Error && err.name === 'AbortError') {
      return errorResponse(504, 'upstream_timeout', 'Upstream timeout', requestId, true, origin);
    }
    return errorResponse(502, 'upstream_error', 'Upstream unavailable', requestId, true, origin);
  }
});
