/**
 * Shared text normalization for Tag duplicate detection and Search matching
 * (Technical Architecture Proposal §9.2; Decision Closure P1-C2b Decision 1/4).
 * Both features must normalize the same way — trim, NFKC, case-insensitive —
 * or a Tag that dedupes one way could fail to be found the other way. Keep this
 * the single source of normalization instead of maintaining two copies.
 */

/** Trim + NFKC + lowercase, for both Tag dedupe keys and Search text comparison. */
export function normalizeForCompare(input: string): string {
  return input.trim().normalize('NFKC').toLowerCase()
}

/** Strips a leading URL scheme (e.g. `https://`) so `example.com` matches `https://example.com/a`. */
export function stripUrlScheme(input: string): string {
  return input.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
}

/** True if `haystack` contains `needle` after trim/NFKC/case-fold normalization. */
export function normalizedIncludes(haystack: string, needle: string): boolean {
  const key = normalizeForCompare(needle)
  if (key.length === 0) return false
  return normalizeForCompare(haystack).includes(key)
}

/** Same as `normalizedIncludes`, but also strips the URL scheme from both sides first. */
export function normalizedUrlIncludes(haystack: string, needle: string): boolean {
  return normalizedIncludes(stripUrlScheme(haystack), stripUrlScheme(needle))
}
