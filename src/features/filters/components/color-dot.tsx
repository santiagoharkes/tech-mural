import { cn } from '@/lib/utils'
import { NOTE_COLOR_PALETTE } from '@/features/notes/lib/note-colors'
import type { NoteColor } from '@/features/notes/types'

export interface ColorDotProps {
  color: NoteColor
  className?: string
}

/** Small visual swatch matching a NoteCard's surface + border. */
export function ColorDot({ color, className }: ColorDotProps) {
  const palette = NOTE_COLOR_PALETTE[color]
  return (
    <span
      aria-hidden
      data-testid="color-dot"
      data-color={color}
      className={cn(
        'inline-block h-3 w-3 rounded-full border',
        palette.surface,
        palette.border,
        className,
      )}
    />
  )
}
