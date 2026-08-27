import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReasonNote } from './ReasonNote'

describe('ReasonNote', () => {
  it('shows a minimal add-entry point and no note area when there is no reason', () => {
    render(<ReasonNote value={null} onSave={vi.fn()} />)

    expect(screen.getByRole('button', { name: '新增收藏理由' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows the existing reason as click-to-edit text', () => {
    render(<ReasonNote value="想去吃這家" onSave={vi.fn()} />)

    expect(screen.getByRole('button', { name: '想去吃這家' })).toBeInTheDocument()
  })

  it('enters edit mode on click and saves the new value on blur', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ReasonNote value="想去吃這家" onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: '想去吃這家' }))
    const textarea = screen.getByLabelText('收藏理由')
    fireEvent.change(textarea, { target: { value: '改天再去' } })
    fireEvent.blur(textarea)

    expect(onSave).toHaveBeenCalledWith('改天再去')
  })

  it('lets a bookmark with no reason enter edit mode via the add button', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ReasonNote value={null} onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: '新增收藏理由' }))
    const textarea = screen.getByLabelText('收藏理由')
    fireEvent.change(textarea, { target: { value: '新理由' } })
    fireEvent.blur(textarea)

    expect(onSave).toHaveBeenCalledWith('新理由')
  })
})
