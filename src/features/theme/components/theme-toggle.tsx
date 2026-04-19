import { Moon, Monitor, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCycleTheme, useTheme, type Theme } from '@/features/theme/store'

const ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const NEXT_LABEL: Record<Theme, string> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

/**
 * Cycles the theme preference on each click: light → dark → system → light.
 * Icon reflects the current mode; `aria-label` spells out the next state so
 * screen-reader users know what activating the button will do.
 */
export function ThemeToggle() {
  const theme = useTheme()
  const cycle = useCycleTheme()
  const Icon = ICONS[theme]

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={cycle}
      data-testid="theme-toggle"
      data-theme={theme}
      aria-label={`Theme: ${theme}. Switch to ${NEXT_LABEL[theme]}.`}
    >
      <Icon className="size-4" aria-hidden />
    </Button>
  )
}
