import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { NuqsAdapter } from 'nuqs/adapters/react'
import './index.css'
import App from './App.tsx'
import { createQueryClient } from './lib/query-client.ts'

const queryClient = createQueryClient()

/**
 * MSW bootstrap — the mock API is the only backend this demo has, so we start
 * the worker before React mounts. Dynamic import keeps MSW out of the initial
 * JS chunk and lets it tree-shake cleanly if we ever swap it for a real API.
 */
async function enableMocking() {
  const { worker } = await import('./mocks/browser.ts')
  return worker.start({
    onUnhandledRequest: 'bypass',
    quiet: !import.meta.env.DEV,
  })
}

void enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <App />
          {import.meta.env.DEV ? <ReactQueryDevtools buttonPosition="bottom-left" /> : null}
        </NuqsAdapter>
      </QueryClientProvider>
    </StrictMode>,
  )
})
