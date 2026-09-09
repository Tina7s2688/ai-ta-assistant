import { describe, expect, it } from 'vitest'
import { expandRecurringTask, getTasksForWeek, sortTasksForDashboard } from './tasks'
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

  it('sorts an expanded recurring task by its derived overdue due date', () => {
    const now = new Date('2026-09-07T12:00:00+08:00')
    const weeklyTask = task('recurring-task', {
      schedule: { kind: 'weekly', weekday: 1, startWeek: 1, endWeek: 1, time: '11:00' },
    })
    const expandedTask = expandRecurringTask(weeklyTask, 1)

    expect(expandedTask).not.toBeNull()
    expect(sortTasksForDashboard([task('other-task'), expandedTask!], now).map(({ id }) => id)).toEqual([
      'recurring-task:week-1',
      'other-task',
    ])
  })

  it('renders an edited recurring occurrence without changing the series template', () => {
    const weeklyTask = task('recurring-task', {
      title: '每週公告',
      schedule: { kind: 'weekly', weekday: 1, startWeek: 1, endWeek: 2, time: '09:00' },
    })
    const tasks = getTasksForWeek([weeklyTask], [{
      sourceTaskId: 'recurring-task',
      week: 1,
      task: { ...expandRecurringTask(weeklyTask, 1)!, title: 'W1 改期公告', status: 'done', schedule: { kind: 'once', dueAt: '2026-09-08T09:00:00+08:00' } },
    }], 1)

    expect(tasks).toEqual([expect.objectContaining({ id: 'recurring-task:week-1', title: 'W1 改期公告', status: 'done' })])
    expect(weeklyTask).toMatchObject({ title: '每週公告', schedule: { kind: 'weekly', startWeek: 1, endWeek: 2 } })
    expect(getTasksForWeek([weeklyTask], [], 2)).toEqual([expect.objectContaining({ id: 'recurring-task:week-2', title: '每週公告' })])
  })
})
