import 'server-only';
import { importSPKI, jwtVerify, type JWTPayload } from 'jose';
import type { NextRequest } from 'next/server';

/**
 * Wadi access ticket (server-only verification).
 *
 * Wadi mints a short-lived RS256 JWT and hands it to this tool when it opens
 * the tool inside the Wadi frame. This tool only ever VERIFIES the ticket with
 * the public key — it can never mint one. The matching private key lives only
 * in the Wadi platform. See CLAUDE.md for the full ticket spec.
 */

// These must match what the live Wadi platform stamps into its tickets.
// iss="wadi"; aud = THIS tool's unique registry id. "diagnostics" is Wadi's
// test-only label and must never be accepted by a real tool.
export const WADI_TICKET_ISSUER = process.env.WADI_TICKET_ISSUER ?? 'wadi';
export const WADI_TICKET_AUDIENCE = process.env.WADI_TICKET_AUDIENCE ?? 'brandvista';

export interface WadiTicket {
  /** Wadi user id */
  userId: string;
  /** Plan / tier the user is on (e.g. "free", "pro") */
  plan: string;
  /** Which provider keys the user has configured in Wadi, if Wadi sends them. */
  keys: string[];
  /** Unix seconds */
  issuedAt: number;
  expiresAt: number;
}

let keysPromise: Promise<CryptoKey[]> | null = null;

// Env vars store the PEM with escaped newlines; restore real newlines.
function importPem(pem: string): Promise<CryptoKey> {
  return importSPKI(pem.replace(/\\n/g, '\n'), 'RS256');
}

/**
 * Trust anchors used to verify tickets. The real Wadi public key is always
 * trusted. A DEV-only key may also be trusted for local testing before the Wadi
 * app registry can mint tickets for this tool — but NEVER in production.
 */
function getPublicKeys(): Promise<CryptoKey[]> {
  if (keysPromise) return keysPromise;
  const pems: string[] = [];
  if (process.env.WADI_JWT_PUBLIC_KEY) pems.push(process.env.WADI_JWT_PUBLIC_KEY);
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.WADI_DEV_JWT_PUBLIC_KEY
  ) {
    pems.push(process.env.WADI_DEV_JWT_PUBLIC_KEY);
  }
  if (pems.length === 0) {
    return Promise.reject(
      new Error('WADI_JWT_PUBLIC_KEY environment variable is not set'),
    );
  }
  keysPromise = Promise.all(pems.map(importPem));
  return keysPromise;
}

function toTicket(payload: JWTPayload): WadiTicket | null {
  if (typeof payload.sub !== 'string' || !payload.sub) return null;
  return {
    userId: payload.sub,
    plan: typeof payload.plan === 'string' ? payload.plan : 'unknown',
    keys: Array.isArray(payload.keys)
      ? payload.keys.filter((k): k is string => typeof k === 'string')
      : [],
    issuedAt: typeof payload.iat === 'number' ? payload.iat : 0,
    expiresAt: typeof payload.exp === 'number' ? payload.exp : 0,
  };
}

/**
 * Verify a raw ticket string. Returns the parsed ticket, or null if the ticket
 * is missing, malformed, expired, or signed by the wrong key. Never throws on a
 * bad ticket — only on a misconfigured server (missing public key).
 */
export async function verifyTicket(
  token: string | null | undefined,
): Promise<WadiTicket | null> {
  if (!token) return null;
  let keys: CryptoKey[];
  try {
    keys = await getPublicKeys();
  } catch {
    return null; // misconfigured server → fail closed
  }
  for (const key of keys) {
    try {
      const { payload } = await jwtVerify(token, key, {
        algorithms: ['RS256'],
        issuer: WADI_TICKET_ISSUER,
        audience: WADI_TICKET_AUDIENCE,
      });
      return toTicket(payload);
    } catch {
      // wrong key / invalid / expired — try the next trust anchor
    }
  }
  return null;
}

/** Pull the ticket out of an API request's `Authorization: Bearer <ticket>` header. */
export function ticketFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.slice('Bearer '.length).trim();
  return null;
}

/**
 * Guard for API routes. Verifies the ticket on the incoming request and returns
 * it, or null when access should be refused (caller returns 401).
 */
export async function getRequestTicket(req: NextRequest): Promise<WadiTicket | null> {
  return verifyTicket(ticketFromRequest(req));
}
