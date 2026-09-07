import { seedData } from '../data/seed'
import type { AppData } from '../domain/types'

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
  return isRecord(value) && typeof value.label === 'string' && typeof value.url === 'string'
}

function isSchedule(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (value.kind === 'once') return value.dueAt === undefined || typeof value.dueAt === 'string'

  const { weekday, startWeek, endWeek, time } = value
  return value.kind === 'weekly'
    && typeof weekday === 'number' && Number.isInteger(weekday) && weekday >= 0 && weekday <= 6
    && typeof startWeek === 'number' && Number.isInteger(startWeek)
    && typeof endWeek === 'number' && Number.isInteger(endWeek) && startWeek <= endWeek
    && (time === undefined || typeof time === 'string')
}

function isTask(value: unknown): boolean {
  if (!isRecord(value)) return false

  return typeof value.id === 'string'
    && typeof value.title === 'string'
    && isCourseId(value.courseId)
    && (value.status === 'todo' || value.status === 'inProgress' || value.status === 'needsConfirmation' || value.status === 'done')
    && (value.lane === undefined || value.lane === 'beforeClass' || value.lane === 'inClass' || value.lane === 'afterClass' || value.lane === 'needsConfirmation' || value.lane === 'closing')
    && (value.week === undefined || typeof value.week === 'number')
    && isSchedule(value.schedule)
    && Array.isArray(value.checklist) && value.checklist.every((item) => typeof item === 'string')
    && Array.isArray(value.links) && value.links.every(isLink)
    && typeof value.notes === 'string'
    && typeof value.completionNote === 'string'
    && (value.completedAt === undefined || typeof value.completedAt === 'string')
    && typeof value.archived === 'boolean'
    && typeof value.sortOrder === 'number'
}

function isSpecialDate(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === 'string'
    && isCourseId(value.courseId)
    && typeof value.date === 'string'
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
    && typeof value.updatedAt === 'string'
}

function isAppData(value: unknown): value is AppData {
  if (typeof value !== 'object' || value === null) return false

  const data = value as Partial<AppData>
  return data.schemaVersion === 1
    && Array.isArray(data.tasks) && data.tasks.every(isTask)
    && Array.isArray(data.specialDates) && data.specialDates.every(isSpecialDate)
    && Array.isArray(data.sopEntries) && data.sopEntries.every(isSopEntry)
}

export function parseBackup(raw: string): AppData {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isAppData(parsed)) throw new Error('invalid backup')
    return cloneData(parsed)
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
  })
}

export function backupFilename(date = new Date()): string {
  const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return `ai-ta-assistant-backup-${localDate}.json`
}
