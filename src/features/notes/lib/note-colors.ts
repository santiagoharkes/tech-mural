import type { NoteColor } from '@/features/notes/types'

/**
 * Visual palette for sticky notes.
 *
 * Kept in one place so the palette is a single search-and-replace away from
 * being re-themed. We map every domain color to a Tailwind triple (surface,
 * border, foreground) rather than inlining Tailwind classes at call sites —
 * this lets `NoteCard` stay colorblind to the mapping and gives us one test
 * target if the palette changes.
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
    surface: 'bg-yellow-100',
    border: 'border-yellow-300/70',
    foreground: 'text-yellow-950',
    accent: 'text-yellow-800',
  },
  pink: {
    surface: 'bg-pink-100',
    border: 'border-pink-300/70',
    foreground: 'text-pink-950',
    accent: 'text-pink-800',
  },
  blue: {
    surface: 'bg-sky-100',
    border: 'border-sky-300/70',
    foreground: 'text-sky-950',
    accent: 'text-sky-800',
  },
  green: {
    surface: 'bg-emerald-100',
    border: 'border-emerald-300/70',
    foreground: 'text-emerald-950',
    accent: 'text-emerald-800',
  },
  purple: {
    surface: 'bg-violet-100',
    border: 'border-violet-300/70',
    foreground: 'text-violet-950',
    accent: 'text-violet-800',
  },
  orange: {
    surface: 'bg-orange-100',
    border: 'border-orange-300/70',
    foreground: 'text-orange-950',
    accent: 'text-orange-800',
  },
}

export function noteColorClasses(color: NoteColor): string {
  const palette = NOTE_COLOR_PALETTE[color]
  return `${palette.surface} ${palette.border} ${palette.foreground}`
}
