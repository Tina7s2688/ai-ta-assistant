import { useMemo, useState } from 'react'
import { TaskCard } from '../components/TaskCard'
import { TaskEditor } from '../components/TaskEditor'
import { getSemesterWeek, getWeekDateRange } from '../domain/semester'
import { sortTasksForDashboard } from '../domain/tasks'
import type { Task } from '../domain/types'
import { useAppData } from '../lib/store'

export interface DashboardPageProps { now?: Date }

function isInCurrentWeek(task: Task, week: number): boolean {
  if (task.week === week) return true
  return task.schedule.kind === 'weekly' && task.schedule.startWeek <= week && task.schedule.endWeek >= week
}

export function DashboardPage({ now = new Date() }: DashboardPageProps) {
  const { data, createTask, updateTask, completeTask, archiveTask } = useAppData()
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [isCreating, setIsCreating] = useState(false)
  const currentWeek = getSemesterWeek(now) ?? 1
  const dateRange = getWeekDateRange(currentWeek)
  const activeTasks = useMemo(() => sortTasksForDashboard(data.tasks.filter((task) => !task.archived && task.status !== 'done'), now), [data.tasks, now])
  const weeklyTasks = activeTasks.filter((task) => isInCurrentWeek(task, currentWeek))
  const completedTasks = useMemo(() => sortTasksForDashboard(data.tasks.filter((task) => !task.archived && task.status === 'done'), now), [data.tasks, now])
  const confirmationTasks = activeTasks.filter((task) => task.status === 'needsConfirmation' || task.lane === 'needsConfirmation')
  const closeEditor = () => { setEditingTask(undefined); setIsCreating(false) }

  return <section className="dashboard-page">
    <header className="dashboard-header"><div><p className="eyebrow">本週教學工作</p><h1>教學儀表板</h1><p><span>W{currentWeek}</span> · {dateRange.start} 至 {dateRange.end}</p></div><button type="button" onClick={() => setIsCreating(true)}>新增工作</button></header>
    {(isCreating || editingTask) && <TaskEditor task={editingTask} onCancel={closeEditor} onSave={(draft) => { if (editingTask) updateTask(editingTask.id, draft); else createTask(draft); closeEditor() }} />}
    <section aria-labelledby="urgent-heading"><h2 id="urgent-heading">緊急工作</h2><div className="task-grid">{activeTasks.map((task) => <TaskCard key={task.id} task={task} onComplete={(item) => completeTask(item.id, item.completionNote)} onReopen={(item) => updateTask(item.id, { status: 'todo', completedAt: undefined })} onEdit={setEditingTask} onArchive={(item) => archiveTask(item.id)} />)}</div></section>
    <section aria-labelledby="weekly-heading"><h2 id="weekly-heading">本週課程工作</h2>{['CDPS', 'BNA', 'COMMON'].map((courseId) => <div key={courseId} className="course-tasks"><h3>{courseId}</h3>{weeklyTasks.filter((task) => task.courseId === courseId).map((task) => <p key={task.id}>{task.title}</p>) || <p>本週沒有工作。</p>}</div>)}</section>
    <section aria-labelledby="confirmation-heading"><h2 id="confirmation-heading">待確認事項</h2>{confirmationTasks.length ? confirmationTasks.map((task) => <p key={task.id}>{task.title}</p>) : <p>目前沒有待確認事項。</p>}</section>
    <section aria-labelledby="completed-heading"><h2 id="completed-heading">完成紀錄</h2><div className="task-grid">{completedTasks.map((task) => <TaskCard key={task.id} task={task} onComplete={(item) => completeTask(item.id, item.completionNote)} onReopen={(item) => updateTask(item.id, { status: 'todo', completedAt: undefined })} onEdit={setEditingTask} onArchive={(item) => archiveTask(item.id)} />)}</div></section>
  </section>
}
