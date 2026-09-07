import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { SopEntry, SpecialDate, Task } from '../domain/types'
import { AppDataProvider, useAppData } from './store'

const wrapper = ({ children }: PropsWithChildren) => <AppDataProvider>{children}</AppDataProvider>

const newTask: Omit<Task, 'id' | 'completedAt'> = {
  title: 'Prepare week one materials',
  courseId: 'CDPS',
  status: 'todo',
  schedule: { kind: 'once', dueAt: '2026-09-07T22:00:00+08:00' },
  checklist: [],
  links: [],
  notes: '',
  completionNote: '',
  archived: false,
  sortOrder: 0,
}

describe('app data store', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('creates, updates, completes, and archives local tasks', () => {
    const { result } = renderHook(() => useAppData(), { wrapper })

    act(() => {
      result.current.createTask(newTask)
    })
    const taskId = result.current.data.tasks[0].id

    act(() => {
      result.current.updateTask(taskId, { notes: 'Bring printed outline' })
      result.current.completeTask(taskId, 'Sent to the course team')
      result.current.archiveTask(taskId)
    })

    expect(result.current.data.tasks[0]).toMatchObject({
      id: taskId,
      status: 'done',
      notes: 'Bring printed outline',
      completionNote: 'Sent to the course team',
      archived: true,
    })
    expect(result.current.data.tasks[0].completedAt).toEqual(expect.any(String))
  })

  it('upserts reference data and replaces data only when a complete AppData value is supplied', () => {
    const { result } = renderHook(() => useAppData(), { wrapper })
    const sop: SopEntry = {
      id: 'sop-1', category: 'moodle', title: 'Publish weekly materials', when: 'Before class', owner: 'Teacher',
      steps: ['Review links'], notes: '', links: [], updatedAt: '2026-09-01T09:00:00+08:00',
    }
    const date: SpecialDate = {
      id: 'cdps-w1-note', courseId: 'CDPS', date: '2026-09-07', kind: 'changed', label: 'Room check', notes: '',
    }

    act(() => {
      result.current.upsertSop(sop)
      result.current.setSpecialDate(date)
    })
    expect(result.current.data.sopEntries).toContainEqual(sop)
    expect(result.current.data.specialDates).toContainEqual(date)

    act(() => {
      result.current.replaceAllData({ schemaVersion: 1, tasks: [], specialDates: [date], sopEntries: [sop] })
    })
    expect(result.current.data).toEqual({ schemaVersion: 1, tasks: [], specialDates: [date], sopEntries: [sop], recurringOverrides: [] })
  })

  it('completes one recurring occurrence without completing the weekly template', () => {
    const { result } = renderHook(() => useAppData(), { wrapper })
    act(() => {
      result.current.createTask({ ...newTask, title: '每週檢查', schedule: { kind: 'weekly', weekday: 1, startWeek: 1, endWeek: 2 } })
    })
    const recurring = result.current.data.tasks.at(-1)!

    act(() => {
      result.current.completeTask(`${recurring.id}:week-1`, 'W1 已完成')
    })

    expect(result.current.data.tasks.find((task) => task.id === recurring.id)).toMatchObject({ status: 'todo', schedule: { kind: 'weekly' } })
    expect(result.current.data.recurringOverrides).toContainEqual(expect.objectContaining({ sourceTaskId: recurring.id, week: 1, task: expect.objectContaining({ status: 'done', completionNote: 'W1 已完成' }) }))
  })
})
