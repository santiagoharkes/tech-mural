import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

/** Service-worker-based MSW instance. Started from `main.tsx` before render. */
export const worker = setupWorker(...handlers)
