import { useState } from 'react'
import type { CourseId, Lane, Schedule, Task, TaskStatus } from '../domain/types'

type EditableTask = Omit<Task, 'id' | 'completedAt'>

interface TaskEditorProps {
  task?: Task
  onSave: (task: EditableTask) => void
  onCancel: () => void
}

const lanes: Lane[] = ['beforeClass', 'inClass', 'afterClass', 'needsConfirmation', 'closing']
const statuses: TaskStatus[] = ['todo', 'inProgress', 'needsConfirmation', 'done']

function taskToDraft(task?: Task): EditableTask {
  return task ? { ...task, links: task.links.map((link) => ({ ...link })), checklist: [...task.checklist] } : {
    title: '', courseId: 'CDPS', status: 'todo', lane: 'beforeClass', schedule: { kind: 'once' }, checklist: [], links: [], notes: '', completionNote: '', archived: false, sortOrder: 0,
  }
}

function dateTimeValue(schedule: Schedule): string {
  return schedule.kind === 'once' && schedule.dueAt ? schedule.dueAt.slice(0, 16) : ''
}

export function TaskEditor({ task, onSave, onCancel }: TaskEditorProps) {
  const [draft, setDraft] = useState(() => taskToDraft(task))
  const set = <K extends keyof EditableTask>(key: K, value: EditableTask[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const schedule = draft.schedule

  return <section className="task-editor" aria-labelledby="task-editor-title">
    <div className="editor-heading"><h2 id="task-editor-title">{task ? '編輯工作' : '新增工作'}</h2><button type="button" onClick={onCancel}>取消</button></div>
    <p className="privacy-reminder" role="note">隱私提醒：請勿輸入學生姓名、學號、成績、聯絡方式或其他可識別個資。</p>
    <form onSubmit={(event) => { event.preventDefault(); onSave(draft) }}>
      <label>工作標題<input required value={draft.title} onChange={(event) => set('title', event.target.value)} /></label>
      <label>課程<select value={draft.courseId} onChange={(event) => set('courseId', event.target.value as CourseId)}><option value="CDPS">CDPS</option><option value="BNA">BNA</option><option value="COMMON">共同</option></select></label>
      <label>狀態<select value={draft.status} onChange={(event) => set('status', event.target.value as TaskStatus)}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
      <label>工作階段<select value={draft.lane} onChange={(event) => set('lane', event.target.value as Lane)}>{lanes.map((lane) => <option key={lane} value={lane}>{lane}</option>)}</select></label>
      <fieldset><legend>排程</legend>
        <label><input type="radio" checked={schedule.kind === 'once'} onChange={() => set('schedule', { kind: 'once' })} />單次</label>
        <label><input type="radio" checked={schedule.kind === 'weekly'} onChange={() => set('schedule', { kind: 'weekly', weekday: 1, startWeek: 1, endWeek: 16 })} />每週</label>
        {schedule.kind === 'once'
          ? <label>期限日期與時間<input type="datetime-local" value={dateTimeValue(schedule)} onChange={(event) => set('schedule', { kind: 'once', dueAt: event.target.value ? `${event.target.value}:00+08:00` : undefined })} /></label>
          : <div className="weekly-fields"><label>星期<select value={schedule.weekday} onChange={(event) => set('schedule', { ...schedule, weekday: Number(event.target.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6 })}>{[0, 1, 2, 3, 4, 5, 6].map((day) => <option key={day} value={day}>{day}</option>)}</select></label><label>起始週<input type="number" min="1" max="16" value={schedule.startWeek} onChange={(event) => set('schedule', { ...schedule, startWeek: Number(event.target.value) })} /></label><label>結束週<input type="number" min="1" max="16" value={schedule.endWeek} onChange={(event) => set('schedule', { ...schedule, endWeek: Number(event.target.value) })} /></label><label>時間<input type="time" value={schedule.time ?? ''} onChange={(event) => set('schedule', { ...schedule, time: event.target.value || undefined })} /></label></div>}
      </fieldset>
      <label>清單（一行一項）<textarea value={draft.checklist.join('\n')} onChange={(event) => set('checklist', event.target.value.split('\n').filter(Boolean))} /></label>
      <label>連結（一行：標籤 | URL）<textarea value={draft.links.map((link) => `${link.label} | ${link.url}`).join('\n')} onChange={(event) => set('links', event.target.value.split('\n').filter(Boolean).map((line) => { const [label, url] = line.split('|').map((part) => part.trim()); return { label: label ?? '', url: url ?? '' } }))} /></label>
      <label>備註<textarea value={draft.notes} onChange={(event) => set('notes', event.target.value)} /></label>
      <label>完成註記<textarea value={draft.completionNote} onChange={(event) => set('completionNote', event.target.value)} /></label>
      <button type="submit">儲存工作</button>
    </form>
  </section>
}
