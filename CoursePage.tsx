import { useEffect, useMemo, useState } from 'react'
import { TaskEditor } from '../components/TaskEditor'
import { TaskCard } from '../components/TaskCard'
import { WeekRoadmap } from '../components/WeekRoadmap'
import { bnaRoadmap, cdpsRoadmap, courses } from '../data/seed'
import type { CourseId, Lane, Task } from '../domain/types'
import { getTasksForWeek } from '../domain/tasks'
import { useAppData } from '../lib/store'

export interface CoursePageProps { courseId: string; selectedWeek?: number }

const lanes: Array<{ id: Lane; label: string }> = [
  { id: 'beforeClass', label: '課前' }, { id: 'inClass', label: '課堂當天' }, { id: 'afterClass', label: '課後' }, { id: 'needsConfirmation', label: '待確認' },
]

function taskAppliesToWeek(task: Task, week: number): boolean {
  return task.week === week || (task.schedule.kind === 'weekly' && task.schedule.startWeek <= week && task.schedule.endWeek >= week)
}

export function CoursePage({ courseId, selectedWeek = 1 }: CoursePageProps) {
  const { data, createTask, setSpecialDate, updateTask, completeTask, archiveTask } = useAppData()
  const [week, setWeek] = useState(selectedWeek)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [showAdjustment, setShowAdjustment] = useState(false)
  const [adjustmentDate, setAdjustmentDate] = useState('')
  const [adjustmentKind, setAdjustmentKind] = useState<'makeup' | 'changed'>('makeup')
  const [adjustmentLabel, setAdjustmentLabel] = useState('')
  const course = courses.find((item) => item.id === courseId)
  const roadmap = courseId === 'CDPS' ? cdpsRoadmap : courseId === 'BNA' ? bnaRoadmap : []
  const weekStart = new Date(Date.UTC(2026, 8, 7 + (week - 1) * 7)).toISOString().slice(0, 10)
  const weekEnd = new Date(Date.UTC(2026, 8, 13 + (week - 1) * 7)).toISOString().slice(0, 10)
  const specialDates = useMemo(() => data.specialDates.filter((item) => item.courseId === courseId && item.date >= weekStart && item.date <= weekEnd), [courseId, data.specialDates, weekEnd, weekStart])
  const holiday = specialDates.find((item) => item.kind === 'holiday')

  useEffect(() => {
    if (!holiday || data.tasks.some((task) => task.courseId === courseId && task.week === week && task.title === '確認補課日期與安排')) return
    createTask({ title: '確認補課日期與安排', courseId: courseId as CourseId, status: 'needsConfirmation', lane: 'needsConfirmation', week, schedule: { kind: 'once' }, checklist: [], links: [], notes: '假日調整，原定課程主題維持不變。', completionNote: '', archived: false, sortOrder: data.tasks.length + 1 })
  }, [courseId, createTask, data.tasks, holiday, week])

  if (!course) return <section className="page-placeholder"><h1>課程：{courseId}</h1><p>課程內容將保留在此裝置上。</p></section>
  const weekTasks = [...data.tasks.filter((task) => !task.archived && task.schedule.kind === 'once' && task.courseId === courseId && taskAppliesToWeek(task, week)), ...getTasksForWeek(data.tasks.filter((task) => task.courseId === courseId), data.recurringOverrides ?? [], week).filter((task) => !task.archived)]

  return <section className="course-page">
    <header><p className="eyebrow">課程 Roadmap</p><h1>{course.title}</h1><p>{course.day} · {course.time} · {course.location}</p></header>
    {roadmap.length ? <WeekRoadmap roadmap={roadmap} selectedWeek={week} onSelectWeek={setWeek} specialDate={holiday} adjustments={specialDates.filter((item) => item.kind !== 'holiday')} /> : <p>尚未建立此課程 Roadmap。</p>}
    <section className="date-adjustments"><h2>日期調整</h2><button type="button" onClick={() => setShowAdjustment(true)}>新增日期調整</button>{showAdjustment && <form onSubmit={(event) => { event.preventDefault(); if (!adjustmentDate || !adjustmentLabel.trim()) return; setSpecialDate({ id: `${courseId}-${adjustmentDate}-${adjustmentKind}`, courseId: courseId as CourseId, date: adjustmentDate, kind: adjustmentKind, label: adjustmentLabel.trim(), notes: '使用者新增的日期調整。' }); setShowAdjustment(false); setAdjustmentDate(''); setAdjustmentLabel('') }}><label>調整日期<input type="date" value={adjustmentDate} onChange={(event) => setAdjustmentDate(event.target.value)} required /></label><label>調整類型<select value={adjustmentKind} onChange={(event) => setAdjustmentKind(event.target.value as 'makeup' | 'changed')}><option value="makeup">補課</option><option value="changed">課程調整</option></select></label><label>調整說明<input value={adjustmentLabel} onChange={(event) => setAdjustmentLabel(event.target.value)} required /></label><button type="submit">儲存日期調整</button></form>}</section>
    {editingTask && <TaskEditor task={editingTask} onCancel={() => setEditingTask(undefined)} onSave={(draft) => { updateTask(editingTask.id, draft); setEditingTask(undefined) }} />}
    <section className="work-lanes" aria-label="課程工作 lanes">
      {lanes.map((lane) => { const laneTasks = weekTasks.filter((task) => task.lane === lane.id); return <article key={lane.id}><h2>{lane.label}</h2>{laneTasks.length ? laneTasks.map((task) => <TaskCard key={task.id} task={task} onComplete={(item) => completeTask(item.id, item.completionNote)} onReopen={(item) => updateTask(item.id, { status: 'todo', completedAt: undefined })} onEdit={setEditingTask} onArchive={(item) => archiveTask(item.id)} />) : <p className="empty-state">沒有工作。</p>}</article> })}
    </section>
  </section>
}
