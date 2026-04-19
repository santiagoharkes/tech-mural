import { describe, it, expect } from 'vitest'
import { centerOnNote } from './center-on-note'
import { NOTE_CARD_HEIGHT, NOTE_CARD_WIDTH } from './viewport-culling'

describe('centerOnNote', () => {
  it('centres a note at the origin inside a given viewport', () => {
    const viewport = { width: 1000, height: 600 }
    const offset = centerOnNote({ x: 0, y: 0 }, viewport)
    // Visual centre of the note: (NOTE_CARD_WIDTH/2 + offset.x, NOTE_CARD_HEIGHT/2 + offset.y)
    const cx = NOTE_CARD_WIDTH / 2 + offset.x
    const cy = NOTE_CARD_HEIGHT / 2 + offset.y
    expect(cx).toBe(viewport.width / 2)
    expect(cy).toBe(viewport.height / 2)
  })

  it('centres a note deep in canvas space', () => {
    const viewport = { width: 1200, height: 800 }
    const note = { x: 3000, y: 1800 }
    const offset = centerOnNote(note, viewport)
    expect(note.x + NOTE_CARD_WIDTH / 2 + offset.x).toBe(viewport.width / 2)
    expect(note.y + NOTE_CARD_HEIGHT / 2 + offset.y).toBe(viewport.height / 2)
  })
})
