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
