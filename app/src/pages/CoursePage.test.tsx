import { cleanup, render, screen } from '@testing-library/react'
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
  })
})
