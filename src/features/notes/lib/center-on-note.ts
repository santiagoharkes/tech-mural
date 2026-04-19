import type { Note } from '@/features/notes/types'
import { NOTE_CARD_HEIGHT, NOTE_CARD_WIDTH } from './viewport-culling'

export interface Viewport {
  width: number
  height: number
}

export interface Offset {
  x: number
  y: number
}

/**
 * Compute the pan offset that places a note's centre at the centre of the
 * visible viewport.
 *
 * The canvas is laid out in "canvas space"; the visible layer is translated by
 * `offset`. A note at canvas `(x, y)` is visually at `(x + offset.x, y + offset.y)`.
 * We solve for `offset` such that the note's centre aligns with the viewport's
 * centre — standard centre-on-point math, extracted into a pure function so
 * the test does not care about React.
 */
export function centerOnNote(note: Pick<Note, 'x' | 'y'>, viewport: Viewport): Offset {
  return {
    x: viewport.width / 2 - (note.x + NOTE_CARD_WIDTH / 2),
    y: viewport.height / 2 - (note.y + NOTE_CARD_HEIGHT / 2),
  }
}
