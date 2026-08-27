/**
 * Bookmark Detail share action (Interaction §8 Navigation): prefer the browser's
 * native `navigator.share`; fall back to copying the link when the API is not
 * supported. This is Phase 1 Web only — Web Share Target (receiving shares) stays
 * closed per DECISION_LOG.md 2026-08-27 Decision 1 and is not reopened here.
 */
export type ShareResult = 'shared' | 'cancelled' | 'copied' | 'failed'

export interface ShareBookmarkInput {
  title: string
  url: string
}

export async function shareBookmark({ title, url }: ShareBookmarkInput): Promise<ShareResult> {
  const shareFn = (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share

  if (typeof shareFn === 'function') {
    try {
      await shareFn.call(navigator, { title, url })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled'
      }
      return 'failed'
    }
  }

  const clipboard = navigator.clipboard
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      await clipboard.writeText(url)
      return 'copied'
    } catch {
      return 'failed'
    }
  }

  return 'failed'
}
