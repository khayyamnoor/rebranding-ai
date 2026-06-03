import { importSPKI, jwtVerify, type JWTPayload } from 'jose';

/**
 * Wadi ticket verification — shared by the client gate (components/WadiGate)
 * and the server API routes. Matches the Wadi integration kit contract:
 *   - tool id (aud) = "brandvista"  (locked)
 *   - issuer (iss)  = "wadi"
 *   - RS256, verified against Wadi's PUBLIC key (safe to expose).
 *
 * The client gate is UX; the real enforcement is that every BrandVista API
 * route re-verifies the ticket server-side (getRequestTicket) before calling AI.
 */

const TOOL_ID = 'brandvista'; // MUST equal the ticket's `aud` — locked
const ISSUER = 'wadi';
const ALG = 'RS256';

export type WadiTicket = JWTPayload & { sub: string; plan: string; ver?: number };

function decodeBase64(b64: string): string {
  return typeof atob === 'function'
    ? atob(b64)
    : Buffer.from(b64, 'base64').toString('utf8');
}

let keysPromise: Promise<CryptoKey[]> | null = null;

function loadKeys(): Promise<CryptoKey[]> {
  if (keysPromise) return keysPromise;
  const b64s: string[] = [];
  if (process.env.NEXT_PUBLIC_WADI_TICKET_PUBLIC_KEY) {
    b64s.push(process.env.NEXT_PUBLIC_WADI_TICKET_PUBLIC_KEY);
  }
  // DEV-only second trust anchor (locally-minted brandvista tickets). The Wadi
  // registry can't mint brandvista tickets yet; this lets us test before it can.
  // Never present in production builds.
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_WADI_DEV_PUBLIC_KEY
  ) {
    b64s.push(process.env.NEXT_PUBLIC_WADI_DEV_PUBLIC_KEY);
  }
  if (b64s.length === 0) {
    return Promise.reject(
      new Error('NEXT_PUBLIC_WADI_TICKET_PUBLIC_KEY is not set'),
    );
  }
  keysPromise = Promise.all(b64s.map((b) => importSPKI(decodeBase64(b), ALG)));
  return keysPromise;
}

/** Verify a ticket. Throws if invalid / expired / wrong issuer / wrong tool. */
export async function verifyWadiTicket(token: string): Promise<WadiTicket> {
  const keys = await loadKeys();
  let lastErr: unknown;
  for (const key of keys) {
    try {
      const { payload } = await jwtVerify(token, key, {
        issuer: ISSUER,
        audience: TOOL_ID,
        algorithms: [ALG],
      });
      return payload as WadiTicket;
    } catch (e) {
      lastErr = e; // try the next trust anchor (e.g. dev key)
    }
  }
  throw lastErr ?? new Error('No Wadi verification key configured');
}

/** Same as verifyWadiTicket but returns null instead of throwing. */
export async function safeVerifyWadiTicket(
  token: string | null | undefined,
): Promise<WadiTicket | null> {
  if (!token) return null;
  try {
    return await verifyWadiTicket(token);
  } catch {
    return null;
  }
}

/** Pull the ticket from an `Authorization: Bearer <ticket>` header. */
export function ticketFromRequest(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.slice('Bearer '.length).trim();
  return null;
}

/** Server guard for API routes: verified ticket, or null to refuse (401). */
export async function getRequestTicket(req: Request): Promise<WadiTicket | null> {
  return safeVerifyWadiTicket(ticketFromRequest(req));
}
