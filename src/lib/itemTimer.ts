import type { ScheduleItem } from '../types'

export const DEFAULT_TIMER_TARGET_MINUTES = 25

export function timerElapsedSeconds(item: ScheduleItem, now = Date.now()): number {
  const accumulated = Math.max(0, Math.floor(item.timerElapsedSeconds ?? 0))
  if (item.timerStatus !== 'running' || !item.timerStartedAt) return accumulated
  const startedAt = Date.parse(item.timerStartedAt)
  if (!Number.isFinite(startedAt)) return accumulated
  return accumulated + Math.max(0, Math.floor((now - startedAt) / 1000))
}

export function timerTargetSeconds(item: ScheduleItem): number {
  return Math.max(1, Math.floor(item.timerTargetMinutes ?? DEFAULT_TIMER_TARGET_MINUTES)) * 60
}

export function timerDisplaySeconds(item: ScheduleItem, now = Date.now()): number {
  const elapsed = timerElapsedSeconds(item, now)
  return item.timerMode === 'countdown' ? Math.max(0, timerTargetSeconds(item) - elapsed) : elapsed
}

export function timerRecordedMinutes(elapsedSeconds: number): number {
  if (elapsedSeconds <= 0) return 0
  return Math.max(1, Math.round(elapsedSeconds / 60))
}

export function timerActualMinutes(item: ScheduleItem, elapsedSeconds: number): number {
  return Math.max(0, item.timerBaseActualMinutes ?? item.actualMinutes ?? 0) + timerRecordedMinutes(elapsedSeconds)
}
