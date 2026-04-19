import type { Note } from '@/features/notes/types'
import { NoteListItem } from './note-list-item'

export interface NoteListProps {
  notes: readonly Note[]
  authorMap: ReadonlyMap<string, string>
  /** Shared "now" reference so every item agrees on what "recent" means. */
  now?: Date
}

/**
 * Non-spatial view of the notes. Responsive CSS grid so scanning a long list
 * feels natural on every viewport. `role="list"` is preserved via the native
 * `<ul>` element.
 */
export function NoteList({ notes, authorMap, now }: NoteListProps) {
  return (
    <div className="h-full overflow-y-auto p-6" data-testid="note-list">
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
        {notes.map((note) => (
          <li key={note.id}>
            <NoteListItem
              note={note}
              authorName={authorMap.get(note.author) ?? note.author}
              now={now}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
