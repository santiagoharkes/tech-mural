import type { Note } from '@/features/notes/types'

/** Note card dimensions in CSS pixels — must stay aligned with `NoteCard` Tailwind classes. */
export const NOTE_CARD_WIDTH = 176 // w-44
export const NOTE_CARD_HEIGHT = 128 // text + footer, approximate

/**
 * Render notes slightly outside the strict viewport so that a fast pan does
 * not expose bare canvas at the edges before the next cull pass runs.
 */
export const VIEWPORT_PADDING = 240

export interface Viewport {
  width: number
  height: number
}

export interface PanOffset {
  x: number
  y: number
}

/**
 * Is the given note's bounding box inside the viewport, taking the current
 * pan offset and a soft padding into account?
 *
 * The spatial board lives in "canvas space"; pan translates the inner layer
 * by `(offset.x, offset.y)`. A note at canvas `(x, y)` is visually at
 * `(x + offset.x, y + offset.y)`. The viewport covers screen space
 * `[0, width] × [0, height]`, which maps back to canvas space
 * `[-offset.x, -offset.x + width] × [-offset.y, -offset.y + height]`.
 */
export function isNoteVisible(
  note: Pick<Note, 'x' | 'y'>,
  offset: PanOffset,
  viewport: Viewport,
  padding: number = VIEWPORT_PADDING,
): boolean {
  const left = -offset.x - padding
  const right = -offset.x + viewport.width + padding
  const top = -offset.y - padding
  const bottom = -offset.y + viewport.height + padding

  return (
    note.x + NOTE_CARD_WIDTH >= left &&
    note.x <= right &&
    note.y + NOTE_CARD_HEIGHT >= top &&
    note.y <= bottom
  )
}
