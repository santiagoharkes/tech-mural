/**
 * Domain types for the sticky-note explorer.
 *
 * The shape intentionally mirrors the take-home brief so that a real backend
 * can be plugged in without the UI learning a new contract. Anything that is
 * UI-only (display color for an avatar, initials, etc.) stays out of these
 * types and is derived at the edge.
 */

export const NOTE_COLORS = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange'] as const

export type NoteColor = (typeof NOTE_COLORS)[number]

export type AuthorId = string
export type NoteId = string

/**
 * An author/contributor. In a real product this comes from the auth service
 * and may include avatar URL, email, etc. For the challenge we keep it minimal
 * and derive display affordances (initials, avatar tint) in the UI layer.
 */
export interface Author {
  id: AuthorId
  name: string
}

/**
 * A sticky note contributed to the board. Matches the JSON schema provided in
 * the take-home brief; `createdAt` is ISO-8601 so it sorts lexicographically.
 */
export interface Note {
  id: NoteId
  text: string
  x: number
  y: number
  author: AuthorId
  color: NoteColor
  createdAt: string
}

/**
 * Envelope returned by `GET /api/notes`. Using an envelope (vs. a bare array)
 * leaves room to add metadata — pagination cursors, board identity, last-sync
 * timestamp — without a breaking contract change.
 */
export interface NotesResponse {
  notes: Note[]
  authors: Author[]
}
