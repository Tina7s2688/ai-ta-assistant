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

    expect(JSON.parse(exportBackup(data))).toEqual(data)
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
})
