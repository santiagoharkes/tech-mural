# Write-up — Collaborative Board Activity Explorer

A short read covering every question the brief asked. Deep rationale for every choice lives in [`DECISIONS.md`](./DECISIONS.md); this document is the executive summary.

---

## 1. Approach and scoping

I split the work into ten thin vertical slices (Stage 1 → 10). Each slice produces a running app, a green test suite, a visual check in a real browser, and one atomic commit. No half-finished stages. This let me make — and document — tradeoffs at every boundary instead of carrying a pile of `TODO` comments to the end.

The first eight stages cover the brief's evaluation criteria end-to-end; stages 9 and 10 are UX follow-ups that tie the list and spatial views together (reveal-on-board) and turn the canvas into a proper zoomable surface (wheel + keyboard zoom). I deliberately traded breadth for depth: features that exercise the full stack (URL state, server state, client state, derivation, rendering, testing) instead of many half-features. What shipped — spatial board, multi-select filters by author and colour, four sort orders, list-view toggle, "New" highlight for notes under 24 h, reveal-on-board with a deep-linkable focus id, and cursor-anchored wheel zoom — covers every concern the brief asked to evaluate.

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

Selected design system: **shadcn/ui**, chosen after weighing it against Radix primitives, Mantine / Chakra, AWS Cloudscape, GitHub Primer / Shopify Polaris / Atlassian, and Reshaped. The ownership model puts _our_ component code in front of the reviewer instead of an opaque dependency; Radix underneath handles focus management, ARIA, and keyboard semantics correctly. Full candidate-by-candidate rationale in `DECISIONS.md`.

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
- **Note palette on Tailwind scales, not CSS vars** — no dark-mode toggle ships, so the visible bug is hypothetical. Full cost-out below.
- **No e2e for interactive pan** — the pointer drags would randomly start on a note (`data-no-pan`) half the time. Four unit tests cover the pan hook; the e2e is a known limitation.
- **ESLint 10 without `jsx-a11y`** — peer incompatibility. RTL role-based queries and Playwright cover the substance.
- **No animated pan/zoom transitions.** The transform updates jump. Tweening adds a RAF loop for a polish win that did not earn the complexity.
- **No pinch-zoom on touch.** Two-pointer handling was out of scope for the desktop-first build; zoom works on mouse wheel and keyboard today.

**Next steps (in order of ROI):**

1. **Dark-mode toggle + note palette as CSS variables** (audit P2, ~35 min). Shadcn already defines `.dark` tokens; the note surfaces stay bright today because they use raw Tailwind scales. Promote the six colours to `--note-<hue>-{surface,border,fg,accent}` custom properties with `.dark` overrides, add a header toggle bound to `prefers-color-scheme` + localStorage. Visually impactful in screenshots; closes the "two-tracked theming" finding from the audit.
2. **Activity timeline** (~1 h). A horizontal scrub bar of notes grouped by day; dragging the handle filters the board by `[start, end]`. Pure derivation: `groupBy(n => n.createdAt.slice(0, 10))` → day-buckets; nuqs stores the selected range.
3. **Full-text search** (~30 min). A debounced input in the header bound to nuqs (`?q=`); filter applied after `applyNoteFilters`. Zero new architecture — reuses the derivation chain we already have.
4. **Author-aggregation panel** (~30 min). A secondary view showing top contributors, dominant colours per author, and most-recent contribution. All from the existing query.
5. **Virtualisation** once datasets cross ~5k notes. `@tanstack/react-virtual` for the list view; spatial quadtree index so `isNoteVisible` becomes `O(log n)` per pan tick.
6. **Pinch-zoom on touch** — complements Stage 10; two-pointer pan hook extension.
7. **Animated pan/zoom transitions** via `requestAnimationFrame` interpolation on the transform.
8. **Storybook** for the `ui/` primitives and feature components in isolation.
9. **Visual regression tests** via Playwright `toHaveScreenshot`.
10. **Real backend + OpenAPI** → generated types → TanStack Query hooks; retire MSW in one commit.

## 8. Time spent

| Stage     | Deliverable                                              | Time            |
| --------- | -------------------------------------------------------- | --------------- |
| 1         | Scaffold + tooling + design system choice                | ~45 min         |
| 2         | Domain types, MSW, TanStack Query                        | ~40 min         |
| 3         | Spatial board, pan, colour tokens                        | ~45 min         |
| 4         | Filters with URL state (`nuqs`)                          | ~55 min         |
| 5         | Sort, recent highlight, list view (Zustand persist)      | ~50 min         |
| 6         | Viewport culling + memoisation audit                     | ~30 min         |
| 7         | A11y audit + fixes                                       | ~30 min         |
| 8         | Write-up + README polish                                 | ~20 min         |
| 9         | List → board reveal + deep-link + highlight              | ~40 min         |
| 10        | Wheel + keyboard zoom, cursor-anchored, scale-aware cull | ~35 min         |
| 11        | Docs housekeeping                                        | ~10 min         |
| 12        | Mobile responsive (sheet sidebar, stacked toolbar)       | ~45 min         |
| **Total** |                                                          | **~7 h 05 min** |

~3 h over the suggested ~4 h guideline. Stages 1–8 clocked in at ~5 h 15 min — the brief's scope. Stages 9–12 are UX polish and responsive work I took on because they visibly closed loops the earlier stages had left open (list view ↔ spatial view, desktop-only assumption). The extra time lands almost entirely in tests: every stage shipped green at three layers (unit, integration, Playwright) plus a browser visual check. I would make the same call again — writing about a system you trust reads differently than writing about one you hope is correct.
