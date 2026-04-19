# Write-up — Collaborative Board Activity Explorer

A short read covering every question the brief asked. Deep rationale for every choice lives in [`DECISIONS.md`](./DECISIONS.md); this document is the executive summary.

---

## 1. Approach and scoping

I split the work into eight thin vertical slices (Stage 1 → 8). Each slice produces a running app, a green test suite, a visual check in a real browser, and one atomic commit. No half-finished stages. This let me make — and document — tradeoffs at every boundary instead of carrying a pile of `TODO` comments to the end.

I deliberately traded breadth for depth: four well-built features that exercise the full stack (URL state, server state, client state, derivation, rendering, testing) instead of eight half-features. The features I chose — spatial board view, multi-select filters by author and color, four sort orders, a list-view toggle, and a "New" badge for recent notes — cover every concern the brief asked to evaluate.

## 2. Assumptions

- **SPA, logged-in.** Mural-style products do not need SSR or SEO.
- **Dataset size = "hundreds".** I implemented viewport culling (~7× DOM reduction on the spatial board) but deferred real virtualisation; see "next steps" for the upgrade path.
- **Desktop-first.** The brief did not mention mobile. Responsive behaviour is the #1 deferred item, explicitly called out.
- **Evaluation over polish.** Pixel-perfect visuals were not in scope. Component structure, state boundaries, tests, and explainable tradeoffs were.

## 3. Frontend architecture

**Stack:** Vite + React 19 + TypeScript · Tailwind v4 · shadcn/ui · TanStack Query · Zustand · nuqs · MSW · Vitest + RTL · Playwright.

**Feature-based folder layout** (`src/features/notes`, `features/filters`, `features/view-mode`), each co-locating its components, hooks, store slice, and tests. `src/components/ui` is vendored shadcn primitives.

**The state boundary is the load-bearing decision of the project**:

| Concern                   | Source of truth                    |
| ------------------------- | ---------------------------------- |
| Notes + authors           | TanStack Query cache               |
| Filter + sort             | URL via `nuqs` (typed parsers)     |
| View mode (board vs list) | Zustand + `persist` / localStorage |
| Pan offset                | Component state                    |

One rule, applied everywhere: _if a teammate opening the same link should see the same thing, it goes in the URL_. If it is a per-browser preference, it goes in Zustand. Everything else stays local. No mirror, no duplication.

Selected design system: **shadcn/ui**, chosen over nine other candidates from the `awesome-design-systems` list. Ownership model puts _our_ component code in front of the reviewer; Radix underneath handles focus management, ARIA, and keyboard semantics correctly.

Key component-level decisions:

- `NoteCard` is `React.memo`, positioned absolutely via inline style — a re-render of one card does not reflow the canvas.
- `NoteBoard` owns query + branches (`skeleton / empty / error / filtered-empty / success`); each branch has its own `data-testid` and sub-component.
- `SpatialBoard` and `NoteList` are siblings, not one component with a `layout` prop — CSS context is scoped to the component that owns it.
- `useBoardPan` attaches window-level listeners while dragging (no `setPointerCapture`), which lets the entire pan feature be unit-tested in jsdom.

## 4. Performance + accessibility

### Shipped

**Performance.** Viewport culling via `ResizeObserver` + pure `isNoteVisible`. At 1280×720 the spatial board renders 29 of 200 notes (~7× DOM reduction). `React.memo` on cards, `useMemo` on derivations, TanStack Query `select` for cache-cheap projections, `translate3d` on the pan layer for GPU compositing, dynamic import for MSW so it does not land in the critical path. Memoisation audit with React DevTools Profiler; nothing else flagged.

**Accessibility.** Ran `impeccable:audit`: **14/20 → 15/20**. Fixes shipped: keyboard pan on the canvas (arrow keys + `Home`, `aria-keyshortcuts`), skip-to-board link (`sr-only → focus-visible:not-sr-only`) that hits `main#board-canvas` for WCAG 2.4.1, `motion-safe:` gate on every animation, `role="region"` / `role="radiogroup"` / `aria-labelledby` / `fieldset+legend` everywhere they belong, live regions for status + alert, focus-visible rings on every interactive element.

### Next, with more time

- Virtualisation (`@tanstack/react-virtual`) for 10k+ notes — spatial and list.
- Spatial quadtree index so `isNoteVisible` is `O(log n)` per pan tick.
- Responsive mobile (sheet/drawer sidebar, stacked toolbar, bigger touch targets).
- Note palette promoted to CSS variables with dark-mode counterparts, plus a dark-mode toggle.

## 5. UX decisions

- **"Showing X of Y notes"** in the header when filters are active. The board itself is spatial, so filtered notes may land off-screen — the header is where the filter's _effect_ is legible.
- **Counts next to every filter option** are _pre-filter_ totals. Unchecking a box should tell you what would come back — not the count that depends on that same box.
- **Two empty states, not one.** `BoardEmpty` for "the board is empty"; `BoardEmptyFiltered` for "no notes match your filters". Different causes, different call-to-actions.
- **List view** closes the spatial board's weakest moment: filtered results scattered across a 4000×3000 canvas. One click to a grid that scans top-to-bottom.
- **"New" badge + ring** for notes in the last 24 h. Visible at a glance; survives screenshots and assistive tech via `data-recent`.

## 6. AI usage

Claude Code acted as my pair programmer in a driver/navigator loop. I held the wheel on every architectural decision (design system choice, state-boundary rule, component split, deferral tradeoffs); the model drove scaffolding, caught ESLint/TS-config pitfalls faster than I would have manually, drafted first passes of commit messages and doc sections, and ran tests between changes. Every piece of code and prose in the repo was reviewed and owned by me. I also used the `impeccable:audit` skill to run a systematic P0–P3 audit in Stage 7 — the output informed what I fixed and what I deferred with a justification.

## 7. Tradeoffs and next steps

**Accepted tradeoffs:**

- **No SSR** — logged-in SPA, not crawlable.
- **MSW in the prod bundle** — portable demo, single swap point for a real API, ~88 KB gzip.
- **No mobile responsive** — deferred with an explicit 45–60 min cost estimate.
- **Note palette on Tailwind scales, not CSS vars** — no dark-mode toggle ships, so the visible bug is hypothetical.
- **No e2e for interactive pan** — the pointer drags would randomly start on a note (`data-no-pan`) half the time. Four unit tests cover the pan hook; the e2e is a known limitation.
- **ESLint 10 without `jsx-a11y`** — peer incompatibility. RTL role-based queries and Playwright cover the substance.

**Next steps (in order of ROI):**

1. Responsive mobile (biggest user impact).
2. Activity timeline — notes grouped by day with a scrub bar.
3. Full-text search (nuqs-backed, debounced).
4. Author-aggregation panel.
5. Virtualisation once datasets cross ~5k notes.
6. Storybook for the `ui/` primitives and feature components.
7. Visual regression tests via Playwright `toHaveScreenshot`.
8. Real backend + OpenAPI → generated types → TanStack Query hooks.

## 8. Time spent

| Stage     | Deliverable                                         | Time            |
| --------- | --------------------------------------------------- | --------------- |
| 1         | Scaffold + tooling + design system choice           | ~45 min         |
| 2         | Domain types, MSW, TanStack Query                   | ~40 min         |
| 3         | Spatial board, pan, color tokens                    | ~45 min         |
| 4         | Filters with URL state (`nuqs`)                     | ~55 min         |
| 5         | Sort, recent highlight, list view (Zustand persist) | ~50 min         |
| 6         | Viewport culling + memoisation audit                | ~30 min         |
| 7         | A11y audit + fixes                                  | ~30 min         |
| 8         | Write-up + README polish                            | ~20 min         |
| **Total** |                                                     | **~5 h 15 min** |

About an hour over the suggested ~4 h guideline. The overrun was almost entirely tests — every stage shipped green at three layers (unit, integration, Playwright) and a visual check. I would make the same choice again; writing about a system you trust reads differently than writing about one you hope is correct.
