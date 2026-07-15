import { differenceInCalendarDays } from 'date-fns'
import { fromDateKey, todayKey } from './dates'
import type { Plan, PlannerData } from '../types'

export function getDeadlineDate(plan: Plan) {
  return plan.endDate ?? plan.startDate
}

export function getDday(plan: Plan, referenceDate = todayKey()) {
  return differenceInCalendarDays(fromDateKey(getDeadlineDate(plan)), fromDateKey(referenceDate))
}

export function formatDday(days: number) {
  if (days === 0) return 'D-DAY'
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`
}

export function archiveExpiredDeadlinePlans(data: PlannerData, referenceDate = todayKey()) {
  const now = new Date().toISOString()
  let changed = false
  const plans = data.plans.map((plan) => {
    if (
      plan.planType === 'deadline'
      && ['active', 'upcoming'].includes(plan.status)
      && getDeadlineDate(plan) < referenceDate
    ) {
      changed = true
      return { ...plan, status: 'archived' as const, updatedAt: now }
    }
    return plan
  })

  return changed ? { ...data, plans, settings: { ...data.settings, lastModifiedAt: now } } : data
}
