import { beforeEach, describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  DEFAULT_VIEW_MODE,
  useSetViewMode,
  useToggleViewMode,
  useViewMode,
  useViewModeStore,
} from './store'

describe('view-mode store', () => {
  beforeEach(() => {
    useViewModeStore.setState({ viewMode: DEFAULT_VIEW_MODE })
    localStorage.clear()
  })

  it('exposes the default mode on first read', () => {
    const { result } = renderHook(() => useViewMode())
    expect(result.current).toBe(DEFAULT_VIEW_MODE)
  })

  it('setViewMode replaces the current mode', () => {
    const set = renderHook(() => useSetViewMode()).result.current
    act(() => set('list'))
    expect(useViewModeStore.getState().viewMode).toBe('list')
  })

  it('toggleViewMode flips between board and list', () => {
    const toggle = renderHook(() => useToggleViewMode()).result.current
    act(() => toggle())
    expect(useViewModeStore.getState().viewMode).toBe('list')
    act(() => toggle())
    expect(useViewModeStore.getState().viewMode).toBe('board')
  })

  it('persists the mode to localStorage', () => {
    act(() => useViewModeStore.getState().setViewMode('list'))
    const stored = JSON.parse(localStorage.getItem('tech-mural:view-mode') ?? '{}')
    expect(stored?.state?.viewMode).toBe('list')
  })
})
