import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Note } from '@/features/notes/types'
import { NoteCard } from './note-card'

const NOTE: Note = {
  id: 'note_0001',
  text: 'Login flow is confusing',
  x: 100,
  y: 200,
  author: 'user_1',
  color: 'yellow',
  createdAt: '2026-04-19T10:00:00Z',
}

const NOW = new Date('2026-04-19T12:00:00Z')

describe('<NoteCard />', () => {
  it('exposes the note text as its accessible name', () => {
    render(<NoteCard note={NOTE} authorName="Ada Lovelace" now={NOW} />)
    expect(screen.getByRole('article', { name: /login flow is confusing/i })).toBeInTheDocument()
  })

  it('renders the author display name, not the raw id', () => {
    render(<NoteCard note={NOTE} authorName="Ada Lovelace" now={NOW} />)
    expect(screen.getByTestId('note-author')).toHaveTextContent('Ada Lovelace')
    expect(screen.queryByText('user_1')).not.toBeInTheDocument()
  })

  it('positions itself at the provided x / y with absolute placement', () => {
    render(<NoteCard note={NOTE} authorName="Ada" now={NOW} />)
    const card = screen.getByRole('article')
    expect(card).toHaveStyle({ left: '100px', top: '200px' })
    expect(card.className).toContain('absolute')
  })

  it('tags its surface with the domain color for downstream styling', () => {
    render(<NoteCard note={NOTE} authorName="Ada" now={NOW} />)
    expect(screen.getByRole('article')).toHaveAttribute('data-color', 'yellow')
  })

  it('renders a <time> element with a machine-readable dateTime', () => {
    render(<NoteCard note={NOTE} authorName="Ada" now={NOW} />)
    const time = screen.getByText(/2 hours ago/i)
    expect(time.tagName).toBe('TIME')
    expect(time).toHaveAttribute('dateTime', '2026-04-19T10:00:00Z')
  })
})
