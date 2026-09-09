import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { seedData } from '../data/seed'
import type { Task } from '../domain/types'
import { appStorageKey } from '../lib/storage'
import { AppDataProvider } from '../lib/store'
import { DashboardPage } from './DashboardPage'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('DashboardPage', () => {
  it('moves the card marked complete into the completed records', async () => {
    const user = userEvent.setup()

    render(<AppDataProvider><DashboardPage now={new Date('2026-09-07T09:00:00+08:00')} /></AppDataProvider>)

    expect(screen.getByText('W1')).toBeInTheDocument()
    expect(screen.getByText('W1 自我介紹影片作業區準備')).toBeInTheDocument()

    const weeklyTasks = screen.getByRole('region', { name: '本週課程工作' })
    await user.click(within(weeklyTasks).getAllByRole('button', { name: '標記完成' })[0])

    const completedRecords = screen.getByRole('region', { name: '完成紀錄' })
    expect(within(completedRecords).getByText('W1 自我介紹影片作業區準備')).toBeInTheDocument()
  })

  it('does not render a future non-urgent task in the urgent section', () => {
    const futureTask: Task = {
      id: 'future-task',
      title: '下週才開始整理教材',
      courseId: 'BNA',
      status: 'todo',
      lane: 'beforeClass',
      schedule: { kind: 'once', dueAt: '2026-09-10T11:00:00+08:00' },
      checklist: [],
      links: [],
      notes: '',
      completionNote: '',
      archived: false,
      sortOrder: 3,
    }
    window.localStorage.setItem(appStorageKey, JSON.stringify({ ...seedData, tasks: [...seedData.tasks, futureTask] }))

    render(<AppDataProvider><DashboardPage now={new Date('2026-09-05T10:00:00+08:00')} /></AppDataProvider>)

    expect(within(screen.getByRole('region', { name: '緊急工作' })).queryByText('下週才開始整理教材')).not.toBeInTheDocument()
  })

  it('shows an empty-state message for course groups without weekly tasks', () => {
    render(<AppDataProvider><DashboardPage now={new Date('2026-09-05T10:00:00+08:00')} /></AppDataProvider>)

    expect(screen.getAllByText('本週沒有工作。')).toHaveLength(1)
  })

  it('shows an explicit out-of-term state and nearest available week', () => {
    render(<AppDataProvider><DashboardPage now={new Date('2027-01-02T10:00:00+08:00')} /></AppDataProvider>)

    expect(screen.getByText('學期外')).toBeInTheDocument()
    expect(screen.getByText(/最近可查看週次：W16/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '前往 CDPS' })).toHaveAttribute('href', '/courses/CDPS')
    expect(screen.getByRole('link', { name: '前往 BNA' })).toHaveAttribute('href', '/courses/BNA')
  })
})
