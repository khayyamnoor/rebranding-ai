import { Studio } from '@/components/Studio';
import { WadiGate } from '@/components/WadiGate';
import { verifyTicket } from '@/lib/wadi';

// The ticket is per-request and time-sensitive, so this page must never be
// statically cached.
export const dynamic = 'force-dynamic';

/**
 * Server-side access gate. Wadi opens this tool with the ticket attached as a
 * `wadi_ticket` query param. We verify it here before rendering anything useful;
 * the API routes verify it again on every call (the real enforcement boundary).
 */
export default async function Page({
  searchParams,
}: {
  searchParams: { wadi_ticket?: string | string[] };
}) {
  const raw = searchParams.wadi_ticket;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const ticket = await verifyTicket(token);

  if (!ticket || !token) {
    return <WadiGate />;
  }

  return <Studio ticket={token} />;
}
