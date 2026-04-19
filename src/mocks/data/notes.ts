import {
  NOTE_COLORS,
  type Author,
  type Note,
  type NoteColor,
  type NotesResponse,
} from '@/features/notes/types'

/**
 * Deterministic dataset for the mock API.
 *
 * Why deterministic: tests assert counts, ordering, and "recent" windows. A
 * randomly-seeded dataset would make those assertions flaky. A PRNG with a
 * fixed seed gives us realistic-looking variety while keeping every run
 * identical. See `notes.test.ts` for the guarantee.
 */

// Mulberry32 — small, fast, good-enough PRNG for fixture generation.
// https://en.wikipedia.org/wiki/Permuted_congruential_generator for alternatives.
function mulberry32(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const AUTHORS: Author[] = [
  { id: 'user_1', name: 'Ada Lovelace' },
  { id: 'user_2', name: 'Grace Hopper' },
  { id: 'user_3', name: 'Alan Turing' },
  { id: 'user_4', name: 'Katherine Johnson' },
  { id: 'user_5', name: 'Linus Torvalds' },
  { id: 'user_6', name: 'Margaret Hamilton' },
  { id: 'user_7', name: 'Edsger Dijkstra' },
  { id: 'user_8', name: 'Radia Perlman' },
]

// Workshop-flavoured prompts, a mix of problems, ideas, and observations — the
// kind of things a real team would drop on a retro / discovery board.
const SENTENCES = [
  'Login flow is confusing',
  'Add SSO for enterprise tenants',
  'Onboarding tooltip blocks the primary CTA',
  'Mobile nav collapses too aggressively',
  'Users skip the empty state copy',
  'Bulk actions save meaningful time',
  'Error messages swallow backend detail',
  'Dashboard loads feel slow above the fold',
  'Keyboard shortcuts are undiscoverable',
  'Dark mode should persist across tabs',
  'Invite link expires too quickly',
  'Board duplication is a top request',
  'Sticky notes need markdown support',
  'Search ignores archived items',
  'Notifications are too noisy by default',
  'Export to CSV mislabels the header row',
  'Row selection resets after paging',
  'Drag handle is not obvious on touch',
  'Settings page has inconsistent spacing',
  'Feedback form lacks a success confirmation',
  'Undo history only lasts one action',
  'Modal traps focus incorrectly on Firefox',
  'Tooltips overflow the viewport on small screens',
  'API rate limits surprise power users',
  'Avatars do not update after a name change',
  'Sort order silently resets between visits',
  'Workspace switcher hides the current workspace',
  'Hover states flicker on Retina displays',
  'Billing receipts omit VAT on EU invoices',
  'Date picker ignores locale preferences',
]

export interface DatasetOptions {
  seed?: number
  count?: number
  /** The spatial area notes are scattered across. */
  canvas?: { width: number; height: number }
  /** How far back in time notes may have been created, in days. */
  daysOfHistory?: number
  /** Fixed "now" to keep `createdAt` distribution stable in tests. */
  now?: Date
}

const DEFAULTS = {
  seed: 20260419,
  count: 200,
  canvas: { width: 4000, height: 3000 },
  daysOfHistory: 7,
  now: new Date('2026-04-19T12:00:00.000Z'),
} as const

/**
 * Generate a deterministic dataset. Called once at module load to produce the
 * `NOTES_FIXTURE` constant that the MSW handler serves.
 */
export function generateNotes(options: DatasetOptions = {}): NotesResponse {
  const {
    seed = DEFAULTS.seed,
    count = DEFAULTS.count,
    canvas = DEFAULTS.canvas,
    daysOfHistory = DEFAULTS.daysOfHistory,
    now = DEFAULTS.now,
  } = options

  const rand = mulberry32(seed)
  const nowMs = now.getTime()
  const historyMs = daysOfHistory * 24 * 60 * 60 * 1000

  // Notes are slightly concentrated in the last ~36 h so the "recent" highlight
  // has something meaningful to show in Stage 5. We square the [0, 1) value
  // to bias toward smaller values, then map to the [now - history, now] window.
  const recencyBias = (u: number) => u ** 2

  const notes: Note[] = Array.from({ length: count }, (_, i) => {
    const author = AUTHORS[Math.floor(rand() * AUTHORS.length)]!
    const color = NOTE_COLORS[Math.floor(rand() * NOTE_COLORS.length)]! as NoteColor
    const sentence = SENTENCES[Math.floor(rand() * SENTENCES.length)]!

    const x = Math.round(rand() * canvas.width)
    const y = Math.round(rand() * canvas.height)

    const agedMs = recencyBias(rand()) * historyMs
    const createdAt = new Date(nowMs - agedMs).toISOString()

    return {
      id: `note_${String(i + 1).padStart(4, '0')}`,
      text: sentence,
      x,
      y,
      author: author.id,
      color,
      createdAt,
    }
  })

  return { notes, authors: AUTHORS }
}

/** Materialised dataset used by the MSW handler. */
export const NOTES_FIXTURE = generateNotes()
