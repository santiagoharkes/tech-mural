import { useEffect, useRef, useState, type RefObject } from 'react'

export interface ElementSize {
  width: number
  height: number
}

/**
 * Tracks an element's content-box size via `ResizeObserver`.
 *
 * Initial value is `{ width: 0, height: 0 }`. Consumers that drive expensive
 * derivations (viewport culling, virtualisation) should treat zero as "not
 * yet measured" and avoid computing against it — rendering everything once
 * costs less than computing a culling result against bogus bounds.
 */
export function useElementSize<T extends HTMLElement>(): [RefObject<T | null>, ElementSize] {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const box = entry.contentRect
      setSize((previous) =>
        previous.width === box.width && previous.height === box.height
          ? previous
          : { width: box.width, height: box.height },
      )
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, size]
}
