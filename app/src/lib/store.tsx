import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { exportBackup, loadAppData, parseBackup, saveAppData } from './storage'
import type { AppData, SopEntry, SpecialDate, Task } from '../domain/types'
import { expandRecurringTask, getRecurringInstanceParts } from '../domain/tasks'

type NewTask = Omit<Task, 'id' | 'completedAt'>
type TaskChanges = Partial<Omit<Task, 'id'>>

interface AppDataContextValue {
  data: AppData
  createTask: (task: NewTask) => void
  updateTask: (taskId: string, changes: TaskChanges) => void
  completeTask: (taskId: string, completionNote?: string) => void
  archiveTask: (taskId: string) => void
  upsertSop: (entry: SopEntry) => void
  setSpecialDate: (specialDate: SpecialDate) => void
  replaceAllData: (data: AppData) => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

function newTaskId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `task-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function updateRecurringOverride(current: AppData, taskId: string, changes: TaskChanges): AppData | null {
  const parts = getRecurringInstanceParts(taskId)
  if (!parts) return null
  const source = current.tasks.find((task) => task.id === parts.sourceTaskId)
  const instance = source && expandRecurringTask(source, parts.week)
  if (!instance) return null
  const prior = current.recurringOverrides?.find((item) => item.sourceTaskId === parts.sourceTaskId && item.week === parts.week)
  const task = { ...(prior?.task ?? instance), ...changes, schedule: changes.schedule?.kind === 'once' ? changes.schedule : instance.schedule, id: taskId, week: parts.week }
  const override = { sourceTaskId: parts.sourceTaskId, week: parts.week, task }
  const recurringOverrides = [...(current.recurringOverrides ?? []).filter((item) => item.sourceTaskId !== parts.sourceTaskId || item.week !== parts.week), override]
  return { ...current, recurringOverrides }
}

export function AppDataProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<AppData>(loadAppData)

  useEffect(() => {
    saveAppData(data)
  }, [data])

  const value = useMemo<AppDataContextValue>(() => ({
    data,
    createTask: (task) => {
      setData((current) => ({ ...current, tasks: [...current.tasks, { ...task, id: newTaskId() }] }))
    },
    updateTask: (taskId, changes) => {
      setData((current) => updateRecurringOverride(current, taskId, changes) ?? ({ ...current, tasks: current.tasks.map((task) => task.id === taskId ? { ...task, ...changes, id: task.id } : task) }))
    },
    completeTask: (taskId, completionNote = '') => {
      setData((current) => updateRecurringOverride(current, taskId, { status: 'done', completionNote, completedAt: new Date().toISOString() }) ?? ({
        ...current, tasks: current.tasks.map((task) => task.id === taskId
          ? { ...task, status: 'done', completionNote, completedAt: new Date().toISOString() }
          : task),
      }))
    },
    archiveTask: (taskId) => {
      setData((current) => updateRecurringOverride(current, taskId, { archived: true }) ?? ({ ...current, tasks: current.tasks.map((task) => task.id === taskId ? { ...task, archived: true } : task) }))
    },
    upsertSop: (entry) => {
      setData((current) => {
        const exists = current.sopEntries.some((existing) => existing.id === entry.id)
        return {
          ...current,
          sopEntries: exists
            ? current.sopEntries.map((existing) => existing.id === entry.id ? entry : existing)
            : [...current.sopEntries, entry],
        }
      })
    },
    setSpecialDate: (specialDate) => {
      setData((current) => {
        const exists = current.specialDates.some((existing) => existing.id === specialDate.id)
        return {
          ...current,
          specialDates: exists
            ? current.specialDates.map((existing) => existing.id === specialDate.id ? specialDate : existing)
            : [...current.specialDates, specialDate],
        }
      })
    },
    replaceAllData: (nextData) => {
      setData(parseBackup(exportBackup(nextData)))
    },
  }), [data])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- consumers need this public provider hook.
export function useAppData(): AppDataContextValue {
  const value = useContext(AppDataContext)
  if (!value) throw new Error('useAppData must be used within AppDataProvider')
  return value
}
