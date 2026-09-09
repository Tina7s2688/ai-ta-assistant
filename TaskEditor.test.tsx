import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Task } from '../domain/types'
import { TaskEditor } from './TaskEditor'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('TaskEditor', () => {
  it('places the exact privacy reminder beside editable task details', () => {
    render(<TaskEditor onCancel={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getAllByText('請勿輸入學生個資、成績或作業內容。')).toHaveLength(2)
    expect(screen.getByLabelText('備註')).toBeInTheDocument()
    expect(screen.getByLabelText('完成註記')).toBeInTheDocument()
  })

  it('rejects a weekly range whose end week is before its start week before invoking persistence', async () => {
    const user = userEvent.setup()
    const createTask = vi.fn((draft) => window.localStorage.setItem('ai-ta-assistant:v1', JSON.stringify(draft)))
    const updateTask = vi.fn()
    const onSave = (draft: { title: string }) => {
      if (draft.title === '既有工作') updateTask(draft)
      else createTask(draft)
    }
    const beforeSave = window.localStorage.getItem('ai-ta-assistant:v1')

    render(<TaskEditor onCancel={vi.fn()} onSave={onSave} />)

    await user.type(screen.getByLabelText('工作標題'), '新工作')
    await user.click(screen.getByRole('radio', { name: '每週' }))
    await user.clear(screen.getByLabelText('起始週'))
    await user.type(screen.getByLabelText('起始週'), '16')
    await user.clear(screen.getByLabelText('結束週'))
    await user.type(screen.getByLabelText('結束週'), '1')
    await user.click(screen.getByRole('button', { name: '儲存工作' }))

    expect(screen.getByRole('alert')).toHaveTextContent('結束週不得早於起始週。')
    expect(createTask).not.toHaveBeenCalled()
    expect(updateTask).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('ai-ta-assistant:v1')).toBe(beforeSave)
  })

  it('rejects an invalid weekly range before updating an existing task or its stored data', async () => {
    const user = userEvent.setup()
    const task: Task = {
      id: 'weekly-task', title: '既有工作', courseId: 'CDPS', status: 'todo', lane: 'beforeClass',
      schedule: { kind: 'weekly', weekday: 1, startWeek: 1, endWeek: 16 }, checklist: [], links: [],
      notes: '', completionNote: '', archived: false, sortOrder: 0,
    }
    const updateTask = vi.fn((draft) => window.localStorage.setItem('ai-ta-assistant:v1', JSON.stringify(draft)))
    const beforeSave = JSON.stringify({ tasks: [task] })
    window.localStorage.setItem('ai-ta-assistant:v1', beforeSave)

    render(<TaskEditor task={task} onCancel={vi.fn()} onSave={updateTask} />)

    await user.clear(screen.getByLabelText('起始週'))
    await user.type(screen.getByLabelText('起始週'), '16')
    await user.clear(screen.getByLabelText('結束週'))
    await user.type(screen.getByLabelText('結束週'), '1')
    await user.click(screen.getByRole('button', { name: '儲存工作' }))

    expect(screen.getByRole('alert')).toHaveTextContent('結束週不得早於起始週。')
    expect(updateTask).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('ai-ta-assistant:v1')).toBe(beforeSave)
  })

  it('saves a valid W1-W16 weekly range', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(<TaskEditor onCancel={vi.fn()} onSave={onSave} />)

    await user.type(screen.getByLabelText('工作標題'), 'W1 到 W16 的工作')
    await user.click(screen.getByRole('radio', { name: '每週' }))
    await user.click(screen.getByRole('button', { name: '儲存工作' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      schedule: { kind: 'weekly', weekday: 1, startWeek: 1, endWeek: 16 },
    }))
  })
})
