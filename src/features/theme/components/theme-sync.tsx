import { useEffect } from 'react'
import { useTheme, type Theme } from '@/features/theme/store'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function resolveDark(theme: Theme): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(DARK_QUERY).matches
}

/**
 * Mounts a `null` component whose sole job is to reflect the store's theme
 * preference onto the `<html>` element. Adds/removes the `dark` class that
 * shadcn's tokens key off (defined in `index.css`).
 *
 * When the user has chosen `'system'`, we also subscribe to
 * `prefers-color-scheme` and re-apply the class when the OS flips. Explicit
 * `'light'` / `'dark'` choices bypass the media-query watcher.
 */
export function ThemeSync() {
  const theme = useTheme()

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolveDark(theme))

    if (
      theme !== 'system' ||
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return
    }
    const media = window.matchMedia(DARK_QUERY)
    const onChange = () => root.classList.toggle('dark', media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  return null
}
