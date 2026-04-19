import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** Node-land MSW server used by Vitest. Lifecycle is managed in `test/setup.ts`. */
export const server = setupServer(...handlers)
