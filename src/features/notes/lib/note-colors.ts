import type { NoteColor } from '@/features/notes/types'

/**
 * Visual palette for sticky notes.
 *
 * Every domain colour maps to four Tailwind utility strings — `surface`,
 * `border`, `foreground`, `accent` — each carrying both a light-mode class
 * and its `dark:` counterpart. Keeping the mapping in one place means the
 * re-theme knob is a single search-and-replace, and `NoteCard` /
 * `NoteListItem` stay colourblind to the token choice.
 *
 * Dark-mode strategy: light scale for the text, a low-opacity deep hue for
 * the surface so the note stays readable on a dark canvas without burning
 * out. Works with `<html class="dark">` which `ThemeSync` toggles based on
 * the user's stored preference.
 */
export interface NoteColorPalette {
  surface: string
  border: string
  foreground: string
  /** Small accent used for the meta chip (author / timestamp). */
  accent: string
}

export const NOTE_COLOR_PALETTE: Record<NoteColor, NoteColorPalette> = {
  yellow: {
    surface: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-300/70 dark:border-yellow-500/40',
    foreground: 'text-yellow-950 dark:text-yellow-100',
    accent: 'text-yellow-800 dark:text-yellow-300',
  },
  pink: {
    surface: 'bg-pink-100 dark:bg-pink-900/30',
    border: 'border-pink-300/70 dark:border-pink-500/40',
    foreground: 'text-pink-950 dark:text-pink-100',
    accent: 'text-pink-800 dark:text-pink-300',
  },
  blue: {
    surface: 'bg-sky-100 dark:bg-sky-900/30',
    border: 'border-sky-300/70 dark:border-sky-500/40',
    foreground: 'text-sky-950 dark:text-sky-100',
    accent: 'text-sky-800 dark:text-sky-300',
  },
  green: {
    surface: 'bg-emerald-100 dark:bg-emerald-900/30',
    border: 'border-emerald-300/70 dark:border-emerald-500/40',
    foreground: 'text-emerald-950 dark:text-emerald-100',
    accent: 'text-emerald-800 dark:text-emerald-300',
  },
  purple: {
    surface: 'bg-violet-100 dark:bg-violet-900/30',
    border: 'border-violet-300/70 dark:border-violet-500/40',
    foreground: 'text-violet-950 dark:text-violet-100',
    accent: 'text-violet-800 dark:text-violet-300',
  },
  orange: {
    surface: 'bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-300/70 dark:border-orange-500/40',
    foreground: 'text-orange-950 dark:text-orange-100',
    accent: 'text-orange-800 dark:text-orange-300',
  },
}

export function noteColorClasses(color: NoteColor): string {
  const palette = NOTE_COLOR_PALETTE[color]
  return `${palette.surface} ${palette.border} ${palette.foreground}`
}
