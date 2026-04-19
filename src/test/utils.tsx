import { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions,
} from '@testing-library/react'
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing'

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

export interface ProviderOptions {
  client?: QueryClient
  /** Seed the URL search params (nuqs). */
  searchParams?: string
  /** Observe URL updates (nuqs). */
  onUrlUpdate?: OnUrlUpdateFunction
}

export function withProviders({ client, searchParams, onUrlUpdate }: ProviderOptions = {}) {
  const queryClient = client ?? createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
          {children}
        </NuqsTestingAdapter>
      </QueryClientProvider>
    )
  }
}

export function renderWithClient(
  ui: ReactNode,
  { client, searchParams, onUrlUpdate, ...options }: RenderOptions & ProviderOptions = {},
) {
  const queryClient = client ?? createTestQueryClient()
  return {
    queryClient,
    ...render(ui, {
      wrapper: withProviders({ client: queryClient, searchParams, onUrlUpdate }),
      ...options,
    }),
  }
}

export function renderHookWithClient<TProps, TResult>(
  callback: (props: TProps) => TResult,
  {
    client,
    searchParams,
    onUrlUpdate,
    ...options
  }: RenderHookOptions<TProps> & ProviderOptions = {},
) {
  const queryClient = client ?? createTestQueryClient()
  return {
    queryClient,
    ...renderHook(callback, {
      wrapper: withProviders({ client: queryClient, searchParams, onUrlUpdate }),
      ...options,
    }),
  }
}
