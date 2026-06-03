# Deploying BrandVista as a Wadi tool

Plain-English checklist for the founder. Nothing here is urgent — **read the
warning first.**

## ⚠️ Do NOT deploy until the Wadi side is ready

After this Phase-1 work, the live tool **refuses to run without a valid Wadi
ticket**. That's the point — but it means: if you deploy now, the bare
`.vercel.app` URL will stop working for everyone, *and* Wadi can't open it yet
either. So deploy only once ALL of these are true on the Wadi platform:

- [ ] Wadi's app registry lists this tool with id **`brandvista`** (so it mints a
      `brandvista` ticket — not the `diagnostics` test ticket).
- [ ] Wadi embeds the tool in an iframe and does the **handshake**: it listens for
      `{source:'wadi-tool', type:'ready'}` and replies
      `{source:'wadi', type:'ticket', ticket}`. (See "Embedding contract" in
      `CLAUDE.md`.)
- [ ] Wadi has built the **AI proxy** at `…/api/ai/proxy` that injects the user's
      Gemini key. (See "AI proxy spec" in `CLAUDE.md`.)

Until then, keep using the local test setup (`npm run dev` + `npm run embed`).

## Step 1 — Set the Vercel environment variables

Vercel → your BrandVista project → **Settings → Environment Variables**
(Production). Add exactly these three:

**`NEXT_PUBLIC_WADI_TICKET_PUBLIC_KEY`** (Wadi's public key — safe to expose)
```
LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFyZW9LdGNDZ21oM1dUc080OHA2cAo4Z202NXk2WWp6emhRSm1qWEdxS0NISGNOU0dRQzErYy90TFdMZU81ZTBvRExQUENxL0xhK0dIYzBFdFZ5eVhiClJNajQzQUQxRGQ4alc4ejFsV2tXcWxJSzIwbDNodVBsZHl3T2psUFZuNDFiNWp3RXZzWldTWWlicm9ubWJxcG8KSWdDbkVBcnYwcWw1T0lJSzZ3NUpidkdTWHVaZ3dkWUtkY2RYQUJ2emR5aGFwWUp0c3NkWmVJZnUyVEZucUQ1SApiRkVzaXZMMDIrakd6bFYvUmpXRU90OGZjYjdER1BxWDdrV281bDlNQmtoVUZrNlJaQUtoZFdYVUYzejNJZzZRCkZpbGRYemNwbXdCeWZTV0IxbGlUT0VaeXRnbXJqNWF1VDBzUkI2aGhlZHFTYTNGa2FsTnphbmRCYS8vb3NxS0gKTFFJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==
```

**`NEXT_PUBLIC_WADI_ORIGIN`** — your Wadi web address (the only site allowed to
embed this tool and send tickets):
```
https://wadi-kappa.vercel.app
```

**`WADI_AI_PROXY_URL`** — Wadi's AI proxy endpoint (confirmed live):
```
https://wadi-kappa.vercel.app/api/ai/proxy
```
(If you leave this unset, the app auto-uses `NEXT_PUBLIC_WADI_ORIGIN` + `/api/ai/proxy`, which is the same value.)

### Do NOT set these in production
- `GEMINI_API_KEY` — removed; this app no longer calls Gemini directly.
- `WADI_DEV_JWT_PRIVATE_KEY`, `NEXT_PUBLIC_WADI_DEV_PUBLIC_KEY` — local-test only.

## Step 2 — Deploy

This pushes to GitHub, which triggers Vercel's production deploy:
```
git push origin main
```
(Ask Claude to do this with you when you're ready — it's the point of no return
for the live URL.)

## Step 3 — Test the live tool (the same click-tests, for real)

1. Open the raw `https://<your-app>.vercel.app/` in a fresh browser → it must show
   **"Open this from Wadi"** and nothing else.
2. Open the tool **through Wadi** as a signed-in user → it must load.
3. With no Gemini key in Wadi → **"Add your Gemini key in Wadi"**. Add your key →
   generate a deck → the usage appears on **your** Google account.
4. Confirm a non-Wadi site cannot embed it (browser blocks the frame).

## Rollback

If anything looks wrong after deploy, in Vercel → Deployments → pick the previous
working deployment → **Promote to Production** (instant revert). The code is also
recoverable: the pre–Phase-1 state is commit `070a052`.
