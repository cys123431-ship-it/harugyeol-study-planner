import { addDays, endOfMonth, startOfMonth, startOfWeek } from 'date-fns'
import type { PeriodType, ScheduleItem } from '../types'
import { fromDateKey, toDateKey } from './dates'

export function timeRangeMinutes(startTime?: string, endTime?: string): number | null {
  if (!startTime || !endTime) return null
  const pattern = /^(\d{2}):(\d{2})$/
  const start = startTime.match(pattern)
  const end = endTime.match(pattern)
  if (!start || !end) return null
  const startMinutes = Number(start[1]) * 60 + Number(start[2])
  const endMinutes = Number(end[1]) * 60 + Number(end[2])
  if (startMinutes < 0 || startMinutes >= 24 * 60 || endMinutes < 0 || endMinutes >= 24 * 60) return null
  if (endMinutes === startMinutes) return null
  return endMinutes > startMinutes ? endMinutes - startMinutes : endMinutes + 24 * 60 - startMinutes
}

export function plannedStudyMinutes(item: ScheduleItem): number {
  return timeRangeMinutes(item.startTime, item.endTime) ?? item.estimatedMinutes
}

export function actualStudyMinutes(item: ScheduleItem): number {
  if (item.status !== 'completed') return 0
  return item.actualMinutes ?? timeRangeMinutes(item.startTime, item.endTime) ?? item.estimatedMinutes
}

export function formatStudyMinutes(minutes: number): string {
  const safeMinutes = Math.max(0, Math.round(minutes))
  const hours = Math.floor(safeMinutes / 60)
  const remainder = safeMinutes % 60
  if (!hours) return `${remainder}분`
  if (!remainder) return `${hours}시간`
  return `${hours}시간 ${remainder}분`
}

export function periodDateRange(anchor: string, period: PeriodType): { start: string; end: string } {
  const date = fromDateKey(anchor)
  if (period === 'daily') return { start: anchor, end: anchor }
  if (period === 'weekly') {
    const start = startOfWeek(date, { weekStartsOn: 1 })
    return { start: toDateKey(start), end: toDateKey(addDays(start, 6)) }
  }
  return { start: toDateKey(startOfMonth(date)), end: toDateKey(endOfMonth(date)) }
}
