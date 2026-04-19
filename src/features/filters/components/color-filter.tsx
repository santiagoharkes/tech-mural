import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { NOTE_COLORS, type NoteColor } from '@/features/notes/types'
import { ColorDot } from './color-dot'

export interface ColorFilterProps {
  selected: readonly NoteColor[]
  counts: Map<NoteColor, number>
  onToggle: (color: NoteColor) => void
}

export function ColorFilter({ selected, counts, onToggle }: ColorFilterProps) {
  const selectedSet = new Set(selected)

  return (
    <fieldset className="space-y-2" data-testid="color-filter">
      <legend className="text-foreground text-sm font-medium">By color</legend>
      <ul className="space-y-1.5">
        {NOTE_COLORS.map((color) => {
          const id = `color-${color}`
          const checked = selectedSet.has(color)
          const count = counts.get(color) ?? 0
          return (
            <li key={color} className="flex items-center gap-2">
              <Checkbox id={id} checked={checked} onCheckedChange={() => onToggle(color)} />
              <Label
                htmlFor={id}
                className="flex flex-1 cursor-pointer items-center justify-between gap-2 text-sm font-normal capitalize"
              >
                <span className="flex items-center gap-2">
                  <ColorDot color={color} />
                  {color}
                </span>
                <span className="text-muted-foreground tabular-nums">{count}</span>
              </Label>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
