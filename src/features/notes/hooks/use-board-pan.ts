import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

export interface Offset {
  x: number
  y: number
}

export interface Transform {
  x: number
  y: number
  scale: number
}

export const MIN_SCALE = 0.3
export const MAX_SCALE = 3
export const DEFAULT_SCALE = 1

export interface UseBoardPanReturn {
  offset: Offset
  scale: number
  isPanning: boolean
  bind: {
    onPointerDown: (event: PointerEvent<HTMLElement>) => void
  }
  /** Reset pan (and scale) to the initial state. */
  reset: () => void
  /** Increment the current offset by a delta in screen pixels. */
  panBy: (dx: number, dy: number) => void
  /** Replace the offset outright. Used to centre the canvas on a specific note. */
  setOffset: (offset: Offset) => void
  /**
   * Multiplicative zoom. If `center` is provided (screen coords relative to
   * the board container), the point under that cursor stays fixed — the
   * canonical "zoom to cursor" behaviour of Figma, Miro, etc. Clamped to
   * `[MIN_SCALE, MAX_SCALE]`.
   */
  zoomBy: (factor: number, center?: Offset) => void
  /** Restore zoom to `1` while keeping the current pan. */
  resetZoom: () => void
}

const NO_PAN_SELECTOR = '[data-no-pan]'

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/**
 * Combined pan + zoom state for the spatial canvas.
 *
 * The transform is `translate(offset) * scale(scale)` — pan values are in
 * screen-space pixels, scale is a multiplier. Pointer drag updates `offset`;
 * mouse-wheel updates `scale` around the cursor; keyboard pans by a fixed
 * screen-space step regardless of zoom, which matches user intuition on a
 * canvas ("ArrowRight moves the view right by the same amount no matter how
 * zoomed in I am").
 *
 * `window`-level pointer listeners during drag keep the pan alive even when
 * the cursor leaves the element — we do not rely on `setPointerCapture`
 * (jsdom does not implement it) so the whole surface is unit-testable.
 */
export function useBoardPan(
  initial: Transform = { x: 0, y: 0, scale: DEFAULT_SCALE },
): UseBoardPanReturn {
  const [transform, setTransform] = useState<Transform>(initial)
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
        originX: transform.x,
        originY: transform.y,
      }
      setIsPanning(true)
    },
    [transform.x, transform.y],
  )

  useEffect(() => {
    if (!isPanning) return

    const handleMove = (event: globalThis.PointerEvent) => {
      const origin = dragOrigin.current
      if (!origin) return
      setTransform((prev) => ({
        ...prev,
        x: origin.originX + (event.clientX - origin.startX),
        y: origin.originY + (event.clientY - origin.startY),
      }))
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

  const reset = useCallback(() => setTransform(initial), [initial])

  const panBy = useCallback((dx: number, dy: number) => {
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
  }, [])

  const setOffsetTo = useCallback((next: Offset) => {
    setTransform((prev) => ({ ...prev, x: next.x, y: next.y }))
  }, [])

  const zoomBy = useCallback((factor: number, center?: Offset) => {
    setTransform((prev) => {
      const nextScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE)
      if (nextScale === prev.scale) return prev
      if (!center) return { ...prev, scale: nextScale }
      // Zoom around a screen-space point. The canvas-space point under the
      // cursor before the zoom should still be under the cursor after.
      const canvasX = (center.x - prev.x) / prev.scale
      const canvasY = (center.y - prev.y) / prev.scale
      return {
        x: center.x - canvasX * nextScale,
        y: center.y - canvasY * nextScale,
        scale: nextScale,
      }
    })
  }, [])

  const resetZoom = useCallback(() => {
    setTransform((prev) => ({ ...prev, scale: DEFAULT_SCALE }))
  }, [])

  return {
    offset: { x: transform.x, y: transform.y },
    scale: transform.scale,
    isPanning,
    bind: { onPointerDown },
    reset,
    panBy,
    setOffset: setOffsetTo,
    zoomBy,
    resetZoom,
  }
}
