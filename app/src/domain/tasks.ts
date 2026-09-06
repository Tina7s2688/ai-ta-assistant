import type { Task } from './types'

export interface ExpandedTask extends Task {
  dueAt?: string
  sourceTaskId: string
}

function getDueAt(task: Task): string | undefined {
  if ('dueAt' in task && typeof task.dueAt === 'string') return task.dueAt
  return task.schedule.kind === 'once' ? task.schedule.dueAt : undefined
}

function getDashboardPriority(task: Task, now: Date): number {
  if (task.status === 'done') return 4

  const dueAt = getDueAt(task)
  if (dueAt) {
    const dueTime = new Date(dueAt).getTime()
    const nowTime = now.getTime()

    if (dueTime < nowTime) return 0
    if (dueTime <= nowTime + 48 * 60 * 60 * 1000) return 1
  }

  if (task.status === 'needsConfirmation') return 2
  return 3
}

export function sortTasksForDashboard(tasks: Task[], now = new Date()): Task[] {
  return [...tasks].sort((left, right) => {
    const priorityDifference = getDashboardPriority(left, now) - getDashboardPriority(right, now)
    if (priorityDifference !== 0) return priorityDifference

    const dueAtDifference = (getDueAt(left) ?? '').localeCompare(getDueAt(right) ?? '')
    if (dueAtDifference !== 0) return dueAtDifference

    const sortOrderDifference = left.sortOrder - right.sortOrder
    return sortOrderDifference !== 0 ? sortOrderDifference : left.id.localeCompare(right.id)
  })
}

function formatTaipeiDueAt(date: Date, time: string): string {
  const taipeiDate = new Date(date.getTime() + 8 * 60 * 60 * 1000)
  const datePart = taipeiDate.toISOString().slice(0, 10)
  return `${datePart}T${time.length === 5 ? `${time}:00` : time}+08:00`
}

export function expandRecurringTask(task: Task, week: number): ExpandedTask | null {
  if (task.schedule.kind !== 'weekly') return null
  if (week < task.schedule.startWeek || week > task.schedule.endWeek) return null

  const semesterStart = new Date('2026-09-07T00:00:00+08:00')
  const daysFromMonday = (task.schedule.weekday + 6) % 7
  const instanceDate = new Date(semesterStart.getTime() + ((week - 1) * 7 + daysFromMonday) * 24 * 60 * 60 * 1000)
  const dueAt = task.schedule.time ? formatTaipeiDueAt(instanceDate, task.schedule.time) : undefined

  return {
    ...task,
    id: `${task.id}:week-${week}`,
    week,
    dueAt,
    sourceTaskId: task.id,
  }
}
