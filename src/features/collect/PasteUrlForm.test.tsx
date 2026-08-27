import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PasteUrlForm } from './PasteUrlForm'

describe('PasteUrlForm', () => {
  it('calls onSubmit with the normalized URL and clears the input on success', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<PasteUrlForm onSubmit={onSubmit} />)

    const input = screen.getByLabelText('貼上網址') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'https://example.com/a' } })
    fireEvent.click(screen.getByRole('button', { name: '幫我記住' }))

    expect(onSubmit).toHaveBeenCalledWith('https://example.com/a')
    expect(await screen.findByDisplayValue('')).toBeInTheDocument()
  })

  it('rejects an empty submission without calling onSubmit', () => {
    const onSubmit = vi.fn()
    render(<PasteUrlForm onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: '幫我記住' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('請先輸入網址。')
  })

  it('rejects an invalid URL without calling onSubmit and keeps the input value', () => {
    const onSubmit = vi.fn()
    render(<PasteUrlForm onSubmit={onSubmit} />)

    const input = screen.getByLabelText('貼上網址') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'not a url' } })
    fireEvent.click(screen.getByRole('button', { name: '幫我記住' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('這個網址看起來不完整')
    expect(input.value).toBe('not a url')
  })

  it('rejects a javascript: URL without calling onSubmit', () => {
    const onSubmit = vi.fn()
    render(<PasteUrlForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('貼上網址'), {
      target: { value: 'javascript:alert(1)' },
    })
    fireEvent.click(screen.getByRole('button', { name: '幫我記住' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('只支援 http 或 https')
  })

  it('clears a previous error once the user edits the field again', () => {
    const onSubmit = vi.fn()
    render(<PasteUrlForm onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: '幫我記住' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('貼上網址'), { target: { value: 'h' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
