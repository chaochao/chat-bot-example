import { describe, it, expect } from 'vitest'
import {
  getMonthGrid,
  getWeekDays,
  navigateMonth,
  navigateWeek,
  formatDateKey,
  isToday,
  getQueryRange,
  groupByDateAndDept,
  groupByDateTypeDept,
  formatRoleSummary
} from '@/pulse/lib/calendarUtils'
import type { Shift } from '@/pulse/types'

describe('getMonthGrid', () => {
  it('returns 4–6 weeks of 7 days each', () => {
    const grid = getMonthGrid(new Date(2026, 4, 1)) // May 2026
    expect(grid.length).toBeGreaterThanOrEqual(4)
    expect(grid.length).toBeLessThanOrEqual(6)
    grid.forEach(week => expect(week.length).toBe(7))
  })

  it('first cell is a Sunday', () => {
    const grid = getMonthGrid(new Date(2026, 4, 1))
    expect(grid[0][0].getDay()).toBe(0)
  })

  it('last cell is a Saturday', () => {
    const grid = getMonthGrid(new Date(2026, 4, 1))
    const lastWeek = grid[grid.length - 1]
    expect(lastWeek[6].getDay()).toBe(6)
  })
})

describe('getWeekDays', () => {
  it('returns exactly 7 days', () => {
    expect(getWeekDays(new Date(2026, 4, 19)).length).toBe(7)
  })

  it('starts on Sunday', () => {
    const days = getWeekDays(new Date(2026, 4, 19)) // Tuesday May 19
    expect(days[0].getDay()).toBe(0)
  })

  it('ends on Saturday', () => {
    const days = getWeekDays(new Date(2026, 4, 19))
    expect(days[6].getDay()).toBe(6)
  })
})

describe('navigateMonth', () => {
  it('advances by one month', () => {
    expect(navigateMonth(new Date(2026, 4, 1), 'next').getMonth()).toBe(5)
  })

  it('goes back by one month', () => {
    expect(navigateMonth(new Date(2026, 4, 1), 'prev').getMonth()).toBe(3)
  })

  it('wraps year correctly', () => {
    expect(navigateMonth(new Date(2026, 0, 1), 'prev').getFullYear()).toBe(2025)
  })
})

describe('navigateWeek', () => {
  it('advances by one week', () => {
    const result = navigateWeek(new Date(2026, 4, 19), 'next')
    expect(result.getDate()).toBe(26)
  })

  it('goes back by one week', () => {
    const result = navigateWeek(new Date(2026, 4, 19), 'prev')
    expect(result.getDate()).toBe(12)
  })
})

describe('formatDateKey', () => {
  it('formats to yyyy-MM-dd', () => {
    expect(formatDateKey(new Date(2026, 4, 3))).toBe('2026-05-03')
  })
})

describe('isToday', () => {
  it('returns true for today', () => {
    expect(isToday(new Date())).toBe(true)
  })

  it('returns false for yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isToday(yesterday)).toBe(false)
  })
})

describe('getQueryRange', () => {
  it('month range starts on a Sunday', () => {
    const { start } = getQueryRange('month', new Date(2026, 4, 1))
    expect(start.getDay()).toBe(0)
  })

  it('week range spans 7 days', () => {
    const { start, end } = getQueryRange('week', new Date(2026, 4, 19))
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    expect(diff).toBe(6)
  })
})

describe('groupByDateAndDept', () => {
  const shifts = [
    { date: '2026-05-19T00:00:00Z', departmentId: 'dept-1', staff: { role: 'RN', name: 'A', department: {} } },
    { date: '2026-05-19T00:00:00Z', departmentId: 'dept-1', staff: { role: 'MD', name: 'B', department: {} } },
    { date: '2026-05-20T00:00:00Z', departmentId: 'dept-2', staff: { role: 'RN', name: 'C', department: {} } },
  ] as unknown as Shift[]

  it('groups by date key then departmentId', () => {
    const result = groupByDateAndDept(shifts)
    expect(Object.keys(result)).toContain('2026-05-19')
    expect(result['2026-05-19']['dept-1']).toHaveLength(2)
    expect(result['2026-05-20']['dept-2']).toHaveLength(1)
  })
})

describe('groupByDateTypeDept', () => {
  const shifts = [
    { date: '2026-05-19T00:00:00Z', departmentId: 'dept-1', type: 'day', staff: { role: 'RN', name: 'A', department: {} } },
    { date: '2026-05-19T00:00:00Z', departmentId: 'dept-1', type: 'night', staff: { role: 'RN', name: 'B', department: {} } },
  ] as unknown as Shift[]

  it('groups by date → shiftType → departmentId', () => {
    const result = groupByDateTypeDept(shifts)
    expect(result['2026-05-19']['day']['dept-1']).toHaveLength(1)
    expect(result['2026-05-19']['night']['dept-1']).toHaveLength(1)
  })
})

describe('formatRoleSummary', () => {
  it('counts roles and formats as "N Role"', () => {
    const shifts = [
      { staff: { role: 'RN' } },
      { staff: { role: 'RN' } },
      { staff: { role: 'MD' } },
    ] as unknown as Shift[]
    const result = formatRoleSummary(shifts)
    expect(result).toContain('2 RN')
    expect(result).toContain('1 MD')
  })
})
