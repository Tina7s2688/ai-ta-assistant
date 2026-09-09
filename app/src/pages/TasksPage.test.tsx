import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { AppDataProvider } from '../lib/store'
import { TasksPage } from './TasksPage'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('TasksPage', () => {
  it('shows undated closing reports through the end-of-semester filter', async () => {
    const user = userEvent.setup()
    render(<AppDataProvider><TasksPage /></AppDataProvider>)

    await user.click(screen.getByRole('button', { name: '學期結束後／結案' }))

    expect(screen.getByText('產學共構成果報告')).toBeInTheDocument()
    expect(screen.getByText('EMI 課程期末報告書')).toBeInTheDocument()
  })
})
