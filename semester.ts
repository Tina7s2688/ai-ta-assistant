import { seedData } from '../data/seed'
import type { CourseId, SpecialDate } from './types'

const semesterStart = new Date('2026-09-07T00:00:00+08:00')
const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000
const semesterWeeks = 16

export function getSemesterWeek(date: Date): number | null {
  const week = Math.floor((date.getTime() - semesterStart.getTime()) / millisecondsPerWeek) + 1

  return week >= 1 && week <= semesterWeeks ? week : null
}

export function getWeekDateRange(week: number): { start: string; end: string } {
  const firstDay = new Date(Date.UTC(2026, 8, 7 + (week - 1) * 7))
  const lastDay = new Date(Date.UTC(2026, 8, 13 + (week - 1) * 7))

  return {
    start: firstDay.toISOString().slice(0, 10),
    end: lastDay.toISOString().slice(0, 10),
  }
}

export function getSpecialDate(courseId: CourseId, date: string): SpecialDate | undefined {
  return seedData.specialDates.find((specialDate) => specialDate.courseId === courseId && specialDate.date === date)
}
