import { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions,
} from '@testing-library/react'

/**
 * A fresh QueryClient per test keeps caches isolated and disables retries so
 * that error-path tests resolve quickly and deterministically.
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function withQueryClient(client = createTestQueryClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

/** `render` pre-wrapped with a dedicated QueryClient. */
export function renderWithClient(
  ui: ReactNode,
  { client, ...options }: RenderOptions & { client?: QueryClient } = {},
) {
  const queryClient = client ?? createTestQueryClient()
  return {
    queryClient,
    ...render(ui, { wrapper: withQueryClient(queryClient), ...options }),
  }
}

/** `renderHook` pre-wrapped with a dedicated QueryClient. */
export function renderHookWithClient<TProps, TResult>(
  callback: (props: TProps) => TResult,
  { client, ...options }: RenderHookOptions<TProps> & { client?: QueryClient } = {},
) {
  const queryClient = client ?? createTestQueryClient()
  return {
    queryClient,
    ...renderHook(callback, { wrapper: withQueryClient(queryClient), ...options }),
  }
}
