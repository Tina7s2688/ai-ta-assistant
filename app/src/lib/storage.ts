import { seedData } from '../data/seed'
import type { AppData } from '../domain/types'

export const appStorageKey = 'ai-ta-assistant:v1'
const backupErrorMessage = '無法讀取備份檔，現有資料未變更。'

function cloneData(data: AppData): AppData {
  return JSON.parse(JSON.stringify(data)) as AppData
}

function isAppData(value: unknown): value is AppData {
  if (typeof value !== 'object' || value === null) return false

  const data = value as Partial<AppData>
  return data.schemaVersion === 1
    && Array.isArray(data.tasks)
    && Array.isArray(data.specialDates)
    && Array.isArray(data.sopEntries)
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
