import { seedData } from '../data/seed'
import type { AppData, RecurringTaskOverride, Task } from '../domain/types'

export const appStorageKey = 'ai-ta-assistant:v1'
const backupErrorMessage = '無法讀取備份檔，現有資料未變更。'

function cloneData(data: AppData): AppData {
  return JSON.parse(JSON.stringify(data)) as AppData
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isCourseId(value: unknown): boolean {
  return value === 'CDPS' || value === 'BNA' || value === 'COMMON'
}

function isLink(value: unknown): boolean {
  return isRecord(value) && typeof value.label === 'string' && value.label.trim().length > 0 && typeof value.url === 'string' && value.url.trim().length > 0
}

function isDate(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
}

function isDateTime(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const match = /^(\d{4}-\d{2}-\d{2})T((?:[01]\d|2[0-3]):[0-5]\d):[0-5]\d(?:\.\d{3})?(Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.exec(value)
  if (!match || !isDate(match[1])) return false
  if (match[3] !== 'Z' && Number(match[3].slice(1, 3)) === 14 && match[3].slice(4, 6) !== '00') return false
  return Number.isFinite(new Date(value).getTime())
}

function isTime(value: unknown): boolean {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function isSchedule(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (value.kind === 'once') return value.dueAt === undefined || isDateTime(value.dueAt)

  const { weekday, startWeek, endWeek, time } = value
  return value.kind === 'weekly'
    && typeof weekday === 'number' && Number.isFinite(weekday) && Number.isInteger(weekday) && weekday >= 0 && weekday <= 6
    && typeof startWeek === 'number' && Number.isFinite(startWeek) && Number.isInteger(startWeek) && startWeek >= 1 && startWeek <= 16
    && typeof endWeek === 'number' && Number.isFinite(endWeek) && Number.isInteger(endWeek) && endWeek >= 1 && endWeek <= 16 && startWeek <= endWeek
    && (time === undefined || isTime(time))
}

function isTask(value: unknown): value is Task {
  if (!isRecord(value)) return false

  return typeof value.id === 'string'
    && typeof value.title === 'string'
    && isCourseId(value.courseId)
    && (value.status === 'todo' || value.status === 'inProgress' || value.status === 'needsConfirmation' || value.status === 'done')
    && (value.lane === undefined || value.lane === 'beforeClass' || value.lane === 'inClass' || value.lane === 'afterClass' || value.lane === 'needsConfirmation' || value.lane === 'closing')
    && (value.week === undefined || typeof value.week === 'number' && Number.isFinite(value.week) && Number.isInteger(value.week) && value.week >= 1 && value.week <= 16)
    && isSchedule(value.schedule)
    && Array.isArray(value.checklist) && value.checklist.every((item) => typeof item === 'string')
    && Array.isArray(value.links) && value.links.every(isLink)
    && typeof value.notes === 'string'
    && typeof value.completionNote === 'string'
    && (value.completedAt === undefined || isDateTime(value.completedAt))
    && typeof value.archived === 'boolean'
    && typeof value.sortOrder === 'number' && Number.isFinite(value.sortOrder)
}

function isSpecialDate(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === 'string'
    && isCourseId(value.courseId)
    && isDate(value.date)
    && (value.kind === 'holiday' || value.kind === 'makeup' || value.kind === 'changed')
    && typeof value.label === 'string'
    && typeof value.notes === 'string'
}

function isSopEntry(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === 'string'
    && (value.category === 'email' || value.category === 'moodle' || value.category === 'grouping' || value.category === 'assessment' || value.category === 'classroom' || value.category === 'tools')
    && typeof value.title === 'string'
    && typeof value.when === 'string'
    && typeof value.owner === 'string'
    && Array.isArray(value.steps) && value.steps.every((step) => typeof step === 'string')
    && typeof value.notes === 'string'
    && Array.isArray(value.links) && value.links.every(isLink)
    && (isDate(value.updatedAt) || isDateTime(value.updatedAt))
}

function isRecurringOverride(value: unknown): value is RecurringTaskOverride {
  if (!isRecord(value) || typeof value.sourceTaskId !== 'string' || value.sourceTaskId.length === 0
    || typeof value.week !== 'number' || !Number.isInteger(value.week) || value.week < 1 || value.week > 16) return false
  const task = value.task
  return isTask(task) && task.schedule.kind === 'once'
}

function isAppData(value: unknown): value is AppData {
  if (typeof value !== 'object' || value === null) return false

  const data = value as Partial<AppData>
  return data.schemaVersion === 1
    && Array.isArray(data.tasks) && data.tasks.every(isTask)
    && Array.isArray(data.specialDates) && data.specialDates.every(isSpecialDate)
    && Array.isArray(data.sopEntries) && data.sopEntries.every(isSopEntry)
    && (data.recurringOverrides === undefined || Array.isArray(data.recurringOverrides) && data.recurringOverrides.every(isRecurringOverride))
}

export function parseBackup(raw: string): AppData {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isAppData(parsed)) throw new Error('invalid backup')
    return { ...cloneData(parsed), recurringOverrides: parsed.recurringOverrides ?? [] }
  } catch {
    throw new Error(backupErrorMessage)
  }
}

export function loadAppData(): AppData {
  if (typeof window === 'undefined') return cloneData(seedData)

  const raw = window.localStorage.getItem(appStorageKey)
  if (!raw) return cloneData(seedData)

  try {
    return parseBackup(raw)
  } catch {
    return cloneData(seedData)
  }
}

export function saveAppData(data: AppData): void {
  window.localStorage.setItem(appStorageKey, exportBackup(data))
}

export function exportBackup(data: AppData): string {
  return JSON.stringify({
    schemaVersion: data.schemaVersion,
    tasks: data.tasks,
    specialDates: data.specialDates,
    sopEntries: data.sopEntries,
    recurringOverrides: data.recurringOverrides ?? [],
  })
}

export function backupFilename(date = new Date()): string {
  const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return `ai-ta-assistant-backup-${localDate}.json`
}
