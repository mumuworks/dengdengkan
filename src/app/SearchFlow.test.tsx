import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { App } from './App'
import { router } from './router'
import { db } from '../db'
import { bookmarkRepository, categoryRepository, tagRepository } from './container'

/** Categories carry a boolean `isSystem` field, not a valid IndexedDB index key. */
async function clearCustomCategories() {
  const all = await db.categories.toArray()
  const customIds = all.filter((category) => !category.isSystem).map((category) => category.id)
  if (customIds.length > 0) await db.categories.bulkDelete(customIds)
}

/**
 * Search flow (P1-C2b, Decision Closure Decision 4): 全部／分類／標籤 scope,
 * NFKC + case-insensitive matching, scheme-tolerant URL matching, and the
 * defined empty/no-result states. Uses the real Dexie/IndexedDB stack.
 */
describe('Search flow', () => {
  beforeEach(async () => {
    await db.bookmarks.clear()
    await db.tags.clear()
    await db.bookmarkTags.clear()
    await clearCustomCategories()
  })

  afterEach(async () => {
    await db.bookmarks.clear()
    await db.tags.clear()
    await db.bookmarkTags.clear()
    await clearCustomCategories()
  })

  it('shows nothing for an empty query (no suggestions/recents)', async () => {
    await bookmarkRepository.create({ originalURL: 'https://example.com/a', title: '某收藏' })

    await router.navigate('/search')
    render(<App />)

    await screen.findByRole('heading', { name: '搜尋' })
    expect(screen.queryByText('某收藏')).not.toBeInTheDocument()
    expect(screen.queryByText('沒有找到符合的內容。')).not.toBeInTheDocument()
  })

  it('shows the defined no-result state, and 清除搜尋 clears the query', async () => {
    await bookmarkRepository.create({ originalURL: 'https://example.com/a', title: '某收藏' })

    await router.navigate('/search')
    render(<App />)

    fireEvent.change(screen.getByLabelText('搜尋'), { target: { value: '完全找不到的字串' } })
    expect(await screen.findByText('沒有找到符合的內容。')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '清除搜尋' }))

    expect(screen.getByLabelText('搜尋')).toHaveValue('')
    expect(screen.queryByText('沒有找到符合的內容。')).not.toBeInTheDocument()
  })

  it('matches on title (全部 scope)', async () => {
    await bookmarkRepository.create({ originalURL: 'https://example.com/a', title: '東京旅行筆記' })

    await router.navigate('/search')
    render(<App />)
    fireEvent.change(screen.getByLabelText('搜尋'), { target: { value: '旅行' } })

    expect(await screen.findByText('東京旅行筆記')).toBeInTheDocument()
  })

  it('matches on source (全部 scope)', async () => {
    await bookmarkRepository.create({
      originalURL: 'https://example.com/b',
      title: '來源測試',
      source: 'Example News',
    })

    await router.navigate('/search')
    render(<App />)
    fireEvent.change(screen.getByLabelText('搜尋'), { target: { value: 'example news' } })

    expect(await screen.findByText('來源測試')).toBeInTheDocument()
  })

  it('matches on reason (全部 scope)', async () => {
    await bookmarkRepository.create({
      originalURL: 'https://example.com/c',
      title: '理由測試',
      reason: '想找時間去看看',
    })

    await router.navigate('/search')
    render(<App />)
    fireEvent.change(screen.getByLabelText('搜尋'), { target: { value: '看看' } })

    expect(await screen.findByText('理由測試')).toBeInTheDocument()
  })

  it('matches on originalURL tolerating scheme differences (全部 scope)', async () => {
    await bookmarkRepository.create({ originalURL: 'https://example.com/deal-page' })

    await router.navigate('/search')
    render(<App />)
    fireEvent.change(screen.getByLabelText('搜尋'), { target: { value: 'example.com/deal-page' } })

    expect(await screen.findByText('https://example.com/deal-page')).toBeInTheDocument()
  })

  it('matches on Category name (全部 scope)', async () => {
    const travel = await categoryRepository.create({ name: '旅遊' })
    await bookmarkRepository.create({
      originalURL: 'https://example.com/d',
      title: '分類測試',
      categoryId: travel.id,
    })

    await router.navigate('/search')
    render(<App />)
    fireEvent.change(screen.getByLabelText('搜尋'), { target: { value: '旅遊' } })

    expect(await screen.findByText('分類測試')).toBeInTheDocument()
  })

  it('matches on an associated Tag display name (全部 scope)', async () => {
    const created = await bookmarkRepository.create({ originalURL: 'https://example.com/e', title: '標籤測試' })
    const tag = await tagRepository.findOrCreate('美食')
    await tagRepository.assign(created.id, tag.id)

    await router.navigate('/search')
    render(<App />)
    fireEvent.change(screen.getByLabelText('搜尋'), { target: { value: '美食' } })

    expect(await screen.findByText('標籤測試')).toBeInTheDocument()
  })

  describe('分類 scope', () => {
    it('matches only Category name, not title/reason hits', async () => {
      const travel = await categoryRepository.create({ name: '旅遊' })
      await bookmarkRepository.create({
        originalURL: 'https://example.com/f',
        title: '在旅遊分類',
        categoryId: travel.id,
      })
      await bookmarkRepository.create({
        originalURL: 'https://example.com/g',
        title: '標題含旅遊字樣',
      })

      await router.navigate('/search')
      render(<App />)
      fireEvent.click(screen.getByRole('tab', { name: '分類' }))
      fireEvent.change(screen.getByLabelText('搜尋'), { target: { value: '旅遊' } })

      expect(await screen.findByText('在旅遊分類')).toBeInTheDocument()
      expect(screen.queryByText('標題含旅遊字樣')).not.toBeInTheDocument()
    })
  })

  describe('標籤 scope', () => {
    it('matches only Tag display name, not title/category hits', async () => {
      const created = await bookmarkRepository.create({ originalURL: 'https://example.com/h', title: '有美食標籤' })
      const tag = await tagRepository.findOrCreate('美食')
      await tagRepository.assign(created.id, tag.id)
      await bookmarkRepository.create({ originalURL: 'https://example.com/i', title: '標題含美食字樣' })

      await router.navigate('/search')
      render(<App />)
      fireEvent.click(screen.getByRole('tab', { name: '標籤' }))
      fireEvent.change(screen.getByLabelText('搜尋'), { target: { value: '美食' } })

      expect(await screen.findByText('有美食標籤')).toBeInTheDocument()
      expect(screen.queryByText('標題含美食字樣')).not.toBeInTheDocument()
    })

    it('matches multiple hit Tags with OR semantics', async () => {
      const foodTag = await tagRepository.findOrCreate('美食')
      const workTag = await tagRepository.findOrCreate('美工')
      const withFood = await bookmarkRepository.create({ originalURL: 'https://example.com/j', title: '美食收藏' })
      const withWork = await bookmarkRepository.create({ originalURL: 'https://example.com/k', title: '美工收藏' })
      await tagRepository.assign(withFood.id, foodTag.id)
      await tagRepository.assign(withWork.id, workTag.id)

      await router.navigate('/search')
      render(<App />)
      fireEvent.click(screen.getByRole('tab', { name: '標籤' }))
      fireEvent.change(screen.getByLabelText('搜尋'), { target: { value: '美' } })

      expect(await screen.findByText('美食收藏')).toBeInTheDocument()
      expect(screen.getByText('美工收藏')).toBeInTheDocument()
    })
  })

  it('navigates from a search result into Bookmark Detail', async () => {
    await bookmarkRepository.create({ originalURL: 'https://example.com/l', title: '搜尋導航測試' })

    await router.navigate('/search')
    render(<App />)
    fireEvent.change(screen.getByLabelText('搜尋'), { target: { value: '搜尋導航測試' } })

    fireEvent.click(await screen.findByRole('link', { name: /搜尋導航測試/ }))

    expect(await screen.findByRole('heading', { name: '搜尋導航測試' })).toBeInTheDocument()
  })

  it('does not update lastOpenedAt merely by appearing as a search result', async () => {
    const created = await bookmarkRepository.create({ originalURL: 'https://example.com/m', title: '曝光測試' })
    expect(created.lastOpenedAt).toBeNull()

    await router.navigate('/search')
    render(<App />)
    fireEvent.change(screen.getByLabelText('搜尋'), { target: { value: '曝光測試' } })
    await screen.findByText('曝光測試')

    const stillNull = await db.bookmarks.get(created.id)
    expect(stillNull?.lastOpenedAt).toBeNull()
  })
})
