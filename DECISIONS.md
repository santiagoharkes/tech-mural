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

## Time log

- Stage 1 — scaffold, tooling, design system, docs skeleton: _~45 minutes_
