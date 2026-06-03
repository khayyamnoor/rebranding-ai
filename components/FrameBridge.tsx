'use client';

import { useEffect } from 'react';

const WADI_ORIGIN = process.env.NEXT_PUBLIC_WADI_ORIGIN;

/**
 * Tells the Wadi frame how tall the tool is so it can resize the iframe
 * smoothly. Renders nothing; active only when actually embedded. Posts
 * `{source:'wadi-tool', type:'resize', height}` (production targets the exact
 * Wadi origin; dev uses '*' so the local embed harness works on any port —
 * height is not sensitive).
 */
export function FrameBridge() {
  useEffect(() => {
    if (window.parent === window.self) return; // not embedded

    const target = process.env.NODE_ENV === 'production' ? WADI_ORIGIN || '' : '*';

    const post = () => {
      const height = Math.ceil(document.documentElement.scrollHeight);
      if (target) window.parent.postMessage({ source: 'wadi-tool', type: 'resize', height }, target);
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

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
