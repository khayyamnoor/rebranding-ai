/**
 * DEV-ONLY embed test harness server.
 *
 * Serves scripts/embed-test.html on a SEPARATE origin (default :4000) so it
 * mimics Wadi embedding this tool (default :3001) in an iframe. Mints a fresh
 * brandvista dev ticket on every page load so the embedded tool unlocks.
 *
 * Usage:  node scripts/embed-serve.mjs            # tool on :3001, harness on :4000
 *         TOOL_PORT=3000 node scripts/embed-serve.mjs
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { SignJWT, importPKCS8 } from 'jose';

function loadEnvLocal() {
  const text = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  const env = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[m[1]] = v;
  }
  return env;
}

const env = loadEnvLocal();
const key = await importPKCS8(env.WADI_DEV_JWT_PRIVATE_KEY.replace(/\\n/g, '\n'), 'RS256');
const issuer = env.WADI_TICKET_ISSUER || 'wadi';
const audience = env.WADI_TICKET_AUDIENCE || 'brandvista';

const TOOL_PORT = process.env.TOOL_PORT || '3001';
const PORT = process.env.PORT || '4000';
const template = readFileSync(new URL('./embed-test.html', import.meta.url), 'utf8');

async function freshTicket() {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ plan: 'pro', ver: 1, keys: ['gemini'] })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setSubject('embed-test-user')
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt(now)
    .setExpirationTime(now + 5 * 60)
    .sign(key);
}

createServer(async (req, res) => {
  const token = await freshTicket();
  const html = template
    .replace('%%TICKET%%', token)
    .replace('%%TOOL_ORIGIN%%', `http://localhost:${TOOL_PORT}`);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(Number(PORT), () => {
  console.log(`Embed harness: http://localhost:${PORT}/  (embeds tool on :${TOOL_PORT}, sends ticket by handshake)`);
});
