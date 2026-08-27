import { describe, expect, it } from 'vitest'
import { getDisplayHost } from './url'

describe('getDisplayHost', () => {
  it('extracts the host from a valid URL', () => {
    expect(getDisplayHost('https://example.com/a/b?x=1')).toBe('example.com')
  })

  it('includes a non-default port when present', () => {
    expect(getDisplayHost('https://example.com:8080/a')).toBe('example.com:8080')
  })

  it('returns the original input unchanged if it cannot be parsed as a URL', () => {
    expect(getDisplayHost('not a url')).toBe('not a url')
  })
})
