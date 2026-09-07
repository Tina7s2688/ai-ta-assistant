import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { AppDataProvider } from '../lib/store'
import { SopPage } from './SopPage'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('SopPage', () => {
  it('shows all six SOP categories and the no-PII reminder', () => {
    render(<AppDataProvider><SopPage /></AppDataProvider>)

    expect(screen.getByRole('tab', { name: '寄信與通知' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Moodle' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '分組' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '作業與成績' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '教室與器材' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '課程工具' })).toBeInTheDocument()
    expect(screen.getByText('請勿輸入學生個資、成績或作業內容。')).toBeInTheDocument()
  })

  it('saves an editable SOP entry with ordered steps', async () => {
    const user = userEvent.setup()
    render(<AppDataProvider><SopPage /></AppDataProvider>)

    await user.click(screen.getByRole('tab', { name: '課程工具' }))
    await user.click(screen.getByRole('button', { name: '新增 SOP' }))
    await user.type(screen.getByLabelText('SOP 標題'), 'NotebookLM 課前整理')
    await user.type(screen.getByLabelText('適用時機'), '課前一天')
    await user.type(screen.getByLabelText('負責人'), '助教')
    fireEvent.change(screen.getByLabelText('步驟（一行一項）'), { target: { value: '整理公開教材\n建立筆記本' } })
    await user.click(screen.getByRole('button', { name: '儲存 SOP' }))

    expect(screen.getByText('NotebookLM 課前整理')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem('ai-ta-assistant:v1') ?? '{}').sopEntries).toContainEqual(expect.objectContaining({
      category: 'tools',
      steps: ['整理公開教材', '建立筆記本'],
    }))
  })
})
