import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { ReactNode } from 'react'
import { useBoardFilters } from './use-board-filters'

function wrap(searchParams = '') {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <NuqsTestingAdapter searchParams={searchParams}>{children}</NuqsTestingAdapter>
  }
}

describe('useBoardFilters', () => {
  it('starts empty when no URL params are present', () => {
    const { result } = renderHook(() => useBoardFilters(), { wrapper: wrap() })
    expect(result.current.filters).toEqual({ authors: [], colors: [] })
    expect(result.current.activeCount).toBe(0)
  })

  it('hydrates filters from the URL', () => {
    const { result } = renderHook(() => useBoardFilters(), {
      wrapper: wrap('?authors=user_1,user_2&colors=yellow,pink'),
    })
    expect(result.current.filters.authors).toEqual(['user_1', 'user_2'])
    expect(result.current.filters.colors).toEqual(['yellow', 'pink'])
    expect(result.current.activeCount).toBe(4)
  })

  it('discards unknown colors on hydration', () => {
    const { result } = renderHook(() => useBoardFilters(), {
      wrapper: wrap('?colors=yellow,neon'),
    })
    expect(result.current.filters.colors).toEqual(['yellow'])
  })

  it('toggleAuthor adds and removes an author', () => {
    const { result } = renderHook(() => useBoardFilters(), { wrapper: wrap() })

    act(() => result.current.toggleAuthor('user_1'))
    expect(result.current.filters.authors).toEqual(['user_1'])

    act(() => result.current.toggleAuthor('user_2'))
    expect(result.current.filters.authors).toEqual(['user_1', 'user_2'])

    act(() => result.current.toggleAuthor('user_1'))
    expect(result.current.filters.authors).toEqual(['user_2'])
  })

  it('toggleColor round-trips', () => {
    const { result } = renderHook(() => useBoardFilters(), { wrapper: wrap() })
    act(() => result.current.toggleColor('yellow'))
    expect(result.current.filters.colors).toEqual(['yellow'])
    act(() => result.current.toggleColor('yellow'))
    expect(result.current.filters.colors).toEqual([])
  })

  it('clear resets both dimensions', () => {
    const { result } = renderHook(() => useBoardFilters(), {
      wrapper: wrap('?authors=user_1&colors=yellow'),
    })
    act(() => result.current.clear())
    expect(result.current.filters).toEqual({ authors: [], colors: [] })
    expect(result.current.activeCount).toBe(0)
  })
})
