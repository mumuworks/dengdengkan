/**
 * Reusable URL validator for the Phase 1 "貼上網址" collection entry point.
 * PRD §9.3 / Technical Architecture Proposal §16: only http/https are acceptable schemes.
 * The actual paste-URL collection UX is P1-C2 scope; this module only validates.
 */

export type UrlValidationFailureReason = 'empty' | 'invalidFormat' | 'unsupportedScheme'

export type UrlValidationResult =
  | { valid: true; normalized: string }
  | { valid: false; reason: UrlValidationFailureReason }

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

export function validateUrl(input: string): UrlValidationResult {
  const trimmed = input.trim()

  if (trimmed.length === 0) {
    return { valid: false, reason: 'empty' }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { valid: false, reason: 'invalidFormat' }
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { valid: false, reason: 'unsupportedScheme' }
  }

  return { valid: true, normalized: parsed.toString() }
}

export function isValidUrl(input: string): boolean {
  return validateUrl(input).valid
}
