import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { AppData } from '../domain/types'
import { appStorageKey, backupFilename, exportBackup } from '../lib/storage'
import { AppDataProvider } from '../lib/store'
import { BackupPage } from './BackupPage'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('BackupPage', () => {
  it('uses the device-local calendar date in an exported backup filename', () => {
    expect(backupFilename(new Date('2026-09-07T00:30:00+08:00'))).toBe('ai-ta-assistant-backup-2026-09-07.json')
  })

  it('keeps existing storage unchanged when the import file is invalid', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(appStorageKey, exportBackup({ schemaVersion: 1, tasks: [], specialDates: [], sopEntries: [] }))
    const beforeImport = window.localStorage.getItem(appStorageKey)
    render(<AppDataProvider><BackupPage /></AppDataProvider>)

    await user.upload(screen.getByLabelText('匯入備份檔'), new File(['{not-json'], 'broken.json', { type: 'application/json' }))

    expect(await screen.findByText('無法讀取備份檔，現有資料未變更。')).toBeInTheDocument()
    expect(window.localStorage.getItem(appStorageKey)).toBe(beforeImport)
  })

  it('shows backup counts and replaces data only after explicit confirmation', async () => {
    const user = userEvent.setup()
    const existing: AppData = { schemaVersion: 1, tasks: [], specialDates: [], sopEntries: [] }
    const replacement: AppData = {
      schemaVersion: 1,
      tasks: [{ id: 'backup-task', title: '還原的任務', courseId: 'CDPS', status: 'todo', schedule: { kind: 'once' }, checklist: [], links: [], notes: '', completionNote: '', archived: false, sortOrder: 1 }],
      specialDates: [],
      sopEntries: [],
    }
    window.localStorage.setItem(appStorageKey, exportBackup(existing))
    render(<AppDataProvider><BackupPage /></AppDataProvider>)

    await user.upload(screen.getByLabelText('匯入備份檔'), new File([exportBackup(replacement)], 'backup.json', { type: 'application/json' }))

    expect(await screen.findByRole('dialog')).toHaveTextContent('1 項任務')
    expect(window.localStorage.getItem(appStorageKey)).toBe(exportBackup(existing))
    await user.click(screen.getByRole('button', { name: '取代目前資料' }))

    expect(JSON.parse(window.localStorage.getItem(appStorageKey) ?? '{}').tasks).toContainEqual(expect.objectContaining({ id: 'backup-task' }))
  })
})
