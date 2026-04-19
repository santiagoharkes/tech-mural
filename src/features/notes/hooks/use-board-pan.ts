import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

export interface Offset {
  x: number
  y: number
}

export interface UseBoardPanReturn {
  offset: Offset
  isPanning: boolean
  bind: {
    onPointerDown: (event: PointerEvent<HTMLElement>) => void
  }
  /** Reset the pan to its initial offset. Used by the keyboard "Home" shortcut. */
  reset: () => void
  /** Increment the current offset by a delta. Used by arrow-key pan. */
  panBy: (dx: number, dy: number) => void
  /** Replace the offset outright. Used to centre the canvas on a specific note. */
  setOffset: (offset: Offset) => void
}

const NO_PAN_SELECTOR = '[data-no-pan]'

/**
 * Pointer-driven pan for a spatial canvas.
 *
 * Design notes:
 * - The start of a drag snapshots the current offset as an "origin" in a ref.
 *   Every subsequent move updates state relative to that snapshot so the
 *   handler never reads stale React state.
 * - While dragging, `pointermove` / `pointerup` are attached to `window`. That
 *   captures the pointer even if it leaves the element — no need for
 *   `setPointerCapture` (which jsdom does not implement).
 * - Elements with `data-no-pan` (note cards, toolbars) short-circuit the pan so
 *   clicks and focus still work through them.
 */
export function useBoardPan(initial: Offset = { x: 0, y: 0 }): UseBoardPanReturn {
  const [offset, setOffset] = useState<Offset>(initial)
  const [isPanning, setIsPanning] = useState(false)
  const dragOrigin = useRef<{
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return
      const target = event.target as HTMLElement
      if (target.closest(NO_PAN_SELECTOR)) return

      dragOrigin.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: offset.x,
        originY: offset.y,
      }
      setIsPanning(true)
    },
    [offset.x, offset.y],
  )

  useEffect(() => {
    if (!isPanning) return

    const handleMove = (event: globalThis.PointerEvent) => {
      const origin = dragOrigin.current
      if (!origin) return
      setOffset({
        x: origin.originX + (event.clientX - origin.startX),
        y: origin.originY + (event.clientY - origin.startY),
      })
    }

    const handleEnd = () => {
      dragOrigin.current = null
      setIsPanning(false)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleEnd)
    window.addEventListener('pointercancel', handleEnd)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleEnd)
      window.removeEventListener('pointercancel', handleEnd)
    }
  }, [isPanning])

  const reset = useCallback(() => setOffset(initial), [initial])

  const panBy = useCallback((dx: number, dy: number) => {
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
  }, [])

  const setOffsetTo = useCallback((next: Offset) => {
    setOffset(next)
  }, [])

  return {
    offset,
    isPanning,
    bind: { onPointerDown },
    reset,
    panBy,
    setOffset: setOffsetTo,
  }
}
