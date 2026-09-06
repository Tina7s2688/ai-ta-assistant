import { describe, expect, it } from 'vitest'
import { expandRecurringTask, sortTasksForDashboard } from './tasks'
import type { Task } from './types'

const task = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  title: id,
  courseId: 'CDPS',
  status: 'todo',
  schedule: { kind: 'once' },
  checklist: [],
  links: [],
  notes: '',
  completionNote: '',
  archived: false,
  sortOrder: 0,
  ...overrides,
})

describe('dashboard task operations', () => {
  it('prioritizes overdue, soon, confirmation, other unfinished, then completed tasks', () => {
    const now = new Date('2026-09-07T12:00:00+08:00')
    const tasks = [
      task('completed-task', { status: 'done', completedAt: '2026-09-06T09:00:00+08:00' }),
      task('other-task'),
      task('confirmation-task', { status: 'needsConfirmation' }),
      task('soon-task', { schedule: { kind: 'once', dueAt: '2026-09-08T12:00:00+08:00' } }),
      task('overdue-task', { schedule: { kind: 'once', dueAt: '2026-09-07T11:00:00+08:00' } }),
    ]

    expect(sortTasksForDashboard(tasks, now).map(({ id }) => id)).toEqual([
      'overdue-task',
      'soon-task',
      'confirmation-task',
      'other-task',
      'completed-task',
    ])
  })

  it('expands weekly tasks only within their inclusive week range', () => {
    const weeklyTask = task('weekly-task', {
      schedule: { kind: 'weekly', weekday: 1, startWeek: 1, endWeek: 2, time: '22:00' },
    })

    expect(expandRecurringTask(weeklyTask, 1)).toMatchObject({
      id: 'weekly-task:week-1',
      week: 1,
      dueAt: '2026-09-07T22:00:00+08:00',
    })
    expect(expandRecurringTask(weeklyTask, 2)).toMatchObject({
      dueAt: '2026-09-14T22:00:00+08:00',
    })
    expect(expandRecurringTask(weeklyTask, 3)).toBeNull()
  })
})
