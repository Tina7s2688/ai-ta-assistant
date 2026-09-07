import { useEffect, useMemo, useState } from 'react'
import { WeekRoadmap } from '../components/WeekRoadmap'
import { bnaRoadmap, cdpsRoadmap, courses } from '../data/seed'
import type { CourseId, Lane, Task } from '../domain/types'
import { useAppData } from '../lib/store'

export interface CoursePageProps { courseId: string; selectedWeek?: number }

const lanes: Array<{ id: Lane; label: string }> = [
  { id: 'beforeClass', label: '課前' }, { id: 'inClass', label: '課堂當天' }, { id: 'afterClass', label: '課後' }, { id: 'needsConfirmation', label: '待確認' },
]

function taskAppliesToWeek(task: Task, week: number): boolean {
  return task.week === week || (task.schedule.kind === 'weekly' && task.schedule.startWeek <= week && task.schedule.endWeek >= week)
}

export function CoursePage({ courseId, selectedWeek = 1 }: CoursePageProps) {
  const { data, createTask } = useAppData()
  const [week, setWeek] = useState(selectedWeek)
  const course = courses.find((item) => item.id === courseId)
  const roadmap = courseId === 'CDPS' ? cdpsRoadmap : courseId === 'BNA' ? bnaRoadmap : []
  const specialDate = useMemo(() => {
    const firstMonday = new Date(Date.UTC(2026, 8, 7 + (week - 1) * 7)).toISOString().slice(0, 10)
    return data.specialDates.find((item) => item.courseId === courseId && item.date === firstMonday)
  }, [courseId, data.specialDates, week])

  useEffect(() => {
    if (!specialDate || data.tasks.some((task) => task.courseId === courseId && task.week === week && task.title === '確認補課日期與安排')) return
    createTask({ title: '確認補課日期與安排', courseId: courseId as CourseId, status: 'needsConfirmation', lane: 'needsConfirmation', week, schedule: { kind: 'once' }, checklist: [], links: [], notes: '假日調整，原定課程主題維持不變。', completionNote: '', archived: false, sortOrder: data.tasks.length + 1 })
  }, [courseId, createTask, data.tasks, specialDate, week])

  if (!course) return <section className="page-placeholder"><h1>課程：{courseId}</h1><p>課程內容將保留在此裝置上。</p></section>
  const weekTasks = data.tasks.filter((task) => !task.archived && task.courseId === courseId && taskAppliesToWeek(task, week))

  return <section className="course-page">
    <header><p className="eyebrow">課程 Roadmap</p><h1>{course.title}</h1><p>{course.day} · {course.time} · {course.location}</p></header>
    {roadmap.length ? <WeekRoadmap roadmap={roadmap} selectedWeek={week} onSelectWeek={setWeek} specialDate={specialDate} /> : <p>尚未建立此課程 Roadmap。</p>}
    <section className="work-lanes" aria-label="課程工作 lanes">
      {lanes.map((lane) => { const laneTasks = weekTasks.filter((task) => task.lane === lane.id); return <article key={lane.id}><h2>{lane.label}</h2>{laneTasks.length ? laneTasks.map((task) => <p key={task.id}>{task.title}</p>) : <p className="empty-state">沒有工作。</p>}</article> })}
    </section>
  </section>
}
