import { describe, it, expect } from 'vitest'
import { isNoteVisible, NOTE_CARD_WIDTH, VIEWPORT_PADDING } from './viewport-culling'

const VIEWPORT = { width: 1000, height: 600 }
const ORIGIN = { x: 0, y: 0 }

describe('isNoteVisible', () => {
  it('includes notes fully inside the viewport', () => {
    expect(isNoteVisible({ x: 100, y: 100 }, ORIGIN, VIEWPORT)).toBe(true)
  })

  it('excludes notes far outside the viewport', () => {
    expect(isNoteVisible({ x: 3000, y: 3000 }, ORIGIN, VIEWPORT)).toBe(false)
  })

  it('follows the pan — a note becomes visible once you pan toward it', () => {
    const note = { x: 2000, y: 200 }
    expect(isNoteVisible(note, { x: 0, y: 0 }, VIEWPORT)).toBe(false)
    expect(isNoteVisible(note, { x: -1800, y: 0 }, VIEWPORT)).toBe(true)
  })

  it('keeps notes that overlap the edge of the viewport', () => {
    // Note just past the right edge of the viewport, still within padding.
    const note = { x: VIEWPORT.width, y: 100 }
    expect(isNoteVisible(note, ORIGIN, VIEWPORT)).toBe(true)
  })

  it('drops notes beyond the padding buffer', () => {
    const wayPastEdge = { x: VIEWPORT.width + VIEWPORT_PADDING + NOTE_CARD_WIDTH + 10, y: 100 }
    expect(isNoteVisible(wayPastEdge, ORIGIN, VIEWPORT)).toBe(false)
  })

  it('respects scale — zooming out reveals notes that were previously off-screen', () => {
    const note = { x: 1500, y: 400 }
    expect(isNoteVisible(note, ORIGIN, VIEWPORT, 1)).toBe(false)
    expect(isNoteVisible(note, ORIGIN, VIEWPORT, 0.5)).toBe(true)
  })

  it('respects scale — zooming in hides notes that no longer fit', () => {
    const note = { x: 900, y: 100 }
    expect(isNoteVisible(note, ORIGIN, VIEWPORT, 1)).toBe(true)
    expect(isNoteVisible(note, ORIGIN, VIEWPORT, 2)).toBe(false)
  })
})
