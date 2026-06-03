'use client';

import { useEffect } from 'react';

/**
 * Glue between this tool and the Wadi frame that hosts it. Mounted only for an
 * authenticated session. Does three things, all only when actually embedded:
 *  1. Strips the ticket from the visible URL (Wadi re-supplies it on each load).
 *  2. Reports content height to Wadi so it can resize the iframe smoothly.
 *  3. Accepts a refreshed ticket from Wadi (long sessions outlive a 5-min token).
 */
export function FrameBridge({
  wadiOrigin,
  onTicket,
}: {
  wadiOrigin: string;
  onTicket: (token: string) => void;
}) {
  useEffect(() => {
    const embedded = window.parent !== window.self;
    if (!embedded) return; // standalone (e.g. a test link) — leave the URL alone

    // 1) Drop the ticket from the address bar once we're inside the frame.
    const url = new URL(window.location.href);
    if (url.searchParams.has('wadi_ticket')) {
      url.searchParams.delete('wadi_ticket');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }

    // In production we target the exact Wadi origin; in dev we use '*' so the
    // local embed-test harness works on any localhost port. Height is not
    // sensitive, so '*' in dev is acceptable.
    const target =
      process.env.NODE_ENV === 'production' ? wadiOrigin : '*';

    // 2) Height reporting.
    const post = () => {
      const height = Math.ceil(document.documentElement.scrollHeight);
      if (target) window.parent.postMessage({ type: 'wadi:resize', height }, target);
    };
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(post);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(document.documentElement);
    window.addEventListener('resize', schedule);
    post();

    // 3) Refreshed-ticket channel.
    const onMessage = (e: MessageEvent) => {
      if (process.env.NODE_ENV === 'production' && wadiOrigin && e.origin !== wadiOrigin) {
        return;
      }
      const data = e.data as { type?: string; token?: unknown };
      if (data && data.type === 'wadi:ticket' && typeof data.token === 'string') {
        onTicket(data.token);
      }
    };
    window.addEventListener('message', onMessage);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('message', onMessage);
      cancelAnimationFrame(raf);
    };
  }, [wadiOrigin, onTicket]);

  return null;
}
