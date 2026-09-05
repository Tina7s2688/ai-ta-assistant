import type { AppData, Course, RoadmapWeek, SpecialDate } from '../domain/types'

export const courses: Course[] = [
  {
    id: 'CDPS',
    title: 'Co-opetitive Dynamics and Platform Strategy',
    day: 'Monday',
    time: '14:30–17:20',
    location: '管理學院 B15',
  },
  {
    id: 'BNA',
    title: 'Business News and Analysis',
    day: 'Wednesday',
    time: '09:10–12:00',
    location: '管理學院 B15',
  },
]

const cdpsTopics = [
  'Orientation / Team Building',
  'AI Introduction',
  'Co-opetition + BI / vibe coding',
  'Co-opetition + BI / vibe coding',
  'Co-opetition + BI / vibe coding',
  'Competitive Dynamics + DA',
  'Competitive Dynamics + DA',
  'Competitive Dynamics + DA',
  'TP Proposal / Midterm Peer Review',
  'Platform Revolution + BPA',
  'Platform Revolution + BPA',
  'Platform Revolution + BPA',
  'AI Agent / Deployment / TP',
  'AI Agent / Deployment / TP',
  'AI Agent / Deployment / TP',
  'TP Presentation / Final Peer Review',
] as const

export const cdpsRoadmap: RoadmapWeek[] = cdpsTopics.map((topic, index) => ({
  week: index + 1,
  topic,
}))

export const specialDates: SpecialDate[] = [
  {
    id: 'cdps-w4-holiday',
    courseId: 'CDPS',
    date: '2026-09-28',
    kind: 'holiday',
    label: '假日，無正常上課',
    notes: '保留原定課程主題，待確認補課日期與安排。',
  },
  {
    id: 'cdps-w8-holiday',
    courseId: 'CDPS',
    date: '2026-10-26',
    kind: 'holiday',
    label: '假日，無正常上課',
    notes: '保留原定課程主題，待確認補課日期與安排。',
  },
]

export const seedData: AppData = {
  schemaVersion: 1,
  tasks: [],
  specialDates,
  sopEntries: [],
}
