import { http, HttpResponse, delay } from 'msw'
import { NOTES_FIXTURE } from './data/notes'

/**
 * MSW request handlers. These are the single source of truth for the mock API
 * surface and are shared between the browser worker (dev / prod build) and the
 * node server (unit & integration tests). When a real backend arrives, this
 * file is the only thing that needs to go.
 */
export const handlers = [
  http.get('/api/notes', async () => {
    // A small, predictable delay so the UI exercises loading states. Tests can
    // override this handler via `server.use(...)` when they want instant data.
    await delay(150)
    return HttpResponse.json(NOTES_FIXTURE)
  }),
]
