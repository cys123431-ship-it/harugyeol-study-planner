import { describe, expect, it } from 'vitest'
import { createEmptyData } from '../data/seed'
import type { Plan } from '../types'
import { archiveExpiredDeadlinePlans, formatDday, getDday } from './deadlines'

function deadlinePlan(date: string): Plan {
  const now = '2026-07-01T00:00:00.000Z'
  return {
    id: 'deadline-1',
    title: '정보처리기사 시험',
    description: '',
    categoryId: 'cat-cert',
    planType: 'deadline',
    startDate: date,
    endDate: date,
    timezone: 'Asia/Seoul',
    recurrenceRule: { frequency: 'none' },
    excludedWeekdays: [],
    excludedDates: [],
    carryOverPolicy: 'ask',
    color: '#75a99f',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
}

describe('D-day와 자동 보관', () => {
  it('남은 날짜를 D-day 문구로 표시한다', () => {
    expect(getDday(deadlinePlan('2026-07-20'), '2026-07-15')).toBe(5)
    expect(formatDday(5)).toBe('D-5')
    expect(formatDday(0)).toBe('D-DAY')
  })

  it('마감 다음 날 활성 계획을 보관하고 당일 계획은 유지한다', () => {
    const data = createEmptyData()
    data.plans = [deadlinePlan('2026-07-14'), { ...deadlinePlan('2026-07-15'), id: 'deadline-2' }]
    const archived = archiveExpiredDeadlinePlans(data, '2026-07-15')
    expect(archived.plans[0].status).toBe('archived')
    expect(archived.plans[1].status).toBe('active')
  })
})
