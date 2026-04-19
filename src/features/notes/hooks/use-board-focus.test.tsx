import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { ReactNode } from 'react'
import { useBoardFocus } from './use-board-focus'

function wrap(searchParams = '') {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <NuqsTestingAdapter searchParams={searchParams}>{children}</NuqsTestingAdapter>
  }
}

describe('useBoardFocus', () => {
  it('returns null when no focus param is set', () => {
    const { result } = renderHook(() => useBoardFocus(), { wrapper: wrap() })
    expect(result.current.focus).toBeNull()
  })

  it('hydrates the focus id from the URL', () => {
    const { result } = renderHook(() => useBoardFocus(), {
      wrapper: wrap('?focus=note_0042'),
    })
    expect(result.current.focus).toBe('note_0042')
  })

  it('setFocus writes the id into the URL state', () => {
    const { result } = renderHook(() => useBoardFocus(), { wrapper: wrap() })
    act(() => void result.current.setFocus('note_0007'))
    expect(result.current.focus).toBe('note_0007')
  })

  it('clear removes the focus param', () => {
    const { result } = renderHook(() => useBoardFocus(), {
      wrapper: wrap('?focus=note_0042'),
    })
    act(() => result.current.clear())
    expect(result.current.focus).toBeNull()
  })
})
