import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TaskEditor } from './TaskEditor'

describe('TaskEditor', () => {
  it('places the exact privacy reminder beside editable task details', () => {
    render(<TaskEditor onCancel={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getAllByText('請勿輸入學生個資、成績或作業內容。')).toHaveLength(2)
    expect(screen.getByLabelText('備註')).toBeInTheDocument()
    expect(screen.getByLabelText('完成註記')).toBeInTheDocument()
  })
})
