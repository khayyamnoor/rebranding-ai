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
  let res: Response;
  try {
    res = await fetch(WADI_AI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ticket}` },
      body: JSON.stringify({ provider: 'gemini', ...req }),
    });
  } catch {
    throw new WadiProxyError('UPSTREAM', 502, 'Could not reach the Wadi AI proxy');
  }

  if (res.status === 401) throw new WadiProxyError('UNAUTHORIZED', 401);
  if (res.status === 402 || res.status === 403) throw new WadiProxyError('NO_KEY', 402);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
    if (body.code === 'KEY_REJECTED') throw new WadiProxyError('KEY_REJECTED', 400, body.message);
    throw new WadiProxyError('UPSTREAM', 502, body.message);
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
