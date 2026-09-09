import { useState } from 'react'
import type { SopEntry } from '../domain/types'

interface SopEditorProps {
  category: SopEntry['category']
  entry?: SopEntry
  onSave: (entry: SopEntry) => void
  onCancel: () => void
}

function emptyEntry(category: SopEntry['category']): SopEntry {
  return { id: globalThis.crypto?.randomUUID?.() ?? `sop-${Date.now()}`, category, title: '', when: '', owner: '', steps: [], notes: '', links: [], updatedAt: new Date().toISOString().slice(0, 10) }
}

function toDraft(entry: SopEntry | undefined, category: SopEntry['category']): SopEntry {
  return entry ? { ...entry, category, steps: [...entry.steps], links: entry.links.map((link) => ({ ...link })) } : emptyEntry(category)
}

export function SopEditor({ category, entry, onSave, onCancel }: SopEditorProps) {
  const [draft, setDraft] = useState(() => toDraft(entry, category))
  const set = <K extends keyof SopEntry>(key: K, value: SopEntry[K]) => setDraft((current) => ({ ...current, [key]: value }))

  return <section className="sop-editor" aria-labelledby="sop-editor-title">
    <div className="editor-heading"><h2 id="sop-editor-title">{entry ? '編輯 SOP' : '新增 SOP'}</h2><button type="button" onClick={onCancel}>取消</button></div>
    <p className="privacy-reminder" role="note">請勿輸入學生個資、成績或作業內容。</p>
    <form onSubmit={(event) => { event.preventDefault(); onSave({ ...draft, category }) }}>
      <label>SOP 標題<input required value={draft.title} onChange={(event) => set('title', event.target.value)} /></label>
      <label>適用時機<input required value={draft.when} onChange={(event) => set('when', event.target.value)} /></label>
      <label>負責人<input required value={draft.owner} onChange={(event) => set('owner', event.target.value)} /></label>
      <label>步驟（一行一項）<textarea value={draft.steps.join('\n')} onChange={(event) => set('steps', event.target.value.split('\n').map((step) => step.trim()).filter(Boolean))} /></label>
      <label>備註<textarea value={draft.notes} onChange={(event) => set('notes', event.target.value)} /></label>
      <label>連結（一行：標籤 | URL）<textarea value={draft.links.map((link) => `${link.label} | ${link.url}`).join('\n')} onChange={(event) => set('links', event.target.value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => { const [label = '', url = ''] = line.split('|').map((part) => part.trim()); return { label, url } }))} /></label>
      <label>最後更新日期<input required type="date" value={draft.updatedAt.slice(0, 10)} onChange={(event) => set('updatedAt', event.target.value)} /></label>
      <button type="submit">儲存 SOP</button>
    </form>
  </section>
}
