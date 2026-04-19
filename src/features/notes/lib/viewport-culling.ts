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
 * pan offset, scale, and a soft padding into account?
 *
 * The spatial board lives in "canvas space"; the transform applied to the
 * inner layer is `translate(offset) scale(scale)`. A point `(x_c, y_c)` in
 * canvas space lands on screen at `(x_c * scale + offset.x, y_c * scale + offset.y)`.
 * The viewport covers screen space `[0, width] × [0, height]`, which maps
 * back to canvas space
 * `[-offset.x / scale, (width - offset.x) / scale] × [-offset.y / scale, (height - offset.y) / scale]`.
 * `padding` is expressed in screen pixels and converted to canvas space by
 * dividing by `scale` — the further you zoom out, the more canvas the
 * padding covers.
 */
export function isNoteVisible(
  note: Pick<Note, 'x' | 'y'>,
  offset: PanOffset,
  viewport: Viewport,
  scale: number = 1,
  padding: number = VIEWPORT_PADDING,
): boolean {
  const leftCanvas = (-offset.x - padding) / scale
  const rightCanvas = (viewport.width - offset.x + padding) / scale
  const topCanvas = (-offset.y - padding) / scale
  const bottomCanvas = (viewport.height - offset.y + padding) / scale

  return (
    note.x + NOTE_CARD_WIDTH >= leftCanvas &&
    note.x <= rightCanvas &&
    note.y + NOTE_CARD_HEIGHT >= topCanvas &&
    note.y <= bottomCanvas
  )
}
