import Dexie, { type EntityTable } from 'dexie'
import type { AppSettings, Category, Plan, PlannerBackup, PlannerData, PlanStage, Reflection, ScheduleItem } from '../types'

class PlannerDatabase extends Dexie {
  plans!: EntityTable<Plan, 'id'>
  stages!: EntityTable<PlanStage, 'id'>
  items!: EntityTable<ScheduleItem, 'id'>
  categories!: EntityTable<Category, 'id'>
  reflections!: EntityTable<Reflection, 'id'>
  settings!: EntityTable<AppSettings & { id: string }, 'id'>

  constructor() {
    super('haru-planner')
    this.version(1).stores({
      plans: 'id, status, categoryId, startDate, endDate',
      stages: 'id, planId, order',
      items: 'id, planId, date, status, categoryId, [date+status]',
      categories: 'id, type, order',
      reflections: 'id, date, periodType',
      settings: 'id',
    })
  }
}

export const db = new PlannerDatabase()

export async function readAllData(): Promise<PlannerData | null> {
  const [plans, stages, items, categories, reflections, settingsRow] = await Promise.all([
    db.plans.toArray(), db.stages.toArray(), db.items.toArray(), db.categories.toArray(), db.reflections.toArray(), db.settings.get('app'),
  ])
  if (!settingsRow) return null
  const settings: AppSettings = {
    timezone: settingsRow.timezone,
    weekStartsOn: settingsRow.weekStartsOn,
    defaultRestWeekdays: settingsRow.defaultRestWeekdays,
    defaultView: settingsRow.defaultView,
    dateFormat: settingsRow.dateFormat,
    timeFormat: settingsRow.timeFormat,
    notificationsEnabled: settingsRow.notificationsEnabled,
    reducedMotion: settingsRow.reducedMotion,
    fontScale: settingsRow.fontScale,
    lastModifiedAt: settingsRow.lastModifiedAt ?? new Date(0).toISOString(),
  }
  return { plans, stages, items, categories, reflections, settings }
}

export async function writeAllData(data: PlannerData) {
  await db.transaction('rw', [db.plans, db.stages, db.items, db.categories, db.reflections, db.settings], async () => {
    await Promise.all([db.plans.clear(), db.stages.clear(), db.items.clear(), db.categories.clear(), db.reflections.clear(), db.settings.clear()])
    await Promise.all([
      db.plans.bulkAdd(data.plans),
      db.stages.bulkAdd(data.stages),
      db.items.bulkAdd(data.items),
      db.categories.bulkAdd(data.categories),
      db.reflections.bulkAdd(data.reflections),
      db.settings.add({ id: 'app', ...data.settings }),
    ])
  })
}

export function createBackup(data: PlannerData): PlannerBackup {
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), data }
}

export function validateBackup(value: unknown): PlannerBackup {
  if (!value || typeof value !== 'object') throw new Error('백업 파일이 JSON 객체가 아닙니다.')
  const backup = value as Partial<PlannerBackup>
  if (backup.schemaVersion !== 1) throw new Error('지원하지 않는 백업 버전입니다. schemaVersion 1 파일을 선택해 주세요.')
  if (!backup.data || !Array.isArray(backup.data.plans) || !Array.isArray(backup.data.items) || !backup.data.settings) {
    throw new Error('계획, 일정 또는 설정 정보가 없어 복원할 수 없습니다.')
  }
  return backup as PlannerBackup
}
