import { describe, expect, it } from 'vitest'
import {
  normalizeForCompare,
  normalizedIncludes,
  normalizedUrlIncludes,
  stripUrlScheme,
} from './textSearch'

describe('normalizeForCompare', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeForCompare('  work  ')).toBe('work')
  })

  it('is case-insensitive for ASCII', () => {
    expect(normalizeForCompare('WORK')).toBe(normalizeForCompare('work'))
  })

  it('applies NFKC so fullwidth forms match halfwidth', () => {
    expect(normalizeForCompare('ＷＯＲＫ')).toBe(normalizeForCompare('WORK'))
  })

  it('treats trim + NFKC + case-insensitive variants of "work" as identical', () => {
    const variants = ['work', 'WORK', 'ＷＯＲＫ', '  work  ']
    const keys = new Set(variants.map(normalizeForCompare))
    expect(keys.size).toBe(1)
  })

  it('leaves Chinese text as direct comparison (no case folding needed)', () => {
    expect(normalizeForCompare('工作')).toBe('工作')
  })
})

describe('stripUrlScheme', () => {
  it('strips https://', () => {
    expect(stripUrlScheme('https://example.com/a')).toBe('example.com/a')
  })

  it('strips http://', () => {
    expect(stripUrlScheme('http://example.com')).toBe('example.com')
  })

  it('leaves a schemeless string untouched', () => {
    expect(stripUrlScheme('example.com/a')).toBe('example.com/a')
  })
})

describe('normalizedIncludes', () => {
  it('matches regardless of case and width', () => {
    expect(normalizedIncludes('WORK trip', 'ｗｏｒｋ')).toBe(true)
  })

  it('returns false for a non-matching substring', () => {
    expect(normalizedIncludes('工作筆記', '旅遊')).toBe(false)
  })

  it('returns false for an empty needle', () => {
    expect(normalizedIncludes('anything', '   ')).toBe(false)
  })
})

describe('normalizedUrlIncludes', () => {
  it('matches a schemeless query against a scheme-prefixed URL', () => {
    expect(normalizedUrlIncludes('https://example.com/path', 'example.com')).toBe(true)
  })

  it('matches a scheme-prefixed query against a scheme-prefixed URL', () => {
    expect(normalizedUrlIncludes('https://example.com/path', 'https://example.com')).toBe(true)
  })

  it('matches on path segments', () => {
    expect(normalizedUrlIncludes('https://example.com/path/to/page', 'path/to')).toBe(true)
  })
})
