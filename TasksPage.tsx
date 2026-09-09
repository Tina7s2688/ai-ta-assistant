import { useState } from 'react'
import { useAppData } from '../lib/store'

export function TasksPage() {
  const { data } = useAppData()
  const [filter, setFilter] = useState<'active' | 'closing'>('active')
  const tasks = data.tasks.filter((task) => !task.archived && (filter === 'closing' ? task.lane === 'closing' : task.lane !== 'closing'))
  return <section className="tasks-page"><header><p className="eyebrow">工作清單</p><h1>任務管理</h1></header><div className="task-filters" aria-label="任務篩選"><button type="button" className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>進行中的工作</button><button type="button" className={filter === 'closing' ? 'active' : ''} onClick={() => setFilter('closing')}>學期結束後／結案</button></div><div className="task-list">{tasks.length ? tasks.map((task) => <article key={task.id}><h2>{task.title}</h2><p>{task.status === 'needsConfirmation' ? '待確認' : task.status}</p></article>) : <p>目前沒有工作。</p>}</div></section>
}
