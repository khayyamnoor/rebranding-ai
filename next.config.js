/** @type {import('next').NextConfig} */

// Only Wadi (WADI_ORIGIN) may embed this tool in a frame. In dev we also allow
// localhost parents for the embed test harness. If WADI_ORIGIN is unset in
// production, only same-origin framing is allowed (fail-closed: unknown sites
// can't embed).
const isDev = process.env.NODE_ENV !== 'production';
const ancestors = ["'self'"];
if (process.env.WADI_ORIGIN) ancestors.push(process.env.WADI_ORIGIN);
if (isDev) ancestors.push('http://localhost:*');
const frameAncestors = ancestors.join(' ');

const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: '15mb' } },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // The embedding control. Note: intentionally NO X-Frame-Options —
          // frame-ancestors is the modern, origin-specific replacement and the
          // two can conflict.
          { key: 'Content-Security-Policy', value: `frame-ancestors ${frameAncestors};` },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
