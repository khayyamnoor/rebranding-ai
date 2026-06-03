/**
 * DEV-ONLY mock of Wadi's AI proxy.
 *
 * Wadi's real proxy (Job 3) verifies the ticket, injects the user's Gemini key,
 * calls Google, and returns the response. It doesn't exist yet, so this stand-in
 * lets us test how BrandVista reacts to the proxy's outcomes.
 *
 * Modes (env MODE):
 *   no_key  (default) → 402 {code:'NO_KEY'}       → tool shows "add your key in Wadi"
 *   reject            → 400 {code:'KEY_REJECTED'} → tool shows "that key didn't work"
 *
 * Usage:  node scripts/mock-proxy.mjs
 *         MODE=reject node scripts/mock-proxy.mjs
 */
import { createServer } from 'node:http';

const PORT = process.env.PORT || '4100';
const MODE = (process.env.MODE || 'no_key').toLowerCase();

createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end();
    return;
  }
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const hasTicket = (req.headers['authorization'] || '').startsWith('Bearer ');
    console.log(`[mock-proxy] POST  ticket:${hasTicket ? 'yes' : 'no'}  mode:${MODE}`);
    // A real proxy would verify the ticket and inject the user's key here.
    if (MODE === 'reject') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 'KEY_REJECTED', message: 'invalid key' }));
      return;
    }
    res.writeHead(402, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 'NO_KEY' }));
  });
}).listen(Number(PORT), () => {
  console.log(`Mock Wadi AI proxy (mode=${MODE}) on http://localhost:${PORT}`);
});
