/**
 * Tag and BookmarkTag domain models.
 * Field set per Developer Handoff §4.3, §4.4. Normalization/dedupe (formerly
 * DEV-I06) is decided for P1-C2b by Decision Closure Decision 1: trim + NFKC +
 * case-insensitive dedupe, preserving the first display name — see
 * `TagRepository.findOrCreate` / `utils/textSearch.ts`. Rename and entity-delete
 * remain out of scope; docs/Developer Handoff still needs updating to close DEV-I06.
 */

export interface Tag {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface BookmarkTag {
  bookmarkId: string
  tagId: string
  createdAt: string
}
