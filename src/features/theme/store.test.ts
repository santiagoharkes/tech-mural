import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { DEFAULT_THEME, useCycleTheme, useSetTheme, useTheme, useThemeStore } from './store'

describe('theme store', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: DEFAULT_THEME })
    localStorage.clear()
  })

  it('returns the default on first read', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current).toBe(DEFAULT_THEME)
  })

  it('setTheme replaces the current theme', () => {
    const set = renderHook(() => useSetTheme()).result.current
    act(() => set('dark'))
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('cycleTheme walks light → dark → system → light', () => {
    useThemeStore.setState({ theme: 'light' })
    const cycle = renderHook(() => useCycleTheme()).result.current
    act(() => cycle())
    expect(useThemeStore.getState().theme).toBe('dark')
    act(() => cycle())
    expect(useThemeStore.getState().theme).toBe('system')
    act(() => cycle())
    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('persists the theme to localStorage', () => {
    act(() => useThemeStore.getState().setTheme('dark'))
    const stored = JSON.parse(localStorage.getItem('tech-mural:theme') ?? '{}')
    expect(stored?.state?.theme).toBe('dark')
  })
})
