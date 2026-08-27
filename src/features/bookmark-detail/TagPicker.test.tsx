import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { TagPicker } from './TagPicker'
import type { Tag } from '../../domain/tag'

afterEach(() => cleanup())

const allTags: Tag[] = [
  { id: 'tag-food', name: '美食', createdAt: '', updatedAt: '' },
  { id: 'tag-travel', name: '旅遊', createdAt: '', updatedAt: '' },
]

describe('TagPicker', () => {
  it('shows all existing Tags when the search field is empty', () => {
    render(
      <TagPicker
        allTags={allTags}
        assignedTagIds={new Set()}
        onAssignExisting={vi.fn()}
        onCreateAndAssign={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('美食')).toBeInTheDocument()
    expect(screen.getByText('旅遊')).toBeInTheDocument()
  })

  it('filters the list as the user types (search existing Tags)', () => {
    render(
      <TagPicker
        allTags={allTags}
        assignedTagIds={new Set()}
        onAssignExisting={vi.fn()}
        onCreateAndAssign={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByLabelText('搜尋標籤'), { target: { value: '美' } })

    expect(screen.getByText('美食')).toBeInTheDocument()
    expect(screen.queryByText('旅遊')).not.toBeInTheDocument()
  })

  it('assigns an existing Tag when clicked', () => {
    const onAssignExisting = vi.fn()
    render(
      <TagPicker
        allTags={allTags}
        assignedTagIds={new Set()}
        onAssignExisting={onAssignExisting}
        onCreateAndAssign={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '美食' }))
    expect(onAssignExisting).toHaveBeenCalledWith(allTags[0])
  })

  it('marks an already-assigned Tag and prevents re-assigning it (duplicate BookmarkTag prevention)', () => {
    const onAssignExisting = vi.fn()
    render(
      <TagPicker
        allTags={allTags}
        assignedTagIds={new Set(['tag-food'])}
        onAssignExisting={onAssignExisting}
        onCreateAndAssign={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    const option = screen.getByRole('button', { name: /美食/ })
    expect(option).toBeDisabled()
    fireEvent.click(option)
    expect(onAssignExisting).not.toHaveBeenCalled()
  })

  it('offers to create a new Tag that does not already exist, and clears the field after creating', async () => {
    const onCreateAndAssign = vi.fn().mockResolvedValue(undefined)
    render(
      <TagPicker
        allTags={allTags}
        assignedTagIds={new Set()}
        onAssignExisting={vi.fn()}
        onCreateAndAssign={onCreateAndAssign}
        onClose={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByLabelText('搜尋標籤'), { target: { value: '工作' } })

    const createButton = screen.getByRole('button', { name: '建立「工作」' })
    fireEvent.click(createButton)

    expect(onCreateAndAssign).toHaveBeenCalledWith('工作')
    await vi.waitFor(() => {
      expect(screen.queryByRole('button', { name: '建立「工作」' })).not.toBeInTheDocument()
    })
  })

  it('does not offer to create a Tag that already exists after normalization (case/width-insensitive)', () => {
    render(
      <TagPicker
        allTags={allTags}
        assignedTagIds={new Set()}
        onAssignExisting={vi.fn()}
        onCreateAndAssign={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByLabelText('搜尋標籤'), { target: { value: '  美食  ' } })
    expect(screen.queryByRole('button', { name: /建立/ })).not.toBeInTheDocument()
  })

  it('calls onClose when the overlay or the Done button is clicked', () => {
    const onClose = vi.fn()
    render(
      <TagPicker
        allTags={allTags}
        assignedTagIds={new Set()}
        onAssignExisting={vi.fn()}
        onCreateAndAssign={vi.fn()}
        onClose={onClose}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '完成' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows a hint instead of an empty list when there are no Tags at all', () => {
    render(
      <TagPicker
        allTags={[]}
        assignedTagIds={new Set()}
        onAssignExisting={vi.fn()}
        onCreateAndAssign={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('還沒有任何標籤，輸入名稱即可建立第一個。')).toBeInTheDocument()
  })
})
