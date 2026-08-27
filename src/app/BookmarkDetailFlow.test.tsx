import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { App } from './App'
import { router } from './router'
import { db } from '../db'
import { bookmarkRepository } from './container'
import { SYSTEM_UNORGANIZED_CATEGORY_ID } from '../domain/category'

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

/**
 * Bookmark Detail flow (P1-C2a): lastOpenedAt updates (BR-009), Reason Note
 * persistence, Pin/Unpin persistence, destructive Delete confirm/cancel, and
 * Share (native + clipboard fallback). Uses the real Dexie/IndexedDB stack.
 */
describe('Bookmark Detail flow', () => {
  beforeEach(async () => {
    await db.bookmarks.clear()
  })

  afterEach(async () => {
    await db.bookmarks.clear()
    stubShare(undefined)
    stubClipboard(undefined)
  })

  it('updates lastOpenedAt exactly once on entering Detail, and again when opening the original URL', async () => {
    const created = await bookmarkRepository.create({ originalURL: 'https://example.com/lastOpened' })
    expect(created.lastOpenedAt).toBeNull()

    await router.navigate(`/bookmark/${created.id}`)
    render(<App />)
    await screen.findByRole('heading', { name: 'https://example.com/lastOpened' })

    const afterEntry = await db.bookmarks.get(created.id)
    expect(afterEntry?.lastOpenedAt).not.toBeNull()
    const firstOpenedAt = afterEntry!.lastOpenedAt as string

    await new Promise((resolve) => setTimeout(resolve, 2))
    fireEvent.click(screen.getByRole('link', { name: '開啟原文' }))

    await vi.waitFor(async () => {
      const afterOpen = await db.bookmarks.get(created.id)
      expect(afterOpen?.lastOpenedAt).not.toBe(firstOpenedAt)
    })
  })

  it('does not update lastOpenedAt from Category list exposure alone', async () => {
    const created = await bookmarkRepository.create({ originalURL: 'https://example.com/notOpened' })

    await router.navigate(`/category/${SYSTEM_UNORGANIZED_CATEGORY_ID}`)
    render(<App />)
    await screen.findByRole('link', { name: /notOpened/ })

    const bookmark = await db.bookmarks.get(created.id)
    expect(bookmark?.lastOpenedAt).toBeNull()
  })

  it('edits the Reason Note in place and persists the change', async () => {
    const created = await bookmarkRepository.create({ originalURL: 'https://example.com/reason' })

    await router.navigate(`/bookmark/${created.id}`)
    render(<App />)
    await screen.findByRole('heading', { name: 'https://example.com/reason' })

    fireEvent.click(screen.getByRole('button', { name: '新增收藏理由' }))
    const textarea = screen.getByLabelText('收藏理由')
    fireEvent.change(textarea, { target: { value: '想找時間去看看' } })
    fireEvent.blur(textarea)

    await screen.findByRole('button', { name: '想找時間去看看' })
    const bookmark = await db.bookmarks.get(created.id)
    expect(bookmark?.reason).toBe('想找時間去看看')
  })

  it('normalizes a whitespace-only reason to null (BR-007), keeping no empty note area', async () => {
    const created = await bookmarkRepository.create({
      originalURL: 'https://example.com/blank-reason',
      reason: '原本的理由',
    })

    await router.navigate(`/bookmark/${created.id}`)
    render(<App />)
    await screen.findByRole('button', { name: '原本的理由' })

    fireEvent.click(screen.getByRole('button', { name: '原本的理由' }))
    const textarea = screen.getByLabelText('收藏理由')
    fireEvent.change(textarea, { target: { value: '   ' } })
    fireEvent.blur(textarea)

    await screen.findByRole('button', { name: '新增收藏理由' })
    const bookmark = await db.bookmarks.get(created.id)
    expect(bookmark?.reason).toBeNull()
  })

  it('toggles Pin/Unpin and persists it', async () => {
    const created = await bookmarkRepository.create({ originalURL: 'https://example.com/pin' })

    await router.navigate(`/bookmark/${created.id}`)
    render(<App />)
    await screen.findByRole('heading', { name: 'https://example.com/pin' })

    fireEvent.click(screen.getByRole('button', { name: '釘到洞洞板' }))
    await screen.findByRole('button', { name: '取消釘選' })
    expect((await db.bookmarks.get(created.id))?.isPinnedToBoard).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: '取消釘選' }))
    await screen.findByRole('button', { name: '釘到洞洞板' })
    expect((await db.bookmarks.get(created.id))?.isPinnedToBoard).toBe(false)
  })

  it('deletes the bookmark and its BookmarkTag associations after confirmation', async () => {
    const created = await bookmarkRepository.create({ originalURL: 'https://example.com/delete-me' })
    await db.tags.add({ id: 'tag-x', name: '測試', createdAt: '', updatedAt: '' })
    await db.bookmarkTags.add({ bookmarkId: created.id, tagId: 'tag-x', createdAt: '' })

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    await router.navigate(`/bookmark/${created.id}`)
    render(<App />)
    await screen.findByRole('heading', { name: 'https://example.com/delete-me' })

    fireEvent.click(screen.getByRole('button', { name: '刪除收藏' }))

    await vi.waitFor(async () => {
      expect(await db.bookmarks.get(created.id)).toBeUndefined()
    })
    expect(await db.bookmarkTags.where('bookmarkId').equals(created.id).count()).toBe(0)
    confirmSpy.mockRestore()
  })

  it('leaves the database untouched when the user cancels the delete confirmation', async () => {
    const created = await bookmarkRepository.create({ originalURL: 'https://example.com/keep-me' })

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await router.navigate(`/bookmark/${created.id}`)
    render(<App />)
    await screen.findByRole('heading', { name: 'https://example.com/keep-me' })

    fireEvent.click(screen.getByRole('button', { name: '刪除收藏' }))

    expect(await db.bookmarks.get(created.id)).toBeDefined()
    confirmSpy.mockRestore()
  })

  it('shares via navigator.share when available', async () => {
    const created = await bookmarkRepository.create({ originalURL: 'https://example.com/share-native' })
    const share = vi.fn().mockResolvedValue(undefined)
    stubShare(share)

    await router.navigate(`/bookmark/${created.id}`)
    render(<App />)
    await screen.findByRole('heading', { name: 'https://example.com/share-native' })

    fireEvent.click(screen.getByRole('button', { name: '分享' }))

    await vi.waitFor(() => {
      expect(share).toHaveBeenCalledWith({
        title: 'https://example.com/share-native',
        url: 'https://example.com/share-native',
      })
    })
  })

  it('falls back to copying the link when navigator.share is unsupported', async () => {
    const created = await bookmarkRepository.create({ originalURL: 'https://example.com/share-fallback' })
    stubShare(undefined)
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard(writeText)

    await router.navigate(`/bookmark/${created.id}`)
    render(<App />)
    await screen.findByRole('heading', { name: 'https://example.com/share-fallback' })

    fireEvent.click(screen.getByRole('button', { name: '分享' }))

    expect(await screen.findByText('連結已複製。')).toBeInTheDocument()
    expect(writeText).toHaveBeenCalledWith('https://example.com/share-fallback')
  })
})
