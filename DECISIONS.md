# Architectural decisions

A running log of the choices made while building the Board Activity Explorer, with the reasoning and the alternatives that were considered. Written in the order the choices were made so the reader can follow the trail.

---

## Scope

The challenge invites choosing a small set of features rather than aiming for breadth. With a ~4-hour budget this project will deliver:

1. Spatial board view (notes rendered by `x` / `y`)
2. Filter by author (multi-select)
3. Filter by color (chips)
4. Sort (by creation time, author, position) and a "recent" highlight for notes created in the last 24 h

A secondary list view, full-text search, author aggregations, activity timelines, export, and collaboration features are documented as next steps (see the bottom of this document).

---

## Stack choices

### Vite over Next.js

- This is a logged-in, highly interactive SPA. There is no SSR/SEO benefit.
- Vite's dev server and HMR are faster and the Playwright integration is trivial (`webServer` hook).
- Fewer moving parts, fewer opinions to justify.

### Tailwind v4 over v3

- v4 ships as a first-class Vite plugin (`@tailwindcss/vite`) with zero PostCSS config.
- CSS-first configuration keeps the design tokens next to the styles that consume them.
- shadcn/ui has full v4 support, so there is no migration debt.

### TanStack Query for server state

- Mural is read-heavy during exploration and should cache, deduplicate, and surface loading/error states consistently.
- `staleTime` + `select` keep UI derivation colocated with the data layer.
- Pairs naturally with MSW — the mock API can respond realistically (with latency and flaky scenarios) without changing the React code.

### Zustand slices for client state

- Filter state and UI state are simple enough that Redux Toolkit would be overkill.
- Zustand lets each feature own a slice, compose them in one root store, and test slices in isolation without providers.
- Selectors with `shallow` comparisons give us opt-in re-render control where it matters.

### nuqs for URL state

- Filter and sort choices should survive a reload and be shareable — the URL is the correct source of truth.
- `nuqs` provides a `useState`-shaped API with typed parsers, default values, and shallow routing out of the box.
- Using it alongside Zustand keeps the boundary clean: **URL owns the user's intent, Zustand owns transient UI state, TanStack Query owns server data.** No piece duplicates another.

### MSW over a static JSON import

- Demonstrates realistic fetch patterns, loading states, and query invalidation.
- The handler file is the only place that needs to change to swap in a real backend later.
- The ~40 KB runtime cost is acceptable for a take-home and is excluded from the production bundle with a small wrapper (Stage 2).

---

## Design system: shadcn/ui

### Candidates considered

From the `awesome-design-systems` list, the options that realistically fit a Tailwind + Vite + TypeScript stack with strong accessibility were:

- **Radix primitives (unstyled)** — excellent accessibility, but every component needs to be styled from scratch.
- **Mantine / Chakra UI** — batteries-included, but ship their own styling engine that fights Tailwind.
- **AWS Cloudscape** — strong for data-heavy admin UIs, but heavy visual opinion from a specific brand.
- **GitHub Primer / Shopify Polaris / Atlassian Design System** — polished, but bring a brand identity that would overshadow ours in an interview context.
- **Reshaped** — modern and a11y-aware, but licensing constraints on the Figma kit.
- **shadcn/ui** — Radix under the hood, Tailwind-native, components copied into the repo.

### Why shadcn/ui wins for this challenge

1. **Ownership model**: components live in `src/components/ui/`, not `node_modules`. In a take-home, this puts _our_ component code in front of the reviewer instead of an opaque dependency.
2. **Accessibility baseline**: the Radix primitives underneath handle focus trapping, keyboard navigation, `aria-*` attributes, and dismissal correctly — things we would otherwise spend half the budget rebuilding.
3. **Stack cohesion**: Tailwind-native styling, no CSS-in-JS runtime, no PostCSS surprises.
4. **Neutral visuals**: the default tokens are intentionally plain so the craft on display is ours, not the design system's.
5. **Review-friendly**: any senior frontend reviewer recognises shadcn instantly and can judge how well we compose and extend it without ramp-up.

### The tradeoff we accept

shadcn/ui is **a component library, not a full design system**. It does not ship brand tokens, voice and tone guidance, or designer kits. For this challenge that is the correct level of abstraction — we are demonstrating frontend architecture, not brand systems work. For a real product we would layer our own tokens on top of the CSS variables that shadcn exposes and treat the `ui/` folder as a vendored, patchable dependency.

### How it's used in this repo

- Components added so far: `button`, `card`, `badge`, `checkbox`, `select`, `input`, `label`, `tooltip`, `separator`, `popover`.
- ESLint and Prettier **skip** `src/components/ui/**` for lint rules that would force us to hand-edit every primitive we pull in (`react-refresh/only-export-components`). The folder is treated as vendored code.
- Test coverage also excludes this folder.

---

## Testing approach

Three layers, each doing the job it is best at:

| Layer       | Tool                           | What it covers                                                                                   |
| ----------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| Unit        | Vitest                         | Pure functions (filter, sort, date bucketing) and Zustand slices in isolation                    |
| Integration | Vitest + React Testing Library | Components wired to the real store and a real `QueryClient`, asserted through the accessible DOM |
| End-to-end  | Playwright (chromium)          | Critical user flows from the browser: render, filter, sort, reload-with-URL-state                |

Accessibility is treated as a first-class concern: tests use role-based queries (`getByRole`) so missing semantics break tests, not just humans.

---

## Tradeoffs already accepted

- **No SSR / SEO** — SPA only. This is a logged-in workspace, it does not need to be crawlable.
- **MSW in dev and production** — keeps the demo portable; the single-responsibility handler file is the swap point for a real backend.
- **No virtualisation in Stage 1** — viewport culling arrives in Stage 6; a true `react-window` / TanStack Virtual solution is documented as a next step should the dataset grow past low-thousands of notes.
- **No i18n, no dark mode toggle, no auth** — out of scope for a 4 h exercise. Dark mode tokens are already defined in `index.css` (shadcn default) so enabling it later is a single provider change.
- **jsx-a11y ESLint plugin not included** — peer-dependency incompatibility with ESLint 10. Accessibility is instead enforced through Playwright / RTL role-based assertions and a manual pass with `impeccable:audit` in Stage 7.

---

## Next steps (with more time)

- List view toggle (accessibility boost for screen readers and keyboard-only users)
- Full-text search with a debounced input
- Activity timeline — notes grouped by day, with a scrub bar
- Author-aggregation panel (counts per author, dominant colors)
- Virtualisation (`@tanstack/react-virtual`) for thousands of notes
- Storybook for the `ui/` primitives and feature components in isolation
- Visual regression tests via Playwright's `toHaveScreenshot`
- Real backend contract (OpenAPI → generated types → TanStack Query hooks)
- Dark mode toggle wired to `prefers-color-scheme`

---

## AI usage

AI assistance (Claude Code) was used as a pair programmer: driving scaffolding, catching ESLint flat-config pitfalls faster, and drafting documentation. Every architectural decision in this document was reviewed and owned by the author.

---

## Stage 2 — data layer

### Domain shape

The brief shows `{ id, text, x, y, author, color, createdAt }` on the wire. We keep that shape verbatim so the UI contract does not drift from a hypothetical real API. Colors are a string-literal union (`NOTE_COLORS as const`) so the compiler catches typos and we can iterate the palette in one place.

A separate `Author` entity carries the display name. Storing only an author ID on the note keeps the payload denormalised cheaply and lets us swap author details in an aggregation pass without touching every note.

Responses come back as a typed envelope (`NotesResponse`) — a bare array would leave nowhere to grow (cursors, board identity, sync markers). The cost is one extra `.notes` dereference and it pays for itself on the first contract change.

### Deterministic dataset

Tests assert "200 notes, 8 authors, some number recent". Randomness would have made those assertions flaky from day one. The fixture is generated with a seeded Mulberry32 PRNG — small, fast, fine for fixtures; not for crypto. The same seed gives the same dataset on every machine, in every CI run, forever.

Two shaping decisions worth calling out:

- **Recency bias** (`u ** 2`): squaring the uniform roll pulls creation times toward the recent end of the window. Without it, "recent activity" in Stage 5 would look uniform with the rest of the board; with it, there is something to highlight.
- **Positions are uniformly scattered across a 4000×3000 canvas**: closer to reality would be cluster-biased (workshops pile notes around themes), but that is trivially swappable once the board view exists and it is not on the critical path for the challenge.

### MSW as the only backend

The brief explicitly lists MSW as acceptable. We chose it because it lets us demonstrate **realistic** fetch semantics — a service worker intercepts the real `fetch`, includes a small latency, and can be overridden per-test. The alternative (a JSON import) would have made loading/error states untestable without fake React-level plumbing.

One handler file (`src/mocks/handlers.ts`) is the integration boundary: swapping to a real backend deletes that file and leaves every consumer of `useNotesQuery` untouched. The browser worker (`browser.ts`) and the node server (`server.ts`) share those handlers verbatim — tests and the running app agree by construction.

### TanStack Query defaults

- `staleTime: 60s` — filters and sort changes are client-side derivations; the cache does not need to refetch for them.
- `refetchOnWindowFocus: false` — the board is an active canvas; unannounced refetches would jitter it.
- `retry: 1` — one retry smooths transient failures without hiding a genuine outage.
- Test clients disable retries and use a 0ms `gcTime` so error paths resolve instantly.

`useNotesQuery` is generic over `select` so callers derive data (counts, filtered lists, groupings) without inflating the cache footprint. One network request, one cache entry, many views.

### Provider boundary

`main.tsx` is the single composition root: MSW bootstrap → `QueryClientProvider` → `App`. Devtools mount only in `import.meta.env.DEV` so production builds stay clean. The same pattern will layer `nuqs` and the Zustand provider in Stage 4 without any churn below.

### Visible in the UI

`App.tsx` now surfaces loading / success / error states on top of the real query, with the summary announced via `role="status"` / `aria-live="polite"` so assistive tech is not left guessing. The error state ships a retry button so the failure mode is usable, not just reported.

---

## Stage 3 — spatial board view

### Component split

Three sharply-scoped components:

- **`NoteCard`** — a single note. Pure, memoised, positioned absolutely via inline `left`/`top`. Accepts a resolved `authorName` instead of looking authors up itself, so the component stays colorblind to how the parent sourced it.
- **`NoteBoard`** — the spatial container. Owns the query, owns the pan, and branches loading/empty/error/success. Notes render inside a single translated layer so pan updates one transform, not 200.
- **`AppHeader`** — subscribes to the same `useNotesQuery` as the board. React Query dedupes the request, so both components see the same cache entry without any prop-drilling or lifted state.

### Pan without `setPointerCapture`

The pan hook attaches `pointermove` / `pointerup` to `window` while a drag is active. We deliberately avoided `setPointerCapture` — jsdom does not implement it, so relying on it would have forced every pan test to run in Playwright. The `window`-listener pattern is just as robust for a canvas that fills the viewport, and it keeps the unit-test surface 100 % in Vitest.

Notes carry `data-no-pan`; the hook shorts out when a pointerdown originates inside that attribute, so clicks and focus still work through them.

### Color tokens live in one file

Every `NoteColor → { surface, border, foreground, accent }` mapping lives in `features/notes/lib/note-colors.ts`. `NoteCard` never names a Tailwind color class directly. Re-theming the palette is a search-and-replace in one file, and there is exactly one visual regression target for color changes.

### State branches as sub-components

Loading, empty, and error are sub-components inside `note-board.tsx`, each with its own `data-testid`. That let us:

- Assert each branch in isolation from integration tests with targeted MSW overrides.
- Keep the main board render path readable — one early return per branch, no nested conditionals.
- Ship an empty state and a retryable error state (`<button>Retry</button>`) from day one, without waiting for a "polish pass".

### Accessibility

- `<article>` per note with `aria-labelledby` pointing at the text → screen readers announce the text as the note's name.
- `role="region"` on the board with a dynamic `aria-label` reporting the count.
- `<time dateTime={iso}>` so assistive tech and browsers can parse the timestamp; the label itself comes from `Intl.RelativeTimeFormat` (`numeric: 'auto'` so "yesterday" wins over "1 day ago").
- Focusable notes (`tabIndex={0}`) with a visible ring via `focus-visible:ring-ring/60`.
- The board header announces the note/contributor totals via `role="status"` / `aria-live="polite"`.

### Interactive-pan end-to-end test: deferred

A pan e2e test that starts a drag anywhere in the viewport would land on a sticky note roughly 50 % of the time (notes carry `data-no-pan`, so the drag is intentionally no-ops'd). Solving that needs either (a) a predictable empty area, (b) a programmatic "pan by X/Y" escape hatch on the component, or (c) dispatching events directly at the section element. The pan hook is already covered by four focused Vitest cases that assert pointer delta, skip behaviour, button filter, and offset accumulation — that is the layer where the behaviour actually lives. We will revisit the e2e in Stage 5 once a predictable empty corner exists (e.g. after filters reduce the note count).

---

## Stage 4 — filters with URL state

### Where each piece of state lives

The rule from Stage 1 is now enforced end-to-end:

- **URL owns user intent.** `authors` and `colors` live in the query string via `nuqs`. Reloading the page restores them, a shared link restores them, and the browser back button moves through them. No other state mirror.
- **React Query owns server data.** `useNotesQuery` remains the single cache. `FilterBar`, `AppHeader`, and `NoteBoard` all subscribe independently; TanStack Query dedupes to one network request.
- **Pure functions own derivation.** `applyNoteFilters` takes a list and a filter object and returns a new list (or the same reference when no filter is active). `computeFilterCounts` walks the dataset once per render via `useMemo` to produce counts.

Zustand is installed but intentionally unused so far. Filters are user intent and belong on the URL; Zustand will earn its keep in Stage 5 onward for genuinely transient UI state (an open panel, an ephemeral toast, the current hovered note).

### nuqs parsers

Parsers are defined at module scope so React Query-style referential-equality tricks work — re-creating a parser on every render would invalidate `useQueryState`'s memo. Colors use `parseAsStringLiteral(NOTE_COLORS)` so junk like `?colors=neon` is filtered out before it can reach the reducer; a strictly-typed enum on the URL boundary makes the filter pipeline a no-op for bad input instead of a runtime bomb.

### Counts show possibility, not reality

Each filter option shows the count **across the whole dataset**, not the count after other filters have been applied. The alternative ("live counts" that shrink as you filter) sounds nicer but is strictly worse UX: unchecking a checkbox should tell you what will come back, and it can't if the number depends on that same checkbox.

### State branches grew by one

`NoteBoard` now has a fifth branch, `BoardEmptyFiltered`, for "the dataset is not empty but the active filters match nothing". It carries a clear-filters button because that is the only action that moves the user forward. The original `BoardEmpty` ("the board itself is empty") is still reachable — a `GET /api/notes` that returns `{ notes: [] }` lands in that branch. Two empty states, two messages, two call-to-actions.

### Testing seams

- **Pure function**: `filter-notes.test.ts` covers the filter matrix (empty, single, multi, AND-combined, no-match) — six deterministic cases, zero React in the loop.
- **Hook**: `use-board-filters.test.tsx` wraps `useBoardFilters` in `NuqsTestingAdapter` and asserts hydration, toggle, multi-toggle, unknown-value rejection, and clear.
- **Integration**: `filter-bar.test.tsx` pairs the testing adapter with an `onUrlUpdate` observer so we assert what the URL becomes, not how we got there. A checkbox click must produce `?authors=user_1` — if nuqs or the parser change under us, this test fails at the boundary that matters.
- **End-to-end**: three Playwright specs cover apply-a-filter, reload-preserves-state, clear-returns-to-full-dataset.

### Known UX gap — deferred

Filtered notes keep their original `(x, y)` on the 4000×3000 canvas. With 9 matches scattered across that space and a viewport of ~1280×720, most filtered notes are off-screen until the user pans. This is the right default for "the board is the board", but it means the feedback loop is weak.

Options considered and **not** shipped in Stage 4:

1. **Auto-pan to the filtered centroid** on every filter change. Fights with the user's own pan.
2. **Reset pan on every filter toggle.** Loses the user's navigation state for no good reason.
3. **Re-layout filtered notes in a grid.** Breaks "the board is the board" and conflicts with Stage 3's spatial invariant.
4. **List-view toggle.** The scoped-out Stage 4 next step — implemented in Stage 5 or later.

Shipped behaviour: the board keeps its spatial integrity; the header surfaces "Showing X of 200" so the user knows how many should be there; pan-to-find remains the interaction. The list-view toggle is the right next step for this and is called out in the Next steps section.

---

## Stage 5 — sort, recent highlight, and list view

### What Stage 5 actually shipped

Three user-visible features:

1. A **"New" badge** on any note whose `createdAt` is inside a configurable recency window (24 h by default).
2. A **sort dropdown** with four orderings (most-recent / oldest / author / position) persisted in the URL.
3. A **view-mode toggle** between the spatial board and a responsive list grid, persisted in `localStorage` via Zustand.

The view-mode toggle also closes the "filtered notes are off-screen" UX gap from Stage 4: a user who applies a filter can flip to list mode and see every match in a compact grid, regardless of where each note sits on the 4000×3000 canvas.

### Where each piece of state now lives (final map)

| Concern                   | Source of truth             | Lifetime                       |
| ------------------------- | --------------------------- | ------------------------------ |
| Notes + authors           | React Query cache           | Until `gcTime` (5 min default) |
| Filter (authors, colors)  | URL (`nuqs`)                | Navigation / reload / share    |
| Sort                      | URL (`nuqs`)                | Navigation / reload / share    |
| View mode (board vs list) | Zustand + `persist` / local | Per-browser preference         |
| Pan offset                | Component state             | Until component unmounts       |

One rule, applied every time: if another user viewing the same link should see the same thing, it goes in the URL. If "my preference on my laptop" should carry across sessions, it goes in Zustand with `persist`. Everything else stays component-local.

### Sort semantics

- `recent` (default) and `oldest` sort by `createdAt` — lexicographic compare on ISO-8601 strings is both correct and faster than parsing into `Date` once per comparator.
- `author` sorts A–Z, then falls back to most-recent within an author so bigger contributors do not jumble at the top.
- `position` reads top-to-bottom, then left-to-right — the obvious order a human uses to scan a board.
- Every branch falls back to `id` as the final tiebreaker because the fixture guarantees stable IDs; sort should never look random.

Unknown values in `?sort=` are filtered out by `parseAsStringLiteral(SORT_OPTIONS)` — the URL boundary is the last place where we accept garbage.

### Recency as a pure function

`isRecentNote(note, now?, windowMs?)` is pure and takes both `now` and the window as arguments. Default `now` is `new Date()`; tests always pass a fixed clock. Default window is 24 h; the argument exists so a live-session mode (for example "last 15 min") is a config change, not a code fork.

### Why view mode goes in Zustand, not in the URL

View mode is **preference**, not **intent**. Two users sharing the same filter/sort link may legitimately prefer different renderings. Putting it on the URL would force a preference into a shared payload. Zustand with `persist` + `localStorage` matches the real requirement: "my choice, on my machine, across sessions."

The store is shaped as a slice with `viewMode`, `setViewMode`, and `toggleViewMode`. Additional transient UI state (hovered note id, open panels, in-progress selections) will compose as sibling slices in the same store without re-architecting.

### `NoteCard` vs `NoteListItem`

We did not introduce a `layout="spatial" | "list"` prop on `NoteCard`. Instead `NoteListItem` is a sibling component that shares the palette and recency behaviour but owns its own CSS context (`relative` inside a CSS grid vs `absolute` on the spatial canvas). Two components, one responsibility each — the duplication is trivial, the clarity is not.

### Testing

- **Pure**: `sortNotes` gets the exhaustive matrix (all four sorts, tie-break, non-mutation). `isRecentNote` covers in-window, out-of-window, and custom window.
- **Hook**: `useBoardSort` under `NuqsTestingAdapter` asserts default, hydration, unknown-value rejection, and setter.
- **Store**: `useViewModeStore` covers read, set, toggle, and `localStorage` persistence.
- **E2E**: one spec per user-visible capability — sort writes to URL, list view survives reload (proves the persist middleware), "new" badges render.

---

## Stage 6 — performance pass

### Viewport culling on the spatial board

`NoteBoard` renders the spatial canvas through a `ResizeObserver`-backed `useElementSize` hook. A pure `isNoteVisible(note, offset, viewport, padding)` maps each note's `(x, y)` through the current pan offset and tests against the viewport rectangle plus a `VIEWPORT_PADDING` buffer so fast pans do not expose blank canvas at the edges.

Measured: at the default viewport (1280×720) and zero pan, 29 of 200 notes intersect the visible region — DOM node count drops from 200 to 29 (**~7× reduction**) before we touched virtualisation at all. React reconciliation, hit-testing, and paint all scale with that number, not the dataset size.

Two important defaults:

- **Fallback = render everything** when the container has not been measured yet (initial render, SSR, jsdom, `ResizeObserver`-less environments). A one-time 200-card paint is cheaper than being wrong about which notes to cull.
- The observer is only attached once; subsequent pans re-run the pure `filter` with the cached `size` reference. `useMemo` over `[notes, offset, size]` keeps the result stable until inputs change.

### Observable hooks for tests

`<section data-total-notes={n.length} data-visible-notes={visible.length}>` lets Playwright assert "the filter reached the board" and "culling is active" without guessing a specific number of DOM nodes. Counts-in-viewport are intrinsically viewport-dependent; making the test robust to that is part of the test design, not a workaround.

### Memoisation audit

Walked the component tree with the React DevTools Profiler ready. What already paid its way:

| Where                                 | What                      | Why                                                              |
| ------------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| `NoteCard` / `NoteListItem`           | `React.memo`              | Hundreds of instances; props are stable between renders          |
| `useNotesQuery({ select: ... })`      | TanStack Query cache      | `BoardModel` reference is stable until the underlying data ships |
| `NoteBoard` `processed` useMemo       | `[data, filters, sortBy]` | Filter+sort run at most once per input change                    |
| `SpatialBoard` `visibleNotes` useMemo | `[notes, offset, size]`   | Cull runs at most once per pan tick                              |
| `FilterBar` `counts` useMemo          | `[data]`                  | Counts recomputed only when notes change, not on filter toggles  |
| `useBoardFilters` / `useBoardPan`     | `useCallback` on toggles  | Callback identity stable so `React.memo` children don't thrash   |

What we did **not** add, because the profiler did not flag it:

- `useCallback` on sub-100µs handlers that never cross a memo boundary — noise.
- `useMemo` on primitive computations (counts, sums) — churn for no CPU saved.
- A custom `useDeepMemo` for the filter object — the nuqs setter already returns the same array reference when untouched, so `useMemo([authors, colors])` is sufficient.

### Why not `react-virtual` yet

Virtualisation is the right next step once datasets cross low-thousands of notes. We did not ship it because:

1. Viewport culling already reduces spatial-board rendering to the viewport, which is the dominant cost here.
2. The list view paints 200 DOM nodes in a CSS grid; the browser handles that without a framework in the loop.
3. Adding `@tanstack/react-virtual` for 200 items would add library surface and complexity for a win the profiler does not show.

For 5k–50k notes: wrap `NoteList` in `@tanstack/react-virtual` (list view — easy, single-column or responsive grid with `useWindowVirtualizer`) and replace the spatial cull with a quadtree / interval tree index keyed on `(x, y)` so `isNoteVisible` becomes `O(log n)` instead of `O(n)` per pan tick. Both are drop-in changes behind the current component boundaries.

### Other performance moves already in place

- **Service Worker cache**: MSW's bootstrap is dynamic-imported; not in the initial paint path.
- **TanStack Query dedup**: `AppHeader`, `FilterBar`, and `NoteBoard` all subscribe to the same `useNotesQuery` — one network request, three consumers.
- **`translate3d` on the pan layer**: forces GPU compositing so a drag doesn't rasterise on the CPU.
- **`will-change: transform`**: signals the browser to promote the canvas layer ahead of the first drag.
- **Tailwind v4's new engine**: zero PostCSS cost in dev HMR.

---

## Stage 7 — accessibility pass

### How we ran the audit

Ran `impeccable:audit` on the codebase. Scored **14/20 · Good** on first pass:

| Dimension     | Before    | After                                       |
| ------------- | --------- | ------------------------------------------- |
| Accessibility | 3 / 4     | 4 / 4                                       |
| Performance   | 4 / 4     | 4 / 4                                       |
| Theming       | 2 / 4     | 2 / 4 (deferred)                            |
| Responsive    | 1 / 4     | 1 / 4 (deferred)                            |
| Anti-patterns | 4 / 4     | 4 / 4                                       |
| **Total**     | **14/20** | **15/20** (with deferrals honestly counted) |

### Fixes shipped

**P1 · Keyboard pan.** The spatial canvas was pointer-only, a WCAG 2.1.1 Level A violation for keyboard-only and switch-device users. `useBoardPan` now exports `panBy(dx, dy)` and `reset()`; `<SpatialBoard>` attaches an `onKeyDown` handler to its focusable `<section>` that maps Arrow keys to 80px steps and `Home` to recenter. The section surfaces the shortcut to assistive tech via `aria-keyshortcuts` + a descriptive `aria-label`.

**P2 · Skip-to-board link.** First focusable child of the app shell. `sr-only` when idle, `focus-visible:not-sr-only` when Tab reaches it — the browser's Tab-trap is broken without a visual marker. Targets `#board-canvas` on `<main tabIndex={-1}>`, so activating the link moves programmatic focus to the canvas landmark. WCAG 2.4.1 Bypass Blocks.

**P3 · `motion-safe:` gate.** Note-card hover-lift, list-item hover-lift, and the loading skeleton's pulse are now behind Tailwind's `motion-safe:` variant. Users with `prefers-reduced-motion: reduce` no longer see unrequested motion; hover still lifts the shadow (a colour change, not motion) so the affordance survives.

### Tests added

- `useBoardPan.test`: new cases for `panBy` (increment) and `reset` (restore to initial).
- `tests/e2e/a11y.spec.ts`: skip link reveals on focus and moves focus to the main landmark; ArrowRight/ArrowRight changes the canvas transform; `Home` restores it.

### Deferred, with reasons

Two P1/P2 items in the audit were explicitly **not** shipped. Writing them down in full so the review can weigh the tradeoff rather than guess.

**Deferred · Mobile responsive layout (audit P1).**
`FilterBar` is a fixed `w-72`; on viewports under ~720px the sidebar dominates and the board becomes unusable. A proper fix requires a Sheet/Drawer for the sidebar under `md`, a vertical stack of the toolbar under `sm`, and a Filter trigger in the header. Estimated cost: 45–60 minutes of layout work plus visual regression. The take-home brief does not mention mobile, the dev budget is capped at ~4 hours, and shipping this correctly means also re-touching the dragging behaviour for touch (bigger hit targets, taller rows). Recorded as the top next step should the product actually ship.

**Deferred · Note palette promoted to CSS variables (audit P2).**
Today `note-colors.ts` uses Tailwind scales (`bg-yellow-100`) directly; flip on `.dark` and the note surfaces stay bright against a dark chrome. The fix is mechanical — six CSS variables per colour with `.dark` overrides, map the palette to `bg-[var(--note-yellow-surface)]`. Deferred because there is no dark-mode toggle shipped for this take-home, so the visible bug is hypothetical. If we added the toggle, this becomes a blocker; without it, it is ~20 minutes of churn with no user-facing difference.

### What's still in (not a tradeoff, but worth stating)

- `role="region"` on the canvas with an `aria-label` that names the count and the shortcut help.
- `<article aria-labelledby="…">` per note — screen readers announce the sticky's text as its accessible name.
- `role="radiogroup"` + `aria-checked` on the view-mode toggle (shadcn/Radix gets the checkbox and select semantics right by default).
- `fieldset` + `legend` around each filter block — form controls have programmatic group names.
- Live regions: `role="status" aria-live="polite"` for header totals and the loading skeleton; `role="alert"` for the error state.
- Focus-visible rings on every interactive element, tuned to the existing shadcn token (`ring-ring/60`).
- Every interactive element is reachable by keyboard; no `onClick` handlers on non-semantic `div`s.

---

## Stage 9 — list → board reveal

### What it solves

Stage 4 documented a real gap: with filters active, matching notes are scattered across a 4000×3000 canvas and most land off-screen. Stage 5 closed one half (a list view so results are legible in a grid). Stage 9 closes the other half: **from the list, one click takes you back to the spatial view with the target note centred and highlighted**.

### Shape

- **URL-backed focus state** (`?focus=note_0042`) via a new `useBoardFocus` nuqs hook. Deep-linkable, shareable, reload-safe — same contract as filters and sort.
- **Pure geometry** in `center-on-note.ts`: given a note and a viewport, returns the pan offset that puts the note's centre at the viewport's centre. No React in the computation; the test is a two-assertion unit.
- **`useBoardPan.setOffset`** added alongside the existing `panBy` / `reset` — imperative replacement of the offset is what centring needs, and exposing it alongside the other hooks keeps the API cohesive.
- **Highlight ring** on the focused card, driven by a 2.5 s timer in `SpatialBoard`. `NoteCard` renders a `ring-primary ring-4` while `isHighlighted`; the removal animates via `motion-safe:transition-[transform,box-shadow]`.
- **Reveal button** on each `NoteListItem` — `<Button>` from shadcn with `size="icon"`, the lucide `Locate` glyph, and a contextual `aria-label` (`Show "<text>" on the board`). Visible by default at 60 % opacity, 100 % on hover / focus-visible.

### Why the effect is safe

`react-hooks/set-state-in-effect` flagged the centring effect because it calls `setHighlightId` from inside a `useEffect`. Neither `highlightId` nor `offset` appear in the effect's dependency array, so there is no cascade — the effect fires once per distinct `focus` value. The disable comment on that line explains the reason rather than just silencing the rule.

### Why a button and not a clickable card

A whole-card click would steal the default "focus to read" affordance — screen-reader users who `Tab → Enter` to pause on a note would be teleported away instead. An explicit icon button keeps intention clear, preserves the card's own semantics, and gives a disjoint tab stop for keyboard users.

### Tests

- `centerOnNote` — two cases (origin and mid-canvas), pure geometry asserted by solving for the centre equality.
- `useBoardFocus` — default, hydration, `setFocus`, `clear`, all through `NuqsTestingAdapter`.
- `useBoardPan` kept its existing cases (pointer, bail-out, keyboard deltas, reset).
- `tests/e2e/reveal.spec.ts` — two scenarios: the list-click flow (URL updates, view flips, highlight ring renders) and deep-linking (`/?focus=note_0042` lands centred with the ring on).

### What we did not do

- **Clear `focus` on first user pan.** Tempting but wrong. If a user reloads on a focused link they expect to land centred again — URL is intent, not scratch space. The highlight fades on its own; the canvas stays where the user left it.
- **"Back to list" breadcrumb.** The view-mode toggle is one click away and the URL still carries the focus. Adding another affordance would pile up.
- **Animated pan to the centred position** (smooth interpolation instead of a jump). Would look great, adds complexity that a 4-hour exercise does not earn back.

---

## Stage 10 — wheel + keyboard zoom

### Shape of the change

`useBoardPan` now owns `scale` alongside `offset`. One state object (`Transform = { x, y, scale }`), one set of setters (`panBy`, `setOffset`, `zoomBy`, `resetZoom`, `reset`). The hook name stays — pan-and-zoom is still "viewport transform", and renaming would churn every consumer for no gain.

### Zoom-to-cursor math

```
canvasPoint = (cursor - offset) / prevScale
newOffset   = cursor - canvasPoint * nextScale
```

That keeps the canvas point under the pointer fixed through the zoom — the Figma / Miro feel. Pure, tested, no stale state (we use the setState updater).

### Why `{ passive: false }` on the wheel listener

React attaches `onWheel` as a passive event by default, so `event.preventDefault()` inside the handler is silently a no-op and the page would scroll. We subscribe natively from a `useEffect` with `{ passive: false }` so `preventDefault` actually prevents, and the cleanup unsubscribes on unmount.

### Scale-aware culling and centring

Both pure functions now take an optional `scale` parameter. The derivations:

- `isNoteVisible` — the viewport in canvas space becomes `[-offset.x / scale, (width - offset.x) / scale]`. Padding, expressed in screen pixels, is divided by `scale` too: the further you zoom out, the more canvas the buffer covers. At `scale = 1` everything reduces to the Stage 6 formula.
- `centerOnNote` — `viewport/2 - (note + W/2) * scale` instead of `viewport/2 - (note + W/2)`. Centring at non-unit zoom is one multiply away.

Both signatures default `scale = 1`, so every existing call site stays green without edits.

### Keyboard shortcuts

`+` / `=` zoom in, `-` / `_` zoom out by a factor of 1.25, `0` resets to 100 %. Surfaced to assistive tech via `aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Home + - 0"` and the `aria-label` spells them out ("Arrow keys pan, Home recenters, + and − zoom, 0 resets zoom.").

### Tests added

- `useBoardPan.test`: `zoomBy` without centre (pure multiply), `zoomBy` around a cursor point (offset verifies the anchor-preservation math), clamp behaviour at the MAX boundary, `resetZoom` preserves pan.
- `viewport-culling.test`: two scale cases (zoom-out reveals, zoom-in hides).
- `center-on-note.test`: non-unit-scale case verifying `(note + W/2) * scale + offset = viewport/2`.
- `tests/e2e/zoom.spec.ts`: keyboard `+` / `-` / `0` mutates `data-scale`; wheel zoom around a cursor anchor increases the matrix scaleX above 1.

### What's not in

- **Animated zoom transitions.** The `translate + scale` update lands instantly. Tweening would look nicer, but `requestAnimationFrame` scheduling on every wheel event is its own rabbit hole and the exercise does not earn it back.
- **Pinch-zoom on touch.** The pan hook already bails on `event.button !== 0`; touch pinch would need a two-pointer handler. Out of scope.
- **Visible zoom indicator.** We expose `data-scale` for tests and assistive tech; a small "(125 %)" chip in the corner would be a polish pass.

---

## Stage 12 — mobile responsive

Closes the last P1 from the `impeccable:audit` — same feature set on a 360 px phone as on a 1440 px desktop.

### Shape

- **FilterBar split into two exports**: `FilterBarContent` (the inner panel body — header, clear button, `AuthorFilter`, `ColorFilter`, loading state) and `FilterBar` (the desktop `<aside>` wrapper with `hidden md:flex`). Zero duplication: the desktop sidebar and the mobile drawer render the exact same inner tree.
- **`<MobileFilterSheet>`** wraps a shadcn `Sheet` (Radix Dialog under the hood). The trigger is a `<Button>` with a `SlidersHorizontal` icon and a live count badge (`activeCount > 0`). The sheet slides in from the left at `w-[min(90vw,20rem)]` and drops `FilterBarContent` inside. `md:hidden` hides the trigger on desktop; the desktop sidebar hides below `md`. One of the two is always visible.
- **Responsive header**: the subtitle is `hidden sm:block`, the title scales from `text-base` to `text-lg` at `sm`, horizontal padding goes from `px-4` to `sm:px-6`. Summary text scales from `text-xs` to `sm:text-sm`. All text `truncate`s when space is tight.
- **Responsive toolbar**: `flex-wrap` with `gap-3` so `[MobileFilterSheet] [SortSelect] [ViewModeToggle]` stack onto two rows under sufficiently narrow viewports. `py-2` replaces the fixed `h-12` so the wrapped row gets room.
- **Touch targets**: filter rows went from `space-y-1.5` to individual `py-1.5 gap-3` with `py-1` on the `<Label>` — effective hit area is now ~40 px instead of ~24 px. Passes WCAG 2.5.8 (Target Size Minimum) comfortably.

### Why one component, two wrappers

The desktop sidebar and the mobile drawer are the same thing, with a different outer shell. Creating a `FilterBarContent` and two wrappers enforces that: any change to the filter UI lands in one file and shows up in both places by construction. The alternative — a single `FilterBar` that detects its own container type — would couple layout to content for no win.

### A11y notes

- `<Sheet>` from shadcn is Radix Dialog; focus is trapped in the drawer while it is open, `Escape` closes it, and the overlay click dismisses. Free with the primitive.
- The trigger button's `aria-label` reports the active count (`Filters, 3 active`) so screen readers hear more than just "Filters" when a badge is showing.
- `SheetHeader` carries a `SheetTitle` and `SheetDescription`; both are `sr-only` so sighted users keep the clean look while AT users get a named region.

### Testing

- `tests/e2e/mobile.spec.ts` runs with `test.use({ viewport: { width: 390, height: 844 } })` (no webkit required — we stay in chromium to keep the install path lean). Two specs: desktop sidebar is hidden, mobile trigger is visible with the expected accessible name; opening the sheet, toggling Ada Lovelace, seeing `?authors=user_1` in the URL, closing, and seeing the trigger's accessible name update to `Filters, 1 active`.
- All prior specs remain green at the default 1280×720 viewport.

### Why we stayed in chromium

Playwright's `devices['iPhone 13']` uses webkit. Adding it would mean another download + install step. The behaviour under test is layout and event wiring, not engine-specific rendering. A viewport override in chromium exercises the same code paths we care about and keeps `pnpm exec playwright install chromium` as the one command a reviewer has to run.

---

## Time log

- Stage 1 — scaffold, tooling, design system, docs skeleton: _~45 minutes_
- Stage 2 — types, seeded dataset, MSW, TanStack Query, tests: _~40 minutes_
- Stage 3 — NoteCard, NoteBoard, pan, color tokens, tests: _~45 minutes_
- Stage 4 — filters (nuqs URL state), FilterBar UI, integration tests, Playwright e2e: _~55 minutes_
- Stage 5 — recent highlight, sort, view-mode (Zustand persist), list view, tests: _~50 minutes_
- Stage 6 — viewport culling, memoisation audit, performance notes: _~30 minutes_
- Stage 7 — audit, keyboard pan, skip link, motion-safe, a11y e2e: _~30 minutes_
- Stage 8 — write-up + README polish: _~20 minutes_
- Stage 9 — list → board reveal with deep-linkable `?focus=` + highlight ring: _~40 minutes_
- Stage 10 — wheel + keyboard zoom, cursor-anchored zoom-to-point, scale-aware culling and centring: _~35 minutes_
- Stage 11 — docs housekeeping (counts, structure, next steps rewrite): _~10 minutes_
- Stage 12 — mobile responsive (Sheet sidebar, responsive toolbar + header, touch targets): _~40 minutes_
