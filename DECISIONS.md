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

## Time log

- Stage 1 — scaffold, tooling, design system, docs skeleton: _~45 minutes_
- Stage 2 — types, seeded dataset, MSW, TanStack Query, tests: _~40 minutes_
- Stage 3 — NoteCard, NoteBoard, pan, color tokens, tests: _~45 minutes_
- Stage 4 — filters (nuqs URL state), FilterBar UI, integration tests, Playwright e2e: _~55 minutes_
