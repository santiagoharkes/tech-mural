# Board Activity Explorer

Frontend take-home for exploring activity on a collaborative board. Given a set of sticky notes contributed during a session, the UI lets users visualise them in their spatial context, filter by author and color, sort, and surface recent activity.

> This repository is being built up in thin, end-to-end vertical slices. Each stage produces a running app, tested and lintable. See `DECISIONS.md` for the architectural rationale behind each choice.

---

## Stack

| Concern                  | Choice                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Build                    | [Vite](https://vitejs.dev) + React 19 + TypeScript                                  |
| Styling                  | [Tailwind CSS v4](https://tailwindcss.com) (CSS-first config)                       |
| Components               | [shadcn/ui](https://ui.shadcn.com) (Radix primitives, owned in `src/components/ui`) |
| Server state             | [TanStack Query](https://tanstack.com/query) _(Stage 2)_                            |
| Client state             | [Zustand](https://zustand.docs.pmnd.rs) slices _(Stage 4)_                          |
| URL state                | [nuqs](https://nuqs.47ng.com) _(Stage 4)_                                           |
| Mock API                 | [MSW](https://mswjs.io) _(Stage 2)_                                                 |
| Unit / integration tests | [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com) |
| End-to-end tests         | [Playwright](https://playwright.dev)                                                |
| Lint / format            | ESLint (flat config) + Prettier + `prettier-plugin-tailwindcss`                     |
| Git hooks                | Husky + lint-staged                                                                 |

Full rationale in [`DECISIONS.md`](./DECISIONS.md).

---

## Getting started

### Prerequisites

- Node.js `>= 20` (LTS)
- pnpm `>= 9` (`npm install -g pnpm`)

### Install

```bash
pnpm install
pnpm exec playwright install chromium
```

### Common commands

```bash
pnpm dev           # Vite dev server on http://localhost:5173
pnpm build         # Type-check + production build to dist/
pnpm preview       # Preview the production build

pnpm lint          # ESLint
pnpm format        # Prettier write
pnpm typecheck     # tsc --noEmit via project references

pnpm test          # Vitest in watch mode
pnpm test:run      # Vitest single run
pnpm test:coverage # Vitest with V8 coverage report

pnpm test:e2e      # Playwright (auto-starts dev server)
pnpm test:e2e:ui   # Playwright UI mode
```

---

## Project structure

```
src/
  components/
    ui/              # shadcn/ui primitives (owned, vendored)
  lib/
    utils.ts         # cn() helper and other pure utilities
  test/
    setup.ts         # Vitest + RTL global setup
  App.tsx
  main.tsx
  index.css          # Tailwind entry + shadcn tokens

tests/
  e2e/               # Playwright specs
```

Feature directories (`src/features/notes`, `src/features/filters`, `src/mocks`) are introduced in later stages. Every feature co-locates its components, hooks, store slice, API layer, and tests.

---

## Stage plan

| Stage | Deliverable                                       | Status |
| ----- | ------------------------------------------------- | ------ |
| 1     | Scaffold, tooling, design system, smoke tests     | ✅     |
| 2     | Notes domain types, MSW mock, TanStack Query hook | ✅     |
| 3     | Spatial board view with note component            | ✅     |
| 4     | Author + color filters, URL-synced state          | ✅     |
| 5     | Sort options + recent-activity highlighting       | ✅     |
| 6     | Performance pass (viewport culling, memoisation)  | ✅     |
| 7     | Accessibility pass                                | ✅     |
| 8     | Final write-up (decisions, tradeoffs, next steps) | ⏳     |

---

## Testing philosophy

Three layers, each doing the job they're best at:

- **Unit** — pure functions (sort, filter reducers, date helpers). Fast, deterministic, many of them.
- **Integration** — components wired to real stores and query clients. Asserts behaviour through the accessible DOM.
- **End-to-end** — Playwright against the real dev server, one spec per critical user flow (render, filter, sort, reload with URL state).

Shadcn UI primitives live in `src/components/ui/` and are excluded from coverage — they are vendored and covered by the underlying Radix test suites.
