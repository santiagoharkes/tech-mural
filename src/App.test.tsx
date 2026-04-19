import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
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

  it('shows a loading status, then the loaded summary', async () => {
    renderWithClient(<App />)

    expect(screen.getByRole('status')).toHaveTextContent(/loading/i)

    const summary = await screen.findByTestId('board-summary')
    expect(summary).toHaveTextContent(/200/)
    expect(summary).toHaveTextContent(/8/)
  })

  it('shows an error state with a retry action when the API fails', async () => {
    server.use(http.get('/api/notes', () => HttpResponse.json(null, { status: 500 })))
    renderWithClient(<App />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/could not load notes/i)
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})
