import 'server-only';

/**
 * BYOK via Wadi (Job 4). This app NEVER holds a raw provider key. When it needs
 * AI, the server builds the request (keeping the tuned prompts private) and
 * POSTs it to Wadi's AI proxy with the user's ticket; Wadi attaches that user's
 * own Gemini key, calls Google, and returns the response. See CLAUDE.md for the
 * full proxy contract.
 */

const WADI_ORIGIN = process.env.NEXT_PUBLIC_WADI_ORIGIN;

/** Where the Wadi AI proxy lives. Defaults to <Wadi origin>/api/ai/proxy. */
export const WADI_AI_PROXY_URL =
  process.env.WADI_AI_PROXY_URL ||
  (WADI_ORIGIN ? `${WADI_ORIGIN}/api/ai/proxy` : '');

export type ProxyErrorCode =
  | 'PROXY_UNCONFIGURED'
  | 'UNAUTHORIZED'
  | 'NO_KEY'
  | 'KEY_REJECTED'
  | 'UPSTREAM';

export class WadiProxyError extends Error {
  code: ProxyErrorCode;
  status: number;
  constructor(code: ProxyErrorCode, status: number, message?: string) {
    super(message ?? code);
    this.code = code;
    this.status = status;
  }
}

interface GeminiRequest {
  model: string;
  contents: unknown;
  /** SDK-style config; mapped to REST `generationConfig` (e.g. responseModalities, imageConfig). */
  config?: unknown;
}

/** Subset of the Google GenAI generateContent response we read. */
export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string; inlineData?: { mimeType?: string; data?: string } }>;
    };
  }>;
}

/**
 * Call Gemini through the Wadi proxy on the current user's key.
 * Throws WadiProxyError on auth / no-key / rejected-key / upstream problems.
 */
export async function callGemini(ticket: string, req: GeminiRequest): Promise<GeminiResponse> {
  if (!WADI_AI_PROXY_URL) {
    throw new WadiProxyError('PROXY_UNCONFIGURED', 500, 'Wadi AI proxy URL is not configured');
  }

  // Wadi's path-based contract: { provider, path, body } where body is the raw
  // Gemini REST request. SDK-style `config` maps to REST `generationConfig`.
  const geminiBody: Record<string, unknown> = { contents: req.contents };
  if (req.config) geminiBody.generationConfig = req.config;

  let res: Response;
  try {
    res = await fetch(WADI_AI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ticket}` },
      body: JSON.stringify({
        provider: 'gemini',
        path: `/v1beta/models/${req.model}:generateContent`,
        body: geminiBody,
      }),
    });
  } catch {
    throw new WadiProxyError('UPSTREAM', 502, 'Could not reach the Wadi AI proxy');
  }

  if (res.status === 401) throw new WadiProxyError('UNAUTHORIZED', 401);
  if (!res.ok) {
    // Wadi wraps errors as { error, message }. Classify so the UI can react.
    const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string; message?: string };
    const tag = `${body.error ?? body.code ?? ''} ${body.message ?? ''}`.toLowerCase();
    if (res.status === 402 || res.status === 403 ||
        /no[_\s-]?key|missing.*key|key.*not.*(found|configured|set)|add.*key/.test(tag)) {
      throw new WadiProxyError('NO_KEY', 402);
    }
    if (/key[_\s-]?(rejected|invalid)|invalid.*key|api key not valid|api_key_invalid/.test(tag)) {
      throw new WadiProxyError('KEY_REJECTED', 400, body.message);
    }
    throw new WadiProxyError('UPSTREAM', 502, body.message || body.error);
  }
  return (await res.json()) as GeminiResponse;
}

/** Concatenate the text parts of the first candidate (mirrors SDK `.text`). */
export function responseText(resp: GeminiResponse): string {
  const parts = resp.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? '').join('').trim();
}

/** First inline image (base64) in the response, or null. */
export function responseImage(resp: GeminiResponse): string | null {
  for (const part of resp.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) return part.inlineData.data;
  }
  return null;
}

const MESSAGES: Record<ProxyErrorCode, string> = {
  NO_KEY: 'No Gemini key found in your Wadi account.',
  KEY_REJECTED: "That Gemini key didn't work — check it in Wadi and try again.",
  UNAUTHORIZED: 'Open this tool from Wadi.',
  PROXY_UNCONFIGURED: 'AI is not configured yet.',
  UPSTREAM: 'The AI service had a problem. Please try again.',
};

/** Map a WadiProxyError to a plain JSON body + status for an API route. */
export function proxyErrorBody(err: WadiProxyError): {
  status: number;
  body: { error: string; code: ProxyErrorCode };
} {
  return {
    status: err.status,
    body: { error: err.message && err.code === 'UPSTREAM' ? err.message : MESSAGES[err.code], code: err.code },
  };
}
