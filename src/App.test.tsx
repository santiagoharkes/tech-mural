import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { screen, waitFor, within } from '@testing-library/react'
import { server } from '@/mocks/server'
import { renderWithClient } from '@/test/utils'
import App from './App'

describe('App', () => {
  it('renders the product title as the top-level heading', () => {
    renderWithClient(<App />)
    expect(
      screen.getByRole('heading', { level: 1, name: /board activity explorer/i }),
    ).toBeInTheDocument()
  })

  it('pairs the header summary with the rendered notes once loaded', async () => {
    renderWithClient(<App />)

    // Header announces pending state immediately.
    expect(screen.getByTestId('board-summary')).toHaveTextContent(/loading/i)

    // Board paints its skeleton while the query resolves.
    expect(screen.getByTestId('note-board-skeleton')).toBeInTheDocument()

    // After the fetch resolves, header and board report the same totals.
    const summary = await screen.findByTestId('board-summary')
    await screen.findByTestId('note-board')
    expect(summary).toHaveTextContent(/200/)
    expect(summary).toHaveTextContent(/8/)
  })

  it('falls back to an offline header marker when the API fails', async () => {
    server.use(http.get('/api/notes', () => HttpResponse.json(null, { status: 500 })))
    renderWithClient(<App />)

    const summary = screen.getByTestId('board-summary')
    await waitFor(() => expect(summary).toHaveTextContent(/offline/i))

    const error = await screen.findByTestId('note-board-error')
    expect(within(error).getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})
