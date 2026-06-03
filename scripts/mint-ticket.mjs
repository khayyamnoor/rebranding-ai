/**
 * DEV-ONLY test-ticket minter.
 *
 * Wadi will mint real tickets in production using its PRIVATE key. This script
 * stands in for Wadi during local testing: it signs a ticket with the dev
 * private key in .env.local and prints a localhost URL you can open to see the
 * tool unlock. It is never deployed and never runs in production.
 *
 * Usage:
 *   node scripts/mint-ticket.mjs                # valid ticket, gemini key present
 *   node scripts/mint-ticket.mjs --no-key       # valid ticket, NO gemini key (for the "add your key" state)
 *   node scripts/mint-ticket.mjs --expired      # an already-expired ticket (should be refused)
 */
import { readFileSync } from 'node:fs';
import { SignJWT, importPKCS8 } from 'jose';

function loadEnvLocal() {
  let text;
  try {
    text = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  } catch {
    console.error('Could not read .env.local — run this from the project root.');
    process.exit(1);
  }
  const env = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[m[1]] = val;
  }
  return env;
}

const env = loadEnvLocal();
const pem = env.WADI_DEV_JWT_PRIVATE_KEY;
if (!pem) {
  console.error('WADI_DEV_JWT_PRIVATE_KEY missing from .env.local.');
  process.exit(1);
}
const origin = (env.WADI_ORIGIN && env.WADI_ORIGIN.startsWith('http'))
  ? env.WADI_ORIGIN
  : 'http://localhost:3000';

const args = process.argv.slice(2);
const noKey = args.includes('--no-key');
const expired = args.includes('--expired');

const key = await importPKCS8(pem.replace(/\\n/g, '\n'), 'RS256');

const now = Math.floor(Date.now() / 1000);
const builder = new SignJWT({
  plan: 'pro',
  keys: noKey ? [] : ['gemini'],
})
  .setProtectedHeader({ alg: 'RS256' })
  .setSubject('test-user-123')
  .setIssuer('wadi')
  .setAudience('wadi-tools')
  .setIssuedAt(expired ? now - 3600 : now)
  .setExpirationTime(expired ? now - 3000 : now + 5 * 60);

const token = await builder.sign(key);

console.log('\nTest ticket minted (' +
  (expired ? 'EXPIRED — should be refused' : 'valid 5 min') +
  (noKey ? ', no gemini key' : ', gemini key present') + '):\n');
console.log(`${origin}/?wadi_ticket=${token}\n`);
