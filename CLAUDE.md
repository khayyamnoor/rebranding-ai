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

## Ticket spec (hand this to the Wadi project)

A Wadi ticket is a **JWT signed with RS256**.

- **Header:** `{ "alg": "RS256", "typ": "JWT" }`
- **Claims:**
  - `iss` = `"wadi"`        (issuer — verified)
  - `aud` = `"wadi-tools"`  (audience — verified)
  - `sub` = Wadi user id    (string, required)
  - `plan` = plan/tier string (e.g. `"pro"`)
  - `keys` = string[] of providers the user has configured, e.g. `["gemini"]`
  - `iat` = issued-at (unix seconds)
  - `exp` = expiry (unix seconds) — keep **short, ~5 minutes**
- **Delivery:** Wadi opens the tool in its iframe with the ticket on the URL:
  `https://<tool>/?wadi_ticket=<JWT>`. (Transport hardening — cookie +
  postMessage refresh for long sessions — is a Checkpoint-B follow-up.)
- **Verification (this app):** `lib/wadi.ts` → `verifyTicket()` pins
  `algorithms: ['RS256']` and checks `iss`/`aud`/`exp`. Fails closed.

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
- [ ] B — Embedded-tool behavior (frame lock to `WADI_ORIGIN`, resize messaging,
  responsive, ticket transport hardening).
- [ ] C — BYOK via Wadi proxy (remove `GEMINI_API_KEY` dependency).
- [ ] D — Wadi design tokens (flat, no gradients).
