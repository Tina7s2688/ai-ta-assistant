import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(cleanup)

function renderAt(pathname: string) {
  window.history.pushState({}, '', pathname)
  render(<App />)
}

describe('AI TA assistant shell routes', () => {
  it('shows the dashboard at the root route', () => {
    renderAt('/')

    expect(screen.getByRole('heading', { name: '教學儀表板' })).toBeInTheDocument()
  })

  it('shows the selected course identifier on a course route', () => {
    renderAt('/courses/physics-101')

    expect(screen.getByRole('heading', { name: '課程：physics-101' })).toBeInTheDocument()
  })

  it('links to both course roadmaps from the sidebar', () => {
    renderAt('/')

    expect(screen.getByRole('link', { name: 'CDPS 課程' })).toHaveAttribute('href', '/courses/CDPS')
    expect(screen.getByRole('link', { name: 'BNA 課程' })).toHaveAttribute('href', '/courses/BNA')
  })

  it.each([
    ['/tasks', '任務管理'],
    ['/sop', '教學 SOP'],
    ['/backup', '本機備份'],
  ])('shows %s at %s', (pathname, heading) => {
    renderAt(pathname)

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  })
})
