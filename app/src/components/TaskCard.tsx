import type { Task } from '../domain/types'

interface TaskCardProps {
  task: Task
  onComplete: (task: Task) => void
  onReopen: (task: Task) => void
  onEdit: (task: Task) => void
  onArchive: (task: Task) => void
}

export function TaskCard({ task, onComplete, onReopen, onEdit, onArchive }: TaskCardProps) {
  const isComplete = task.status === 'done'

  return <article className={`task-card${isComplete ? ' is-complete' : ''}`}>
    <div>
      <p className="task-card-meta">{task.courseId} · {task.lane ?? '未分類'} · {task.status}</p>
      <h3>{task.title}</h3>
      {task.schedule.kind === 'once' && task.schedule.dueAt && <p>期限：{new Date(task.schedule.dueAt).toLocaleString('zh-TW')}</p>}
      {task.schedule.kind === 'weekly' && <p>每週第 {task.schedule.weekday} 天 · W{task.schedule.startWeek}–W{task.schedule.endWeek}</p>}
      {task.completionNote && <p>完成註記：{task.completionNote}</p>}
    </div>
    <div className="task-card-actions">
      {isComplete
        ? <button type="button" onClick={() => onReopen(task)}>重新開啟</button>
        : <button type="button" onClick={() => onComplete(task)}>標記完成</button>}
      <button type="button" onClick={() => onEdit(task)}>編輯</button>
      <button type="button" onClick={() => onArchive(task)}>封存</button>
    </div>
  </article>
}
