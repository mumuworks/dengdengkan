import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { App } from './App'
import { router } from './router'
import { db } from '../db'

/**
 * Home → Category collection list flow (P1-C2a). Uses the real Dexie/IndexedDB
 * stack, not mocks: the list rendered must reflect `bookmark.categoryId`, not a
 * client-side filter of unrelated state.
 */
describe('Category collection list flow', () => {
  beforeEach(async () => {
    await db.bookmarks.clear()
    await router.navigate('/')
  })

  afterEach(async () => {
    await db.bookmarks.clear()
  })

  it('navigates from a Category Preview Card into that category, showing the compact empty state when it has no bookmarks', async () => {
    render(<App />)
    await screen.findByText('0 筆收藏')

    fireEvent.click(screen.getByRole('link', { name: /未整理/ }))

    expect(await screen.findByRole('heading', { name: '未整理' })).toBeInTheDocument()
    expect(screen.getByText('這個分類還是空的。')).toBeInTheDocument()
  })

  it('only lists bookmarks whose categoryId matches the opened category', async () => {
    render(<App />)
    await screen.findByText('0 筆收藏')

    fireEvent.change(screen.getByLabelText('貼上網址'), {
      target: { value: 'https://example.com/only-in-unorganized' },
    })
    fireEvent.click(screen.getByRole('button', { name: '幫我記住' }))
    await screen.findByText('1 筆收藏')

    fireEvent.click(screen.getByRole('link', { name: /未整理/ }))

    expect(await screen.findByRole('heading', { name: '未整理' })).toBeInTheDocument()
    expect(await screen.findByText('https://example.com/only-in-unorganized')).toBeInTheDocument()
    expect(screen.queryByText('這個分類還是空的。')).not.toBeInTheDocument()
  })

  it('lets the user return to Home from the category list', async () => {
    render(<App />)
    await screen.findByText('0 筆收藏')

    fireEvent.click(screen.getByRole('link', { name: /未整理/ }))
    await screen.findByRole('heading', { name: '未整理' })

    fireEvent.click(screen.getByRole('link', { name: '← 返回' }))

    expect(await screen.findByRole('heading', { name: '收藏' })).toBeInTheDocument()
  })

  it('navigates from a collection row into Bookmark Detail', async () => {
    render(<App />)
    await screen.findByText('0 筆收藏')

    fireEvent.change(screen.getByLabelText('貼上網址'), {
      target: { value: 'https://example.com/detail-target' },
    })
    fireEvent.click(screen.getByRole('button', { name: '幫我記住' }))
    await screen.findByText('1 筆收藏')

    fireEvent.click(screen.getByRole('link', { name: /未整理/ }))
    const row = await screen.findByRole('link', { name: /detail-target/ })
    fireEvent.click(row)

    expect(await screen.findByRole('heading', { name: 'https://example.com/detail-target' })).toBeInTheDocument()
  })
})
