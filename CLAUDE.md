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
- **Env var renamed** — update section 5 (AI key handling / Wadi access-gate
  rows) and section 3 (`lib/wadi-ai.ts` / `lib/wadi-ticket.ts` rows).
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
- **Delivery — postMessage handshake (per the Wadi integration kit):** Wadi
  embeds the tool in an iframe (no ticket in the URL). On load the tool posts
  `{source:'wadi-tool', type:'ready'}` to Wadi; Wadi replies with
  `{source:'wadi', type:'ticket', ticket:<JWT>}`. Wadi may re-send a fresh
  ticket anytime (long sessions outlive a 5-min token).
- **Verification (this app):**
  - *Client gate (UX):* `components/WadiGate.tsx` verifies the ticket via
    `lib/wadi-ticket.ts` and only renders the tool when valid; otherwise shows
    "Open this from Wadi". It also stores the ticket for `getWadiTicket()`.
  - *Server enforcement (the real boundary):* every `/api/*` route calls
    `getRequestTicket()` and re-verifies the `Authorization: Bearer` ticket
    before doing anything. `lib/wadi-ticket.ts` pins `algorithms:['RS256']` and
    checks `iss="wadi"` / `aud="brandvista"` / `exp`. Fails closed.

**Real Wadi public key:** supplied by the founder via the integration kit as
`NEXT_PUBLIC_WADI_TICKET_PUBLIC_KEY` (base64 of the PEM). Safe to expose
(verify-only). The matching private key lives only in Wadi.

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
trust anchor is supported: `NEXT_PUBLIC_WADI_DEV_PUBLIC_KEY` (base64). It is
trusted **only when `NODE_ENV !== 'production'`** (dead-code-eliminated from prod
builds). `scripts/mint-ticket.mjs` signs `brandvista` dev tickets with the
matching `WADI_DEV_JWT_PRIVATE_KEY`. The embed harness
(`scripts/embed-serve.mjs`, `npm run embed`) serves a separate-origin parent
that performs the real handshake with a fresh dev ticket. On Vercel
(`NODE_ENV=production`) these dev vars are absent and only the real Wadi public
key is trusted.

## Embedding contract (Wadi frame ↔ this tool) — message shapes

- **Embed:** Wadi loads `https://<tool>/` in an iframe (no ticket in URL). Only
  `NEXT_PUBLIC_WADI_ORIGIN` (and same-origin) may frame the tool — enforced by
  the `Content-Security-Policy: frame-ancestors` header in `next.config.js`. No
  `X-Frame-Options` (it conflicts with frame-ancestors).
- **Auth handshake:** tool → Wadi `{source:'wadi-tool', type:'ready'}`; Wadi →
  tool `{source:'wadi', type:'ticket', ticket}` (resend anytime to refresh).
  Tool ignores ticket messages whose `event.origin` ≠ `NEXT_PUBLIC_WADI_ORIGIN`.
- **Resize:** tool → Wadi `{source:'wadi-tool', type:'resize', height}` on every
  content-height change (`components/FrameBridge.tsx`). Wadi should set the
  iframe height from this. *(Wadi kit didn't specify resize yet — ask Wadi to
  add this listener.)*
- **No breakout:** the tool never redirects, opens new tabs, or navigates the
  top window.

## AI proxy spec (Wadi must build this endpoint) — Job 4 / Checkpoint C

**Call path decision:** AI requests go from **BrandVista's server** → Wadi proxy
(NOT browser → proxy), so the tuned prompts stay private. The user's key never
reaches this app. Built in `lib/wadi-ai.ts` (`callGemini`).

**CONFIRMED against the live proxy** (`https://wadi-kappa.vercel.app/api/ai/proxy`).
**Path-based passthrough** — Wadi stays generic; BrandVista builds the path
(`lib/wadi-ai.ts` adapts).

- **Request:** `POST {WADI_AI_PROXY_URL}` (default `<NEXT_PUBLIC_WADI_ORIGIN>/api/ai/proxy`)
  with `Authorization: Bearer <ticket>` and JSON body:
  ```json
  { "provider": "gemini",
    "path": "/v1beta/models/<model>:generateContent",
    "body": { "contents": [...], "generationConfig": { ... } } }
  ```
  (`body` is the raw Gemini REST request. SDK-style `config` →
  `generationConfig`; e.g. image gen uses
  `generationConfig: { responseModalities:["IMAGE"], imageConfig:{ aspectRatio } }`.)
  Wadi verifies the ticket, injects the user's Gemini key, calls Google.
- **Success:** `200` + **Google's raw REST JSON** (this app reads
  `candidates[0].content.parts[]` — `.text` and `.inlineData.data`).
- **Errors:** wrapped as `{ error, message }`:
  - `401 no_ticket` / `invalid_ticket` → app shows the Wadi gate.
  - no-key (user hasn't added a Gemini key) → app shows "Add your Gemini key in
    Wadi". `lib/wadi-ai.ts` classifies this from status 402/403 or an
    `error`/`message` matching `no_key`/"missing key". **(Confirm exact no-key
    status+string with Wadi when convenient.)**
  - rejected key (e.g. Google "API key not valid") → "that key didn't work —
    check it in Wadi".
- This app no longer holds `GEMINI_API_KEY` and no longer imports `@google/genai`.

## Environment variables

| Var | Where set | Secret? | Purpose |
|-----|-----------|---------|---------|
| `NEXT_PUBLIC_WADI_TICKET_PUBLIC_KEY` | this app (Vercel) | no (public key) | verify Wadi tickets (RS256, base64 PEM) |
| `NEXT_PUBLIC_WADI_ORIGIN` | this app (Vercel) | no | the only origin allowed to embed the tool / send tickets |
| `NEXT_PUBLIC_WADI_DEV_PUBLIC_KEY` | **local `.env.local` only** | no | DEV-only second verify key (base64). Ignored in prod. |
| `WADI_DEV_JWT_PRIVATE_KEY` | **local `.env.local` only** | YES | DEV-only; lets `scripts/mint-ticket.mjs` mint test tickets. Never set in prod. |
| `WADI_AI_PROXY_URL` | this app (Vercel) | no | Wadi AI proxy endpoint. Defaults to `<NEXT_PUBLIC_WADI_ORIGIN>/api/ai/proxy`. Local dev → `http://localhost:4100` (mock). |

`GEMINI_API_KEY` is **removed** — this app no longer calls Gemini directly.

**Key pair:** Wadi holds the RSA **private** key (mints tickets); this app holds
the **public** key (verifies). Same pair reused across all apps. Values come
from the Wadi integration kit; latest public key is in Wadi's `CLAUDE.md`.

## Local testing without Wadi

`npm run ticket` (or `node scripts/mint-ticket.mjs`) prints a localhost URL with
a valid signed ticket. Flags: `--no-key` (omit gemini from `keys`),
`--expired` (already-expired ticket, should be refused).

## Phase 1 checkpoint status

- [x] **A — Access gate** (later aligned to the Wadi integration kit).
  `components/WadiGate.tsx` does the postMessage handshake + client verify and
  exposes `getWadiTicket()`; `lib/wadi-ticket.ts` is the shared verifier; every
  `/api/*` route re-verifies server-side (the real boundary). `app/layout.tsx`
  wraps the app in `WadiGate`; `app/page.tsx` just renders `Studio`.
- [x] **B — Embedded-tool behavior.** `frame-ancestors` lock to
  `NEXT_PUBLIC_WADI_ORIGIN` (`next.config.js`); `components/FrameBridge.tsx`
  posts `wadi-tool/resize` height for smooth resizing; no redirects/new-tab/
  breakout. Local harness: `npm run embed` (separate-origin parent on :4000 that
  performs the real handshake). Responsive polish lands with the restyle (D).
- [x] **C — BYOK via Wadi proxy.** `lib/wadi-ai.ts` (`callGemini`) routes all AI
  through Wadi on the user's key; the four API routes use it and map proxy
  errors (NO_KEY → 402, KEY_REJECTED → 400). `GEMINI_API_KEY` + `@google/genai`
  removed. `components/NeedsKeyScreen.tsx` shows "Add your Gemini key in Wadi" on
  NO_KEY. Dev mock: `npm run mock-proxy` (`MODE=no_key|reject`). Live generation
  tested once Wadi's real proxy exists (deferred, per founder).
- [x] **D — Wadi design tokens (flat, no gradients).** `app/wadi-tokens.css`
  holds the shared tokens (sand canvas, forest-green actions, terracotta accent,
  Fraunces / Archivo / Spline Sans Mono). `tailwind.config.ts` + `app/globals.css`
  consume them; gate, needs-key, upload, generation, progress, queue, buttons,
  cards restyled. **Scope:** the tool *chrome* only. The generated brand deck
  (`SlideCard`) is the user's brand artifact — self-contained fonts/colors,
  intentionally NOT restyled to Wadi. The full-screen deck *viewer*
  (`ResultsScreen`, dark cinematic) is also left as the output environment.
