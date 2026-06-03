# Working rules for this project

## The code review graph is load-bearing

`CODE_REVIEW_GRAPH.md` is the guided tour of this codebase — module
dependencies, runtime data flow, file responsibilities, review order, hot
spots, boundaries, and extension recipes. Reviewers and future sessions rely
on it to understand the shape of the system without re-reading every file.

**It must stay accurate.** A stale graph is worse than no graph because it
asserts things confidently that are no longer true.

## When to update the graph

Update `CODE_REVIEW_GRAPH.md` **in the same change** that introduces the
drift. Don't defer it. Triggers:

- **Files added, removed, renamed, or moved** — update section 1 (mermaid
  module graph) and section 3 (file map).
- **API route added or removed** — update sections 1, 2 (sequence diagram),
  and 3.
- **Pipeline order or concurrency changed** (e.g. sequential → parallel, new
  stage inserted) — update section 2 and the relevant hot spot in section 5.
- **Model, SDK, or external dependency swapped** (`gemini-X` → `gemini-Y`,
  add/remove `sharp`, etc.) — update section 3 and any references in
  sections 5–7.
- **Type union changed** (`AssetType`, `AssetStatus`, new shared interface) —
  update section 3 and the extension recipe in section 7.
- **Env var renamed** — update section 5 (API key exposure row) and
  section 3 (`lib/genai.ts` row).
- **Invariant changed** (e.g. cancellation semantics, exhaustive-switch
  guarantee) — update section 5.
- **Boundary changed** (server-only module imported from client, new shared
  module, persistence introduced) — update section 6.

If a change touches none of the above, the graph probably doesn't need
edits — but glance at it anyway.

## How to update

- Edit `CODE_REVIEW_GRAPH.md` directly. Keep the existing structure and
  tone — terse, declarative, reviewer-oriented.
- When the diagram in section 1 changes, also re-check section 2 (the
  sequence diagram for one generation cycle) — they share nodes.
- Remove stale rows from the file map rather than leaving them with a
  "(deprecated)" note. The graph is a snapshot of *now*, not a changelog.
- If you delete a node from the diagram, grep the rest of the document for
  references to it before saving.

## Workflow

1. Before non-trivial work, read `CODE_REVIEW_GRAPH.md` to load the current
   model of the codebase.
2. Do the work.
3. Before reporting the task done, diff your changes against the graph's
   claims. Update the graph for anything that drifted.
4. The graph update is part of "done." A change that ships without its
   graph update is incomplete.

---

# Wadi integration — single source of truth

This app is being adapted from a standalone Vercel site into a **tool that runs
inside the Wadi platform**. Wadi handles all auth, subscription, and AI-key
storage. This app trusts Wadi and refuses to run outside it.

## Confirmed decisions (founder)

- **Access:** the app refuses to work without a valid Wadi ticket, verified
  **server-side**. (Job 1 / Job 2)
- **Ticket signing:** **RS256** (asymmetric). Wadi holds the PRIVATE key and
  mints tickets; every app holds only the PUBLIC key and can *verify* but never
  *mint*. Chosen over HS256 so a breach of any single app can't forge tickets.
- **AI keys (BYOK):** the **proxy model**. This app NEVER touches a raw key.
  When it needs AI, it sends the request to a Wadi proxy endpoint; Wadi attaches
  the user's stored key, calls Google, returns the result. No key storage and no
  "paste your key" UI in this app. (Job 4)
- **Provider:** Gemini only.
- **Wadi domain:** not finalized — wired via the `WADI_ORIGIN` env var
  (placeholder for now).
- **Phase-1 AI test:** deferred until Wadi's proxy exists. The app shows the
  "add your Gemini key in Wadi" state; live image generation is tested later.

## Ticket spec (CONFIRMED from a real Wadi ticket — Wadi is the source of truth)

A Wadi ticket is a **JWT signed with RS256**. Observed real example:

- **Header:** `{ "alg": "RS256", "typ": "JWT" }`
- **Claims:**
  - `iss` = `"wadi"`               (issuer — verified)
  - `aud` = this tool's unique registry id (audience — verified; scopes a ticket
    to one tool). **This tool (BrandVista) = `brandvista`.**
  - `sub` = Wadi user id (UUID string, required)
  - `plan` = plan/tier string (seen: `"free"`)
  - `ver` = ticket format version (seen: `1`)
  - `iat` / `exp` = issued-at / expiry (unix seconds) — **~5-minute** TTL
  - (No `keys` claim — the "do you have a Gemini key" signal comes from the AI
    proxy's error response, not the ticket.)
- **Delivery:** Wadi opens the tool in its iframe with the ticket on the URL:
  `https://<tool>/?wadi_ticket=<JWT>`. (Transport hardening — cookie +
  postMessage refresh for long sessions — is a Checkpoint-B follow-up.)
- **Verification (this app):** `lib/wadi.ts` → `verifyTicket()` pins
  `algorithms: ['RS256']` and checks `iss`/`aud`/`exp` against the **real Wadi
  public key** in `WADI_JWT_PUBLIC_KEY`. Fails closed.

**Real Wadi public key:** the founder supplied Wadi's RS256 public key; it is
installed in `.env.local` and verifies real tickets (proven). It is safe to
expose (verify-only). The matching private key lives only in Wadi.

## Tool-id (audience) convention — CONTRACT

- Every Wadi tool has one **stable, unique tool-id**, assigned in the Wadi app
  registry, stamped into the ticket's `aud`. Each app accepts **only its own**
  id — this is what stops a ticket for one tool from opening another.
- **`diagnostics` is reserved for Wadi's internal self-test** (throwaway test
  tickets). It is deliberately not a real tool and must **never** be accepted by
  a production tool.
- **This tool (BrandVista) → `aud` = `brandvista`.** Set `WADI_TICKET_AUDIENCE`
  identically on both sides (this app + the Wadi registry entry).

## Dev-only second verify key (local testing convenience)

The Wadi registry can't mint `brandvista` tickets yet, so for LOCAL dev a second
trust anchor is supported: `WADI_DEV_JWT_PUBLIC_KEY`. `verifyTicket` trusts it
**only when `NODE_ENV !== 'production'`**. `scripts/mint-ticket.mjs` signs
`brandvista` dev tickets with the matching `WADI_DEV_JWT_PRIVATE_KEY` so the tool
can be exercised locally. On Vercel (`NODE_ENV=production`) these dev vars are
absent and only the real Wadi public key is trusted.

## Embedding contract (Wadi frame ↔ this tool)

- **Embed:** Wadi loads `https://<tool>/?wadi_ticket=<JWT>` in an iframe. Only
  `WADI_ORIGIN` (and same-origin) may frame the tool — enforced by the
  `Content-Security-Policy: frame-ancestors` header in `next.config.js`. No
  `X-Frame-Options` (it conflicts with frame-ancestors).
- **Resize:** the tool posts `{ type: 'wadi:resize', height }` to the parent
  whenever its content height changes (`components/FrameBridge.tsx`,
  `ResizeObserver`). Wadi should set the iframe height from this.
- **Ticket refresh (optional, for >5-min sessions):** Wadi may post
  `{ type: 'wadi:ticket', token }` to the tool to swap in a fresh ticket; the
  tool uses it for subsequent API calls without reloading.
- **No breakout:** the tool never redirects, opens new tabs, or navigates the
  top window. Once embedded it strips the ticket from its own address bar.

## AI proxy spec (Wadi must build this — used in Checkpoint C, tested later)

Generic Gemini passthrough so every app reuses one endpoint:

- App → `POST {WADI_AI_PROXY_URL}` with `Authorization: Bearer <ticket>` and the
  Gemini request body. Wadi verifies the ticket, looks up the user's Gemini key,
  forwards to Google, returns Google's raw response.
- Error contract:
  - `401` — missing/invalid ticket → app shows the Wadi gate.
  - `402`/`403` (no key set for the provider) → app shows "add your Gemini key
    in Wadi".
  - upstream key rejected → "that key didn't work — check it in Wadi".

## Environment variables

| Var | Where set | Secret? | Purpose |
|-----|-----------|---------|---------|
| `WADI_JWT_PUBLIC_KEY` | this app (Vercel) | no (public key) | verify tickets (RS256, PEM with `\n`) |
| `WADI_ORIGIN` | this app (Vercel) | no | the only origin allowed to embed the tool |
| `WADI_AI_PROXY_URL` | this app (Vercel) | no | Wadi AI proxy endpoint (Checkpoint C) |
| `WADI_DEV_JWT_PRIVATE_KEY` | **local `.env.local` only** | YES | DEV-only; lets `scripts/mint-ticket.mjs` mint test tickets. Never set in prod. |
| `GEMINI_API_KEY` | this app (Vercel) | YES | legacy single shared key; removed at Checkpoint C |

**Key pair:** Wadi gets the matching RSA **private** key (mints tickets); this
app gets the **public** key (verifies). Generate once, reuse the same pair
across all apps.

## Local testing without Wadi

`npm run ticket` (or `node scripts/mint-ticket.mjs`) prints a localhost URL with
a valid signed ticket. Flags: `--no-key` (omit gemini from `keys`),
`--expired` (already-expired ticket, should be refused).

## Phase 1 checkpoint status

- [x] **A — Access gate.** Server-side RS256 ticket verification on the page and
  all `/api/*` routes. `lib/wadi.ts`, `components/Studio.tsx`,
  `components/WadiGate.tsx`, server-component `app/page.tsx`.
- [x] **B — Embedded-tool behavior.** `frame-ancestors` lock to `WADI_ORIGIN`
  (`next.config.js`); `components/FrameBridge.tsx` posts height for smooth
  resize, strips the ticket from the URL once embedded, and accepts a refreshed
  ticket; no redirects/new-tab/breakout. Local harness: `scripts/embed-test.html`
  + `node scripts/embed-serve.mjs` (separate-origin parent on :4000).
  Responsive polish lands with the restyle (D).
- [ ] C — BYOK via Wadi proxy (remove `GEMINI_API_KEY` dependency).
- [ ] D — Wadi design tokens (flat, no gradients).
