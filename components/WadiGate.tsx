'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { safeVerifyWadiTicket } from '@/lib/wadi-ticket';
import { FrameBridge } from '@/components/FrameBridge';

const WADI_ORIGIN = process.env.NEXT_PUBLIC_WADI_ORIGIN;

// The current valid ticket, attached to every BrandVista API call (which then
// re-verifies it server-side — the real enforcement). Updated automatically
// when Wadi sends a fresh one.
let currentTicket: string | null = null;
export function getWadiTicket(): string | null {
  return currentTicket;
}

type GateState = 'checking' | 'ok' | 'blocked';

/**
 * Wadi access gate (client UX). Wraps the whole app in app/layout.tsx.
 *
 * Handshake (per the Wadi integration kit): once embedded, the tool posts
 * `{source:'wadi-tool', type:'ready'}` to Wadi, and Wadi replies with
 * `{source:'wadi', type:'ticket', ticket}`. We verify the ticket here for UX;
 * the API routes verify it again server-side on every call.
 */
export function WadiGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>('checking');

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (WADI_ORIGIN && event.origin !== WADI_ORIGIN) return; // only trust Wadi
      const d = event.data as { source?: string; type?: string; ticket?: unknown };
      if (!d || d.source !== 'wadi' || d.type !== 'ticket' || typeof d.ticket !== 'string') {
        return;
      }
      const token = d.ticket;
      safeVerifyWadiTicket(token).then((ticket) => {
        if (ticket) {
          currentTicket = token; // refreshed whenever Wadi sends a new one
          setState('ok');
        } else {
          setState('blocked');
        }
      });
    }

    window.addEventListener('message', onMessage);

    if (window.parent !== window.self) {
      // Inside a frame — tell Wadi we're ready for a ticket.
      window.parent.postMessage({ source: 'wadi-tool', type: 'ready' }, WADI_ORIGIN || '*');
    } else {
      setState('blocked'); // opened directly (not via Wadi) → refuse
    }

    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <>
      <FrameBridge />
      {state === 'ok' ? children : <GateScreen state={state} />}
    </>
  );
}

function GateScreen({ state }: { state: Exclude<GateState, 'ok'> }) {
  return (
    <main className="min-h-screen grid place-items-center px-6 text-center">
      <div className="max-w-sm">
        <p className="label-micro mb-3">Wadi</p>
        <h1 className="font-display text-3xl md:text-4xl text-ink mb-3">
          {state === 'checking' ? 'Connecting to Wadi…' : 'Open this from Wadi'}
        </h1>
        <p className="text-soft leading-relaxed">
          {state === 'checking'
            ? 'One moment.'
            : 'This tool only runs inside your Wadi dashboard. Please open it from there while signed in.'}
        </p>
      </div>
    </main>
  );
}
