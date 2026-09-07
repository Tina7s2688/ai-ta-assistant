import { beforeEach, describe, expect, it } from 'vitest'
import { seedData } from '../data/seed'
import type { AppData } from '../domain/types'
import { exportBackup, loadAppData, parseBackup, saveAppData } from './storage'

const storageKey = 'ai-ta-assistant:v1'

describe('local app storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loads a deep clone of seed data when no saved data exists', () => {
    const loaded = loadAppData()
    loaded.specialDates[0].label = 'changed only in memory'

    expect(loaded).not.toBe(seedData)
    expect(seedData.specialDates[0].label).toBe('假日，無正常上課')
    expect(loadAppData()).toEqual(seedData)
  })

  it('falls back to seed data when saved JSON is corrupted', () => {
    localStorage.setItem(storageKey, '{not-json')

    expect(loadAppData()).toEqual(seedData)
  })

  it('exports only the versioned local backup data', () => {
    const data: AppData = {
      schemaVersion: 1,
      tasks: [],
      specialDates: [],
      sopEntries: [],
    }

    expect(JSON.parse(exportBackup(data))).toEqual({ ...data, recurringOverrides: [] })
  })

  it('rejects an invalid backup without changing saved data', () => {
    const saved: AppData = {
      schemaVersion: 1,
      tasks: [],
      specialDates: [],
      sopEntries: [],
    }
    saveAppData(saved)
    const beforeImport = localStorage.getItem(storageKey)

    expect(() => parseBackup('{"schemaVersion":99}')).toThrow('無法讀取備份檔，現有資料未變更。')
    expect(localStorage.getItem(storageKey)).toBe(beforeImport)
  })

  it('rejects malformed entries in an otherwise versioned backup without changing saved data', () => {
    const saved: AppData = {
      schemaVersion: 1,
      tasks: [],
      specialDates: [],
      sopEntries: [],
    }
    saveAppData(saved)
    const beforeImport = localStorage.getItem(storageKey)
    const malformedBackup = JSON.stringify({ ...saved, tasks: [null] })

    expect(() => parseBackup(malformedBackup)).toThrow('無法讀取備份檔，現有資料未變更。')
    expect(localStorage.getItem(storageKey)).toBe(beforeImport)
  })

  it('rejects invalid dates, non-finite numbers, out-of-range weeks, times, and blank links', () => {
    const invalidBackups = [
      { tasks: [{ ...seedData.tasks[0], schedule: { kind: 'once', dueAt: 'not-a-date' } }] },
      { tasks: [{ ...seedData.tasks[0], schedule: { kind: 'once', dueAt: '2026-02-30T10:00:00+08:00' } }] },
      { tasks: [{ ...seedData.tasks[0], sortOrder: Number.POSITIVE_INFINITY }] },
      { tasks: [{ ...seedData.tasks[0], week: 17 }] },
      { tasks: [{ ...seedData.tasks[0], schedule: { kind: 'weekly', weekday: 1, startWeek: 0, endWeek: 16, time: '25:00' } }] },
      { tasks: [{ ...seedData.tasks[0], links: [{ label: ' ', url: '' }] }] },
      { specialDates: [{ ...seedData.specialDates[0], date: '2026-02-30' }] },
    ]

    for (const invalid of invalidBackups) {
      expect(() => parseBackup(JSON.stringify({ ...seedData, ...invalid }))).toThrow('無法讀取備份檔，現有資料未變更。')
    }
  })
})
