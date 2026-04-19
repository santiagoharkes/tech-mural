import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { ReactNode } from 'react'
import { useBoardSort } from './use-board-sort'

function wrap(searchParams = '') {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <NuqsTestingAdapter searchParams={searchParams}>{children}</NuqsTestingAdapter>
  }
}

describe('useBoardSort', () => {
  it('defaults to "recent" when no URL param is set', () => {
    const { result } = renderHook(() => useBoardSort(), { wrapper: wrap() })
    expect(result.current.sortBy).toBe('recent')
  })

  it('hydrates a valid option from the URL', () => {
    const { result } = renderHook(() => useBoardSort(), { wrapper: wrap('?sort=author') })
    expect(result.current.sortBy).toBe('author')
  })

  it('falls back to the default when the URL holds an unknown value', () => {
    const { result } = renderHook(() => useBoardSort(), { wrapper: wrap('?sort=bogus') })
    expect(result.current.sortBy).toBe('recent')
  })

  it('updates via setSortBy', () => {
    const { result } = renderHook(() => useBoardSort(), { wrapper: wrap() })
    act(() => void result.current.setSortBy('oldest'))
    expect(result.current.sortBy).toBe('oldest')
  })
})
