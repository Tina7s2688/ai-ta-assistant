import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { AppDataProvider } from '../lib/store'
import { DashboardPage } from './DashboardPage'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('DashboardPage', () => {
  it('shows the current week and keeps a completed task in the completed records', async () => {
    const user = userEvent.setup()

    render(<AppDataProvider><DashboardPage now={new Date('2026-09-05T10:00:00+08:00')} /></AppDataProvider>)

    expect(screen.getByText('W1')).toBeInTheDocument()
    expect(screen.getByText('確認課前表單回覆與分組交接')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '標記完成' }))

    expect(screen.getByText(/完成紀錄/)).toBeInTheDocument()
    expect(screen.getByText('確認課前表單回覆與分組交接')).toBeInTheDocument()
  })
})
