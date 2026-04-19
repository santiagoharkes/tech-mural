const RELATIVE_TIME_THRESHOLDS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: 'minute', ms: 60_000 },
  { unit: 'hour', ms: 3_600_000 },
  { unit: 'day', ms: 86_400_000 },
  { unit: 'week', ms: 604_800_000 },
  { unit: 'month', ms: 2_592_000_000 },
  { unit: 'year', ms: 31_536_000_000 },
]

const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/**
 * Render a date as "3 minutes ago" / "yesterday" / "in 2 hours" using the
 * platform's `Intl.RelativeTimeFormat`. Accepting `now` as an argument keeps
 * the function pure and the tests deterministic.
 *
 * Floor is the minute: anything under 60 s reads as "now". Workshop-scale
 * timestamps do not benefit from second-level granularity and it is
 * distracting to see labels tick while the UI is idle.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = new Date(iso).getTime() - now.getTime()
  const absMs = Math.abs(diffMs)

  if (absMs < RELATIVE_TIME_THRESHOLDS[0]!.ms) {
    return formatter.format(0, 'second')
  }

  let chosen = RELATIVE_TIME_THRESHOLDS[0]!
  for (const threshold of RELATIVE_TIME_THRESHOLDS) {
    if (absMs >= threshold.ms) chosen = threshold
  }

  const value = Math.round(diffMs / chosen.ms)
  return formatter.format(value, chosen.unit)
}
