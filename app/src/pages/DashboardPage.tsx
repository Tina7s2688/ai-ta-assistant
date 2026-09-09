import { useMemo, useState } from 'react'
import { TaskCard } from '../components/TaskCard'
import { TaskEditor } from '../components/TaskEditor'
import { getSemesterWeek, getWeekDateRange } from '../domain/semester'
import { getTasksForWeek, sortTasksForDashboard } from '../domain/tasks'
import type { Task } from '../domain/types'
import { useAppData } from '../lib/store'

export interface DashboardPageProps { now?: Date }

function isInCurrentWeek(task: Task, week: number): boolean {
  if (task.week === week) return true
  return task.schedule.kind === 'weekly' && task.schedule.startWeek <= week && task.schedule.endWeek >= week
}

function isUrgentTask(task: Task, now: Date): boolean {
  if (task.status === 'done' || task.schedule.kind !== 'once' || !task.schedule.dueAt) return false

  const dueTime = new Date(task.schedule.dueAt).getTime()
  return Number.isFinite(dueTime) && dueTime <= now.getTime() + 48 * 60 * 60 * 1000
}

export function DashboardPage({ now = new Date() }: DashboardPageProps) {
  const { data, createTask, updateTask, completeTask, archiveTask } = useAppData()
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [isCreating, setIsCreating] = useState(false)
  const semesterWeek = getSemesterWeek(now)
  const currentWeek = semesterWeek ?? (now.getTime() < new Date('2026-09-07T00:00:00+08:00').getTime() ? 1 : 16)
  const dateRange = getWeekDateRange(currentWeek)
  const recurringTasks = useMemo(() => getTasksForWeek(data.tasks, data.recurringOverrides ?? [], currentWeek), [currentWeek, data.recurringOverrides, data.tasks])
  const displayedTasks = useMemo(() => [...data.tasks.filter((task) => task.schedule.kind === 'once'), ...recurringTasks], [data.tasks, recurringTasks])
  const activeTasks = useMemo(() => sortTasksForDashboard(displayedTasks.filter((task) => !task.archived && task.status !== 'done'), now), [displayedTasks, now])
  const urgentTasks = activeTasks.filter((task) => isUrgentTask(task, now))
  const weeklyTasks = activeTasks.filter((task) => isInCurrentWeek(task, currentWeek))
  const completedTasks = useMemo(() => sortTasksForDashboard(displayedTasks.filter((task) => !task.archived && task.status === 'done'), now), [displayedTasks, now])
  const confirmationTasks = activeTasks.filter((task) => task.status === 'needsConfirmation' || task.lane === 'needsConfirmation')
  const closeEditor = () => { setEditingTask(undefined); setIsCreating(false) }

  return <section className="dashboard-page">
    <header className="dashboard-header"><div><p className="eyebrow">本週教學工作</p><h1>教學儀表板</h1>{semesterWeek === null ? <p><strong>學期外</strong> · 最近可查看週次：W{currentWeek}（{dateRange.start} 至 {dateRange.end}）</p> : <p><span>W{currentWeek}</span> · {dateRange.start} 至 {dateRange.end}</p>}<p className="course-shortcuts"><a href={`${import.meta.env.BASE_URL}courses/CDPS`}>前往 CDPS</a> · <a href={`${import.meta.env.BASE_URL}courses/BNA`}>前往 BNA</a></p></div><button type="button" onClick={() => setIsCreating(true)}>新增工作</button></header>
    {(isCreating || editingTask) && <TaskEditor task={editingTask} onCancel={closeEditor} onSave={(draft) => { if (editingTask) updateTask(editingTask.id, draft); else createTask(draft); closeEditor() }} />}
    <section aria-labelledby="urgent-heading"><h2 id="urgent-heading">緊急工作</h2><div className="task-grid">{urgentTasks.map((task) => <TaskCard key={task.id} task={task} onComplete={(item) => completeTask(item.id, item.completionNote)} onReopen={(item) => updateTask(item.id, { status: 'todo', completedAt: undefined })} onEdit={setEditingTask} onArchive={(item) => archiveTask(item.id)} />)}</div></section>
    <section aria-labelledby="weekly-heading"><h2 id="weekly-heading">本週課程工作</h2>{['CDPS', 'BNA', 'COMMON'].map((courseId) => {
      const courseTasks = weeklyTasks.filter((task) => task.courseId === courseId)
      return <div key={courseId} className="course-tasks"><h3>{courseId}</h3>{courseTasks.length ? <div className="task-grid">{courseTasks.map((task) => <TaskCard key={task.id} task={task} onComplete={(item) => completeTask(item.id, item.completionNote)} onReopen={(item) => updateTask(item.id, { status: 'todo', completedAt: undefined })} onEdit={setEditingTask} onArchive={(item) => archiveTask(item.id)} />)}</div> : <p>本週沒有工作。</p>}</div>
    })}</section>
    <section aria-labelledby="confirmation-heading"><h2 id="confirmation-heading">待確認事項</h2>{confirmationTasks.length ? confirmationTasks.map((task) => <p key={task.id}>{task.title}</p>) : <p>目前沒有待確認事項。</p>}</section>
    <section aria-labelledby="completed-heading"><h2 id="completed-heading">完成紀錄</h2><div className="task-grid">{completedTasks.map((task) => <TaskCard key={task.id} task={task} onComplete={(item) => completeTask(item.id, item.completionNote)} onReopen={(item) => updateTask(item.id, { status: 'todo', completedAt: undefined })} onEdit={setEditingTask} onArchive={(item) => archiveTask(item.id)} />)}</div></section>
  </section>
}
