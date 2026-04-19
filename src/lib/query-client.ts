import { QueryClient } from '@tanstack/react-query'

/**
 * Factory over a singleton so tests can create isolated clients per case.
 *
 * Defaults tuned for a read-heavy explorer:
 * - `staleTime: 60s` — filters trigger re-renders, not refetches.
 * - `gcTime: 5 min` — keeps the data warm through brief navigations.
 * - `retry: 1` — one retry smooths over transient hiccups without hiding bugs.
 * - `refetchOnWindowFocus: false` — exploration context; the user is actively
 *   engaged, surprise refetches would jitter the canvas.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}
