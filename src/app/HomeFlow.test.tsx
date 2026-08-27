import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { App } from './App'
import { router } from './router'
import { db } from '../db'

/**
 * End-to-end coverage for the P1-C1 Blocker closure: paste URL → validate →
 * bookmarkRepository.create() → IndexedDB → list() → Home displays it → data
 * survives a simulated reload. Uses the real Dexie/IndexedDB stack (fake-indexeddb),
 * not mocks, so persistence is proven against actual storage, not React state.
 *
 * P1-C2a note: Home no longer lists individual bookmarks directly (PRD §9.2 — Home
 * shows Category Preview Cards, not a bookmark list). "Visible on Home" assertions
 * below check the 未整理 Category Preview Card's count instead; the bookmark's own
 * visibility (title/URL text) is covered in CategoryFlow.test.tsx, which drills into
 * the category. This keeps the same persistence guarantees while matching where the
 * bookmark is actually rendered post-P1-C2a.
 */
describe('Home paste-URL collection flow', () => {
  beforeEach(async () => {
    await db.bookmarks.clear()
    await router.navigate('/')
  })

  afterEach(async () => {
    await db.bookmarks.clear()
  })

  it('shows the empty state when there are no bookmarks', async () => {
    render(<App />)
    expect(await screen.findByText('還沒有收藏任何內容。')).toBeInTheDocument()
  })

  it('creates a bookmark from a valid URL and reflects it in the 未整理 category card, replacing the empty state', async () => {
    render(<App />)
    await screen.findByText('還沒有收藏任何內容。')
    expect(screen.getByRole('link', { name: /未整理/ })).toHaveTextContent('0 筆收藏')

    fireEvent.change(screen.getByLabelText('貼上網址'), {
      target: { value: 'https://example.com/a' },
    })
    fireEvent.click(screen.getByRole('button', { name: '幫我記住' }))

    expect(await screen.findByText('1 筆收藏')).toBeInTheDocument()
    expect(screen.queryByText('還沒有收藏任何內容。')).not.toBeInTheDocument()
    expect(await db.bookmarks.count()).toBe(1)
  })

  it('does not create a bookmark for an invalid URL, keeps the empty state, and leaves IndexedDB untouched', async () => {
    render(<App />)
    await screen.findByText('還沒有收藏任何內容。')

    fireEvent.change(screen.getByLabelText('貼上網址'), {
      target: { value: 'javascript:alert(1)' },
    })
    fireEvent.click(screen.getByRole('button', { name: '幫我記住' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('還沒有收藏任何內容。')).toBeInTheDocument()
    expect(await db.bookmarks.count()).toBe(0)
  })

  it('persists a created bookmark across a simulated app/database reload', async () => {
    const first = render(<App />)
    await screen.findByText('還沒有收藏任何內容。')

    fireEvent.change(screen.getByLabelText('貼上網址'), {
      target: { value: 'https://example.com/persisted' },
    })
    fireEvent.click(screen.getByRole('button', { name: '幫我記住' }))
    await screen.findByText('1 筆收藏')

    // Simulate a reload: unmount the tree and cycle the actual IndexedDB
    // connection closed/open, rather than only re-rendering React state.
    first.unmount()
    db.close()
    await db.open()

    render(<App />)

    expect(await screen.findByText('1 筆收藏')).toBeInTheDocument()
    expect(screen.queryByText('還沒有收藏任何內容。')).not.toBeInTheDocument()
  })
})
