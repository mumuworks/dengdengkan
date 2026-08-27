/**
 * Display-only host extraction for the Metadata fallback chain: `source: og:site_name
 * > host` (Technical Architecture Proposal §6.3). P1-C2a has no metadata fetch
 * service (see Developer Handoff §6.1/§6.3 — deferred), so `source` falls back to
 * this host derivation whenever a bookmark has no resolved `source`.
 */
export function getDisplayHost(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
