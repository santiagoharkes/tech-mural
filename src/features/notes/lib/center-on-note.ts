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
 * visible viewport, at the given scale.
 *
 * Canvas transform is `translate(offset) scale(scale)`. Solving for offset
 * such that the note's centre lands at the viewport's centre:
 *
 *   (note.x + W/2) * scale + offset.x = viewport.width / 2
 *
 * At scale=1 this reduces to the simple centring math the reveal-on-board
 * feature started with.
 */
export function centerOnNote(
  note: Pick<Note, 'x' | 'y'>,
  viewport: Viewport,
  scale: number = 1,
): Offset {
  return {
    x: viewport.width / 2 - (note.x + NOTE_CARD_WIDTH / 2) * scale,
    y: viewport.height / 2 - (note.y + NOTE_CARD_HEIGHT / 2) * scale,
  }
}
