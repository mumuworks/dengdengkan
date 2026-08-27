import { afterEach, describe, expect, it, vi } from 'vitest'
import { shareBookmark } from './share'

function stubShare(impl?: (data: ShareData) => Promise<void>) {
  Object.defineProperty(navigator, 'share', {
    value: impl ? vi.fn(impl) : undefined,
    configurable: true,
  })
}

function stubClipboard(impl?: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: impl ? { writeText: vi.fn(impl) } : undefined,
    configurable: true,
  })
}

describe('shareBookmark', () => {
  afterEach(() => {
    stubShare(undefined)
    stubClipboard(undefined)
  })

  it('uses navigator.share when available and returns "shared" on success', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stubShare(share)

    const result = await shareBookmark({ title: '標題', url: 'https://example.com/a' })

    expect(result).toBe('shared')
    expect(share).toHaveBeenCalledWith({ title: '標題', url: 'https://example.com/a' })
  })

  it('returns "cancelled" when the user dismisses the native share sheet', async () => {
    stubShare(() => Promise.reject(new DOMException('cancelled', 'AbortError')))

    const result = await shareBookmark({ title: '標題', url: 'https://example.com/a' })

    expect(result).toBe('cancelled')
  })

  it('returns "failed" when navigator.share rejects with a non-abort error', async () => {
    stubShare(() => Promise.reject(new Error('boom')))

    const result = await shareBookmark({ title: '標題', url: 'https://example.com/a' })

    expect(result).toBe('failed')
  })

  it('falls back to clipboard copy when navigator.share is unsupported', async () => {
    stubShare(undefined)
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard(writeText)

    const result = await shareBookmark({ title: '標題', url: 'https://example.com/a' })

    expect(result).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('https://example.com/a')
  })

  it('returns "failed" when neither share nor clipboard is available', async () => {
    stubShare(undefined)
    stubClipboard(undefined)

    const result = await shareBookmark({ title: '標題', url: 'https://example.com/a' })

    expect(result).toBe('failed')
  })
})
