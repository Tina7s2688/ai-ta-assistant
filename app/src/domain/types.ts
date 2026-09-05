export type CourseId = 'CDPS' | 'BNA' | 'COMMON'

export type TaskStatus = 'todo' | 'inProgress' | 'needsConfirmation' | 'done'
export type Lane = 'beforeClass' | 'inClass' | 'afterClass' | 'needsConfirmation' | 'closing'

export type Schedule =
  | { kind: 'once'; dueAt?: string }
  | { kind: 'weekly'; weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6; startWeek: number; endWeek: number; time?: string }

export interface Task {
  id: string
  title: string
  courseId: CourseId
  status: TaskStatus
  lane?: Lane
  week?: number
  schedule: Schedule
  checklist: string[]
  links: Array<{ label: string; url: string }>
  notes: string
  completionNote: string
  completedAt?: string
  archived: boolean
  sortOrder: number
}

export interface SpecialDate {
  id: string
  courseId: CourseId
  date: string
  kind: 'holiday' | 'makeup' | 'changed'
  label: string
  notes: string
}

export interface SopEntry {
  id: string
  category: 'email' | 'moodle' | 'grouping' | 'assessment' | 'classroom' | 'tools'
  title: string
  when: string
  owner: string
  steps: string[]
  notes: string
  links: Array<{ label: string; url: string }>
  updatedAt: string
}

export interface Course {
  id: Exclude<CourseId, 'COMMON'>
  title: string
  day: 'Monday' | 'Wednesday'
  time: string
  location: string
}

export interface RoadmapWeek {
  week: number
  topic: string
}

export interface AppData {
  schemaVersion: 1
  tasks: Task[]
  specialDates: SpecialDate[]
  sopEntries: SopEntry[]
}
