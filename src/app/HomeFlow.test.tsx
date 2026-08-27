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

  it('creates a bookmark from a valid URL and shows it immediately, replacing the empty state', async () => {
    render(<App />)
    await screen.findByText('還沒有收藏任何內容。')

    fireEvent.change(screen.getByLabelText('貼上網址'), {
      target: { value: 'https://example.com/a' },
    })
    fireEvent.click(screen.getByRole('button', { name: '幫我記住' }))

    expect(await screen.findByText('https://example.com/a')).toBeInTheDocument()
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
    await screen.findByText('https://example.com/persisted')

    // Simulate a reload: unmount the tree and cycle the actual IndexedDB
    // connection closed/open, rather than only re-rendering React state.
    first.unmount()
    db.close()
    await db.open()

    render(<App />)

    expect(await screen.findByText('https://example.com/persisted')).toBeInTheDocument()
    expect(screen.queryByText('還沒有收藏任何內容。')).not.toBeInTheDocument()
  })
})
