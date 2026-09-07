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

export const bnaRoadmap: RoadmapWeek[] = Array.from({ length: 16 }, (_, index) => ({
  week: index + 1,
  topic: index === 0 ? 'Course Orientation' : '暫定課程架構 / 待確認',
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
  tasks: [
    {
      id: 'cdps-w1-form-and-group-handoff',
      title: '確認課前表單回覆與分組交接',
      courseId: 'CDPS',
      status: 'done',
      lane: 'beforeClass',
      week: 1,
      schedule: { kind: 'once', dueAt: '2026-09-05T10:00:00+08:00' },
      checklist: ['檢查課前表單回覆', '確認分組交接事項'],
      links: [],
      notes: '僅記錄教學流程，不填寫學生個資。',
      completionNote: '已於課前完成確認。',
      completedAt: '2026-09-05T10:00:00+08:00',
      archived: false,
      sortOrder: 1,
    },
    {
      id: 'cdps-w1-course-notice',
      title: '發布第一週課程提醒',
      courseId: 'CDPS',
      status: 'todo',
      lane: 'beforeClass',
      week: 1,
      schedule: { kind: 'once', dueAt: '2026-09-07T10:00:00+08:00' },
      checklist: ['確認公告內容'],
      links: [],
      notes: '使用課程平台公告，勿貼入學生個資。',
      completionNote: '',
      archived: false,
      sortOrder: 2,
    },
    {
      id: 'common-industry-academia-closing-report',
      title: '產學共構成果報告',
      courseId: 'COMMON',
      status: 'needsConfirmation',
      lane: 'closing',
      schedule: { kind: 'once' },
      checklist: [],
      links: [],
      notes: '待確認結案時程；未設定期限。',
      completionNote: '',
      archived: false,
      sortOrder: 3,
    },
    {
      id: 'common-emi-closing-report',
      title: 'EMI 課程期末報告書',
      courseId: 'COMMON',
      status: 'needsConfirmation',
      lane: 'closing',
      schedule: { kind: 'once' },
      checklist: [],
      links: [],
      notes: '待確認結案時程；未設定期限。',
      completionNote: '',
      archived: false,
      sortOrder: 4,
    },
  ],
  specialDates,
  sopEntries: [
    { id: 'sop-course-pre-class-notice', category: 'email', title: 'Course Pre-Class Notice', when: '每次上課前 1–2 天', owner: '助教', steps: ['確認本週主題與公開教材', '發布課前提醒'], notes: '只提供課程共通資訊，不列入學生資料。', links: [], updatedAt: '2026-09-07' },
    { id: 'sop-grouping', category: 'grouping', title: 'Grouping', when: '分組活動前', owner: '助教', steps: ['確認分組規則', '在課程平台公告分組方式'], notes: '不在 SOP 保留學生姓名或分組名單。', links: [], updatedAt: '2026-09-07' },
    { id: 'sop-moodle-assignment-area', category: 'moodle', title: 'Moodle Assignment Area', when: '作業發布前', owner: '助教', steps: ['確認截止時間', '檢查繳交設定與說明'], notes: '不記錄學生繳交內容。', links: [], updatedAt: '2026-09-07' },
    { id: 'sop-classroom-check', category: 'classroom', title: '教室與器材檢查', when: '上課前', owner: '助教', steps: ['確認投影與網路', '準備公開教材'], notes: '僅記錄設備流程。', links: [], updatedAt: '2026-09-07' },
    { id: 'sop-coggle', category: 'tools', title: 'Coggle', when: '課堂活動前', owner: '助教', steps: ['建立課程共用圖', '確認公開提示內容'], notes: '不輸入學生個資或私人內容。', links: [], updatedAt: '2026-09-07' },
    { id: 'sop-notebooklm', category: 'tools', title: 'NotebookLM', when: '課前整理時', owner: '助教', steps: ['整理公開教材', '建立課程筆記本'], notes: '只使用可公開或已授權的課程資料。', links: [], updatedAt: '2026-09-07' },
  ],
}
