/**
 * Tag and BookmarkTag domain models.
 * Field set per Developer Handoff §4.3, §4.4.
 * Normalization / dedupe rules are undecided (DEV-I06) and must not be invented here.
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
