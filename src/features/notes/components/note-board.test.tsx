import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { screen, within } from '@testing-library/react'
import { server } from '@/mocks/server'
import { renderWithClient } from '@/test/utils'
import { NoteBoard } from './note-board'
import type { NotesResponse } from '@/features/notes/types'

describe('<NoteBoard />', () => {
  it('renders a loading skeleton while the query is pending', () => {
    renderWithClient(<NoteBoard />)
    expect(screen.getByTestId('note-board-skeleton')).toBeInTheDocument()
  })

  it('renders every note at its x / y position after load', async () => {
    renderWithClient(<NoteBoard />)

    const board = await screen.findByTestId('note-board')
    const cards = within(board).getAllByTestId('note-card')
    expect(cards).toHaveLength(200)

    // Spot-check: the first note from the deterministic fixture should be
    // positioned via absolute left/top, not via a layout engine.
    const first = cards[0]!
    expect(first.style.position === 'absolute' || first.className.includes('absolute')).toBe(true)
    expect(first.style.left).toMatch(/px$/)
    expect(first.style.top).toMatch(/px$/)
  })

  it('resolves author display names instead of rendering raw ids', async () => {
    renderWithClient(<NoteBoard />)
    const board = await screen.findByTestId('note-board')
    expect(within(board).queryByText('user_1')).not.toBeInTheDocument()
    expect(within(board).getAllByText(/Ada Lovelace/).length).toBeGreaterThan(0)
  })

  it('renders an empty state when the API returns no notes', async () => {
    const empty: NotesResponse = { notes: [], authors: [] }
    server.use(http.get('/api/notes', () => HttpResponse.json(empty)))

    renderWithClient(<NoteBoard />)

    expect(await screen.findByTestId('note-board-empty')).toBeInTheDocument()
  })

  it('renders an error state with a retry button on failure', async () => {
    server.use(http.get('/api/notes', () => HttpResponse.json(null, { status: 500 })))

    renderWithClient(<NoteBoard />)

    const error = await screen.findByTestId('note-board-error')
    expect(error).toHaveTextContent(/could not load notes/i)
    expect(within(error).getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})
