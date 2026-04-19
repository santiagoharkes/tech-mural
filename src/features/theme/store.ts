import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const THEMES = ['light', 'dark', 'system'] as const
export type Theme = (typeof THEMES)[number]

export const DEFAULT_THEME: Theme = 'system'

interface ThemeSlice {
  theme: Theme
  setTheme: (theme: Theme) => void
  cycleTheme: () => void
}

const ORDER: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

/**
 * Theme preference lives per-browser, so it belongs in Zustand (with the
 * `persist` middleware writing through to localStorage) rather than on the
 * URL. Same rationale as the view-mode store: two people sharing the same
 * link may legitimately want different render modes.
 *
 * `'system'` is the default on first load so users arrive at an OS-matching
 * theme without explicit opt-in. The selection survives reloads.
 */
export const useThemeStore = create<ThemeSlice>()(
  persist(
    (set, get) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme }),
      cycleTheme: () => set({ theme: ORDER[get().theme] }),
    }),
    {
      name: 'tech-mural:theme',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)

export const useTheme = () => useThemeStore((state) => state.theme)
export const useSetTheme = () => useThemeStore((state) => state.setTheme)
export const useCycleTheme = () => useThemeStore((state) => state.cycleTheme)
