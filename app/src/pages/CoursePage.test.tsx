import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { AppDataProvider } from '../lib/store'
import { CoursePage } from './CoursePage'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('CoursePage', () => {
  it('preserves W4 original topic while showing the holiday adjustment and follow-up task', () => {
    render(<AppDataProvider><CoursePage courseId="CDPS" selectedWeek={4} /></AppDataProvider>)

    expect(screen.getByText('Co-opetition + BI / vibe coding')).toBeInTheDocument()
    expect(screen.getByText('假日，無正常上課')).toBeInTheDocument()
    expect(screen.getByText('確認補課日期與安排')).toBeInTheDocument()
  })

  it('renders BNA with a 16-week provisional roadmap and all four work lanes', () => {
    render(<AppDataProvider><CoursePage courseId="BNA" selectedWeek={1} /></AppDataProvider>)

    expect(screen.getAllByRole('button', { name: /^W\d+$/ })).toHaveLength(16)
    expect(screen.getByText('Course Orientation')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '課前' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '課堂當天' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '課後' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '待確認' })).toBeInTheDocument()
    expect(screen.getByText('課堂點名與教室事務')).toBeInTheDocument()
  })

  it('keeps the original topic and renders a separately added makeup adjustment', async () => {
    const user = userEvent.setup()
    render(<AppDataProvider><CoursePage courseId="CDPS" selectedWeek={2} /></AppDataProvider>)

    await user.click(screen.getByRole('button', { name: '新增日期調整' }))
    await user.type(screen.getByLabelText('調整日期'), '2026-09-16')
    await user.selectOptions(screen.getByLabelText('調整類型'), 'makeup')
    await user.type(screen.getByLabelText('調整說明'), 'W1 補課')
    await user.click(screen.getByRole('button', { name: '儲存日期調整' }))

    expect(screen.getByText('AI Introduction')).toBeInTheDocument()
    expect(screen.getByText('補課：W1 補課（2026-09-16）')).toBeInTheDocument()
  })

  it('seeds W1 orientation and W2 Coggle and NotebookLM tasks without student data', () => {
    render(<AppDataProvider><CoursePage courseId="CDPS" selectedWeek={1} /></AppDataProvider>)
    expect(screen.getByText('W1 自我介紹影片作業區準備')).toBeInTheDocument()
    expect(screen.getByText('課堂分組與組長 LINE 群建立')).toBeInTheDocument()
    expect(screen.queryByText(/Coggle/)).not.toBeInTheDocument()

    cleanup()
    render(<AppDataProvider><CoursePage courseId="CDPS" selectedWeek={2} /></AppDataProvider>)
    expect(screen.getByText('Coggle 協作設定')).toBeInTheDocument()
    expect(screen.getByText('NotebookLM 課程筆記本設定')).toBeInTheDocument()

    cleanup()
    render(<AppDataProvider><CoursePage courseId="CDPS" selectedWeek={3} /></AppDataProvider>)
    expect(screen.getByText('確認最終分組後於 Moodle 後台標記學生分組')).toBeInTheDocument()
  })
})
