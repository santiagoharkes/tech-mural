import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const VIEW_MODES = ['board', 'list'] as const
export type ViewMode = (typeof VIEW_MODES)[number]

export const DEFAULT_VIEW_MODE: ViewMode = 'board'

interface ViewModeSlice {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  toggleViewMode: () => void
}

/**
 * View mode ("board" vs "list") is a per-browser preference rather than user
 * intent, so Zustand with `persist` (localStorage) is the right fit — not the
 * URL. The URL stays focused on what is shareable: filters and sort.
 *
 * The store is structured as a slice so additional transient UI state
 * (open-panels, selected-note, hover-highlights) can compose in later without
 * re-architecting.
 */
export const useViewModeStore = create<ViewModeSlice>()(
  persist(
    (set, get) => ({
      viewMode: DEFAULT_VIEW_MODE,
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleViewMode: () => set({ viewMode: get().viewMode === 'board' ? 'list' : 'board' }),
    }),
    {
      name: 'tech-mural:view-mode',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)

/** Hook forms — narrow subscriptions so toggling doesn't re-render consumers of the setter. */
export const useViewMode = () => useViewModeStore((state) => state.viewMode)
export const useSetViewMode = () => useViewModeStore((state) => state.setViewMode)
export const useToggleViewMode = () => useViewModeStore((state) => state.toggleViewMode)
