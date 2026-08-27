import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { App } from './App'
import { router } from './router'
import { db } from '../db'
import { bookmarkRepository, categoryRepository } from './container'

/** Categories carry a boolean `isSystem` field, which is not a valid IndexedDB
 * index key — `.where('isSystem').equals(...)` is unreliable, so filter in memory. */
async function clearCustomCategories() {
  const all = await db.categories.toArray()
  const customIds = all.filter((category) => !category.isSystem).map((category) => category.id)
  if (customIds.length > 0) await db.categories.bulkDelete(customIds)
}

/**
 * Pegboard flow (P1-C2b, Decision Closure Decision 3): only `isPinnedToBoard
 * === true` bookmarks are shown, Filter Chips are 全部 + Category, and the
 * overall-empty vs. filtered-empty states use distinct copy. Uses the real
 * Dexie/IndexedDB stack, not mocks.
 */
describe('Pegboard flow', () => {
  beforeEach(async () => {
    await db.bookmarks.clear()
    await clearCustomCategories()
  })

  afterEach(async () => {
    await db.bookmarks.clear()
    await clearCustomCategories()
  })

  it('shows the empty state when nothing is pinned', async () => {
    await bookmarkRepository.create({ originalURL: 'https://example.com/unpinned' })

    await router.navigate('/board')
    render(<App />)

    expect(await screen.findByText('洞洞板還是空的。')).toBeInTheDocument()
    expect(screen.getByText('可以把特別想留下來的收藏釘在這裡。')).toBeInTheDocument()
  })

  it('shows only pinned bookmarks, not unpinned ones', async () => {
    await bookmarkRepository.create({
      originalURL: 'https://example.com/pinned',
      title: '已釘選的收藏',
      isPinnedToBoard: true,
    })
    await bookmarkRepository.create({
      originalURL: 'https://example.com/unpinned',
      title: '未釘選的收藏',
    })

    await router.navigate('/board')
    render(<App />)

    expect(await screen.findByText('已釘選的收藏')).toBeInTheDocument()
    expect(screen.queryByText('未釘選的收藏')).not.toBeInTheDocument()
  })

  it('shows the Reason note only when a reason exists, with no empty note for cards without one', async () => {
    await bookmarkRepository.create({
      originalURL: 'https://example.com/with-reason',
      title: '有理由的收藏',
      reason: '想找時間看看',
      isPinnedToBoard: true,
    })
    await bookmarkRepository.create({
      originalURL: 'https://example.com/without-reason',
      title: '沒有理由的收藏',
      isPinnedToBoard: true,
    })

    await router.navigate('/board')
    render(<App />)

    await screen.findByText('有理由的收藏')
    expect(screen.getByText('想找時間看看')).toBeInTheDocument()
    expect(screen.getByText('沒有理由的收藏')).toBeInTheDocument()
  })

  it('navigates from a Pegboard card into Bookmark Detail', async () => {
    const created = await bookmarkRepository.create({
      originalURL: 'https://example.com/pin-detail',
      title: '洞洞板收藏',
      isPinnedToBoard: true,
    })

    await router.navigate('/board')
    render(<App />)

    fireEvent.click(await screen.findByRole('link', { name: /洞洞板收藏/ }))

    expect(await screen.findByRole('heading', { name: '洞洞板收藏' })).toBeInTheDocument()
    expect(created.id).toBeTruthy()
  })

  describe('Category filter', () => {
    it('the 全部 chip shows every pinned bookmark across categories', async () => {
      const travel = await categoryRepository.create({ name: '旅遊' })
      await bookmarkRepository.create({
        originalURL: 'https://example.com/travel-pin',
        title: '旅遊釘選',
        categoryId: travel.id,
        isPinnedToBoard: true,
      })
      await bookmarkRepository.create({
        originalURL: 'https://example.com/unorganized-pin',
        title: '未整理釘選',
        isPinnedToBoard: true,
      })

      await router.navigate('/board')
      render(<App />)

      await screen.findByText('旅遊釘選')
      expect(screen.getByText('未整理釘選')).toBeInTheDocument()
    })

    it('selecting a Category chip shows only pinned bookmarks in that category', async () => {
      const travel = await categoryRepository.create({ name: '旅遊' })
      await bookmarkRepository.create({
        originalURL: 'https://example.com/travel-pin-2',
        title: '旅遊釘選2',
        categoryId: travel.id,
        isPinnedToBoard: true,
      })
      await bookmarkRepository.create({
        originalURL: 'https://example.com/unorganized-pin-2',
        title: '未整理釘選2',
        isPinnedToBoard: true,
      })

      await router.navigate('/board')
      render(<App />)
      await screen.findByText('旅遊釘選2')

      fireEvent.click(screen.getByRole('tab', { name: '旅遊' }))

      expect(await screen.findByText('旅遊釘選2')).toBeInTheDocument()
      expect(screen.queryByText('未整理釘選2')).not.toBeInTheDocument()
    })

    it('shows a distinct filtered-empty state (not the overall-empty copy) when a category has no pins', async () => {
      const travel = await categoryRepository.create({ name: '旅遊' })
      await bookmarkRepository.create({
        originalURL: 'https://example.com/only-unorganized-pin',
        title: '只在未整理釘選',
        isPinnedToBoard: true,
      })

      await router.navigate('/board')
      render(<App />)
      await screen.findByText('只在未整理釘選')

      fireEvent.click(screen.getByRole('tab', { name: '旅遊' }))

      expect(await screen.findByText('這個分類目前沒有釘選的收藏。')).toBeInTheDocument()
      expect(screen.queryByText('洞洞板還是空的。')).not.toBeInTheDocument()
      expect(travel.id).toBeTruthy()
    })
  })

  it('unpin round-trip: unpinning from Detail removes the card from Board, but the Bookmark itself still exists', async () => {
    const created = await bookmarkRepository.create({
      originalURL: 'https://example.com/unpin-roundtrip',
      title: '取消釘選測試',
      isPinnedToBoard: true,
    })

    await router.navigate('/board')
    render(<App />)
    fireEvent.click(await screen.findByRole('link', { name: /取消釘選測試/ }))

    await screen.findByRole('heading', { name: '取消釘選測試' })
    fireEvent.click(screen.getByRole('button', { name: '取消釘選' }))
    await screen.findByRole('button', { name: '釘到洞洞板' })

    await router.navigate('/board')
    expect(await screen.findByText('洞洞板還是空的。')).toBeInTheDocument()

    const stillExists = await db.bookmarks.get(created.id)
    expect(stillExists).toBeDefined()
    expect(stillExists?.isPinnedToBoard).toBe(false)
    expect(stillExists?.originalURL).toBe(created.originalURL)
  })
})
