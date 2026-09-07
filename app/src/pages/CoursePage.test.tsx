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
})
