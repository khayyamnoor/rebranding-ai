import { Studio } from '@/components/Studio';

// Access is gated by <WadiGate> in app/layout.tsx (client handshake) and
// enforced server-side on every /api/* route. This page just renders the tool.
export default function Page() {
  return <Studio />;
}
