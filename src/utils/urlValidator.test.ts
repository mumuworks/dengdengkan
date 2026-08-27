import { describe, expect, it } from 'vitest'
import { isValidUrl, validateUrl } from './urlValidator'

describe('validateUrl', () => {
  it('accepts http URLs', () => {
    expect(validateUrl('http://example.com')).toEqual({
      valid: true,
      normalized: 'http://example.com/',
    })
  })

  it('accepts https URLs', () => {
    expect(validateUrl('https://example.com/path?query=1')).toMatchObject({ valid: true })
  })

  it('trims surrounding whitespace before validating', () => {
    expect(validateUrl('  https://example.com  ')).toMatchObject({ valid: true })
  })

  it('rejects an empty string', () => {
    expect(validateUrl('')).toEqual({ valid: false, reason: 'empty' })
    expect(validateUrl('   ')).toEqual({ valid: false, reason: 'empty' })
  })

  it('rejects javascript: scheme', () => {
    expect(validateUrl('javascript:alert(1)')).toEqual({
      valid: false,
      reason: 'unsupportedScheme',
    })
  })

  it('rejects data: scheme', () => {
    expect(validateUrl('data:text/html,<script>alert(1)</script>')).toEqual({
      valid: false,
      reason: 'unsupportedScheme',
    })
  })

  it('rejects a clearly malformed URL', () => {
    expect(validateUrl('not a url')).toEqual({ valid: false, reason: 'invalidFormat' })
  })

  it('rejects other non-http(s) schemes such as file:', () => {
    expect(validateUrl('file:///etc/passwd')).toEqual({
      valid: false,
      reason: 'unsupportedScheme',
    })
  })
})

describe('isValidUrl', () => {
  it('returns a boolean matching validateUrl().valid', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('')).toBe(false)
  })
})
