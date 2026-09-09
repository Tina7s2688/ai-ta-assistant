import { useState } from 'react'
import type { AppData } from '../domain/types'
import { backupFilename, exportBackup, parseBackup } from '../lib/storage'
import { useAppData } from '../lib/store'

const backupErrorMessage = '無法讀取備份檔，現有資料未變更。'

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(String(reader.result))
    reader.readAsText(file)
  })
}

export function BackupPage() {
  const { data, replaceAllData } = useAppData()
  const [pendingImport, setPendingImport] = useState<AppData | null>(null)
  const [error, setError] = useState('')

  const exportData = () => {
    const url = URL.createObjectURL(new Blob([exportBackup(data)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = backupFilename()
    link.click()
    URL.revokeObjectURL(url)
  }

  const chooseImport = async (file: File | undefined) => {
    if (!file) return
    try {
      setPendingImport(parseBackup(await readFile(file)))
      setError('')
    } catch {
      setPendingImport(null)
      setError(backupErrorMessage)
    }
  }

  return <section className="backup-page">
    <header><p className="eyebrow">本機資料保護</p><h1>本機備份</h1><p>備份檔只包含這台裝置中的任務、課程日期與 SOP，不會連接外部服務。</p></header>
    <section className="backup-card"><h2>匯出備份</h2><p>下載 JSON 檔案以保存目前的本機資料。</p><button type="button" onClick={exportData}>匯出 JSON 備份</button></section>
    <section className="backup-card"><h2>匯入備份</h2><p>請先確認備份內容。只有確認後才會取代目前資料。</p><label className="file-input">匯入備份檔<input type="file" accept="application/json,.json" onChange={(event) => void chooseImport(event.target.files?.[0])} /></label>{error && <p className="import-error" role="alert">{error}</p>}</section>
    {pendingImport && <section className="backup-dialog" role="dialog" aria-modal="true" aria-labelledby="backup-confirm-title"><h2 id="backup-confirm-title">確認取代目前資料</h2><p>此備份包含 {pendingImport.tasks.length} 項任務、{pendingImport.sopEntries.length} 筆 SOP 與 {pendingImport.specialDates.length} 個特殊日期。</p><p>取代後無法復原目前未匯出的資料。</p><div><button type="button" onClick={() => setPendingImport(null)}>取消</button><button type="button" onClick={() => { replaceAllData(pendingImport); setPendingImport(null) }}>取代目前資料</button></div></section>}
  </section>
}
