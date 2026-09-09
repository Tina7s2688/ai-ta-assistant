import { useState } from 'react'
import { SopEditor } from '../components/SopEditor'
import type { SopEntry } from '../domain/types'
import { useAppData } from '../lib/store'

const categories: Array<{ id: SopEntry['category']; label: string }> = [
  { id: 'email', label: '寄信與通知' }, { id: 'moodle', label: 'Moodle' }, { id: 'grouping', label: '分組' },
  { id: 'assessment', label: '作業與成績' }, { id: 'classroom', label: '教室與器材' }, { id: 'tools', label: '課程工具' },
]

export function SopPage() {
  const { data, upsertSop } = useAppData()
  const [category, setCategory] = useState<SopEntry['category']>('email')
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const entries = data.sopEntries.filter((entry) => entry.category === category)
  const editingEntry = editingId && editingId !== 'new' ? data.sopEntries.find((entry) => entry.id === editingId) : undefined

  return <section className="sop-page">
    <header><p className="eyebrow">可重複使用流程</p><h1>教學 SOP</h1><p>保存工作流程與公開資源；所有資料只留在這台裝置。</p><p className="privacy-reminder">請勿輸入學生個資、成績或作業內容。</p></header>
    <div className="sop-tabs" role="tablist" aria-label="SOP 分類">{categories.map((item) => <button key={item.id} type="button" role="tab" aria-selected={category === item.id} className={category === item.id ? 'active' : ''} onClick={() => { setCategory(item.id); setEditingId(null) }}>{item.label}</button>)}</div>
    {editingId !== null
      ? <SopEditor category={category} entry={editingEntry} onCancel={() => setEditingId(null)} onSave={(entry) => { upsertSop(entry); setEditingId(null) }} />
      : <section className="sop-entries" aria-label="SOP 清單"><div className="section-heading"><h2>{categories.find((item) => item.id === category)?.label}</h2><button type="button" onClick={() => setEditingId('new')}>新增 SOP</button></div>{entries.length ? entries.map((entry) => <article key={entry.id}><div><h3>{entry.title}</h3><p>{entry.when} · {entry.owner} · 更新於 {entry.updatedAt}</p></div><ol>{entry.steps.map((step, index) => <li key={`${entry.id}-${index}`}>{step}</li>)}</ol>{entry.notes && <p>{entry.notes}</p>}{entry.links.length > 0 && <ul>{entry.links.map((link) => <li key={`${entry.id}-${link.url}`}><a href={link.url}>{link.label}</a></li>)}</ul>}<button type="button" onClick={() => setEditingId(entry.id)}>編輯 SOP</button></article>) : <p className="empty-state">此分類尚未建立 SOP。</p>}</section>}
  </section>
}
