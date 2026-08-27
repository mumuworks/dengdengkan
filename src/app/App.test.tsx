import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/dom'
import { App } from './App'
import { router } from './router'

describe('App shell', () => {
  // `router` is a module-level singleton; reset it to `/` so each test starts
  // from a known route regardless of navigation done by a previous test.
  beforeEach(async () => {
    await router.navigate('/')
  })

  it('renders the Home route with Bottom Navigation on first load', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: '收藏' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: '主要導覽' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '收藏' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '洞洞板' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '搜尋' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '設定' })).toBeInTheDocument()
  })

  it('shows the Home empty state when there are no bookmarks', async () => {
    render(<App />)
    expect(await screen.findByText('還沒有收藏任何內容。')).toBeInTheDocument()
  })

  it('navigates to 洞洞板 when its nav item is clicked', async () => {
    render(<App />)
    await screen.findByRole('heading', { name: '收藏' })

    fireEvent.click(screen.getByRole('link', { name: '洞洞板' }))

    expect(await screen.findByRole('heading', { name: '洞洞板' })).toBeInTheDocument()
  })

  it('navigates to 設定 and reads the local-first storage notice', async () => {
    render(<App />)
    await screen.findByRole('heading', { name: '收藏' })

    fireEvent.click(screen.getByRole('link', { name: '設定' }))

    expect(await screen.findByRole('heading', { name: '設定' })).toBeInTheDocument()
    expect(
      screen.getByText('資料儲存在本機，不上傳《等等看》伺服器。'),
    ).toBeInTheDocument()
  })
})
