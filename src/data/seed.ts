import type { AppSettings, Category, Plan, PlannerData, PlanStage } from '../types'
import { generateCumulativeSchedule, generateCountSchedule } from '../lib/dates'
import { createAugustCurriculumItems } from './augustCurriculum'

export const AUGUST_PLAN_ID = 'plan-august-four-subjects'
export const AUGUST_CURRICULUM_MIGRATION_ID = '2026-august-four-subjects-v1'
export const CERTIFICATE_PLAN_ID = 'plan-certificate-24'
export const CERTIFICATE_START_MIGRATION_ID = 'certificate-start-2026-07-16-v1'

export const defaultSettings: AppSettings = {
  timezone: 'Asia/Seoul',
  weekStartsOn: 1,
  defaultRestWeekdays: [0],
  defaultView: 'checklist',
  dateFormat: 'yyyy.MM.dd',
  timeFormat: '24',
  notificationsEnabled: false,
  reducedMotion: false,
  fontScale: 1,
  appliedMigrations: [],
  lastModifiedAt: '2026-07-15T09:00:00+09:00',
}

const categories: Category[] = [
  { id: 'cat-cert', name: '자격증', type: 'study', color: '#75a99f', order: 0 },
  { id: 'cat-major', name: '전공', type: 'study', color: '#8096c7', order: 1 },
  { id: 'cat-life', name: '생활', type: 'event', color: '#dc9a7c', order: 2 },
]

function basePlan(overrides: Partial<Plan> & Pick<Plan, 'id' | 'title' | 'categoryId' | 'planType' | 'startDate' | 'color'>): Plan {
  const now = '2026-07-15T09:00:00+09:00'
  return {
    description: '',
    timezone: 'Asia/Seoul',
    recurrenceRule: { frequency: 'daily', interval: 1 },
    excludedWeekdays: [],
    excludedDates: [],
    carryOverPolicy: 'ask',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function createAugustTemplate(categoryId: string) {
  const plan = basePlan({
    id: AUGUST_PLAN_ID,
    title: '2026년 8월 4과목 미시 학습',
    description: 'C언어·컴퓨터구조·자료구조·네트워크를 매 학습일 모두 공부하고, 과목별 결과물을 하나씩 남깁니다.',
    categoryId,
    planType: 'recurring',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    targetMinutes: 145,
    color: '#718f9f',
    status: 'upcoming',
  })
  const stages: PlanStage[] = [
    { id: 'stage-august-c', planId: plan.id, order: 0, title: 'C언어', unlockAfterEligibleDays: 0, keepPreviousStages: true, color: '#8096c7', defaultDuration: 40 },
    { id: 'stage-august-architecture', planId: plan.id, order: 1, title: '컴퓨터구조', unlockAfterEligibleDays: 0, keepPreviousStages: true, color: '#75a99f', defaultDuration: 40 },
    { id: 'stage-august-data', planId: plan.id, order: 2, title: '자료구조', unlockAfterEligibleDays: 0, keepPreviousStages: true, color: '#9a8cc4', defaultDuration: 40 },
    { id: 'stage-august-network', planId: plan.id, order: 3, title: '네트워크', unlockAfterEligibleDays: 0, keepPreviousStages: true, color: '#d59a72', defaultDuration: 25 },
  ]
  return { plan, stages, items: createAugustCurriculumItems(plan, stages) }
}

export function createSampleData(): PlannerData {
  const certificatePlan = basePlan({
    id: CERTIFICATE_PLAN_ID,
    title: '정보처리기사 실기 24일 완성',
    description: '일요일을 제외한 24번의 학습으로 실기 범위를 완주합니다.',
    categoryId: 'cat-cert',
    planType: 'count',
    startDate: '2026-07-16',
    targetCount: 24,
    targetMinutes: 70,
    color: '#75a99f',
  })
  const cumulativePlan = basePlan({
    id: 'plan-major-july',
    title: '7월 전공 누적 학습',
    description: '실제 학습일 3일마다 다음 전공 과목을 더합니다.',
    categoryId: 'cat-major',
    planType: 'cumulative',
    startDate: '2026-07-16',
    endDate: '2026-07-31',
    targetMinutes: 35,
    color: '#8096c7',
  })
  const augustTemplate = createAugustTemplate('cat-major')
  const augustPlan = augustTemplate.plan
  const cumulativeStages: PlanStage[] = [
    { id: 'stage-c', planId: cumulativePlan.id, order: 0, title: 'C언어', unlockAfterEligibleDays: 0, keepPreviousStages: true, color: '#8096c7', defaultDuration: 35 },
    { id: 'stage-architecture', planId: cumulativePlan.id, order: 1, title: '컴퓨터구조', unlockAfterEligibleDays: 3, keepPreviousStages: true, color: '#9a8cc4', defaultDuration: 35 },
    { id: 'stage-data', planId: cumulativePlan.id, order: 2, title: '자료구조', unlockAfterEligibleDays: 6, keepPreviousStages: true, color: '#ca8fa6', defaultDuration: 35 },
    { id: 'stage-network', planId: cumulativePlan.id, order: 3, title: '네트워크', unlockAfterEligibleDays: 9, keepPreviousStages: true, color: '#d59a72', defaultDuration: 35 },
  ]
  const augustStages = augustTemplate.stages
  const stages = [...cumulativeStages, ...augustStages]
  const plans = [certificatePlan, cumulativePlan, augustPlan]
  const items = [
    ...generateCountSchedule(certificatePlan, defaultSettings),
    ...generateCumulativeSchedule(cumulativePlan, cumulativeStages, defaultSettings),
    ...augustTemplate.items,
  ]
  return { plans, stages, items, categories, reflections: [], settings: { ...defaultSettings, appliedMigrations: [AUGUST_CURRICULUM_MIGRATION_ID, CERTIFICATE_START_MIGRATION_ID], lastModifiedAt: new Date().toISOString() } }
}

export function createEmptyData(): PlannerData {
  return { plans: [], stages: [], items: [], categories: [...categories], reflections: [], settings: { ...defaultSettings, appliedMigrations: [AUGUST_CURRICULUM_MIGRATION_ID, CERTIFICATE_START_MIGRATION_ID], lastModifiedAt: new Date().toISOString() } }
}

export function ensureAugustCurriculum(data: PlannerData): { data: PlannerData; added: boolean } {
  const appliedMigrations = data.settings.appliedMigrations ?? []
  if (appliedMigrations.includes(AUGUST_CURRICULUM_MIGRATION_ID)) return { data, added: false }

  const nextSettings = {
    ...data.settings,
    appliedMigrations: [...appliedMigrations, AUGUST_CURRICULUM_MIGRATION_ID],
    lastModifiedAt: new Date().toISOString(),
  }
  if (data.plans.some((plan) => plan.id === AUGUST_PLAN_ID)) {
    return { data: { ...data, settings: nextSettings }, added: false }
  }

  let nextCategories = data.categories
  let category = data.categories.find((candidate) => candidate.id === 'cat-major')
    ?? data.categories.find((candidate) => candidate.type === 'study')
    ?? data.categories[0]
  if (!category) {
    category = { id: 'cat-major', name: '전공', type: 'study', color: '#8096c7', order: 0 }
    nextCategories = [category]
  }

  const template = createAugustTemplate(category.id)
  const stageIds = new Set(template.stages.map((stage) => stage.id))
  return {
    added: true,
    data: {
      ...data,
      categories: nextCategories,
      plans: [...data.plans, template.plan],
      stages: [...data.stages.filter((stage) => stage.planId !== AUGUST_PLAN_ID && !stageIds.has(stage.id)), ...template.stages],
      items: [...data.items.filter((item) => item.planId !== AUGUST_PLAN_ID && !item.id.startsWith('item-august-')), ...template.items],
      settings: nextSettings,
    },
  }
}

export function ensureCertificateStartDate(data: PlannerData): { data: PlannerData; changed: boolean } {
  const appliedMigrations = data.settings.appliedMigrations ?? []
  if (appliedMigrations.includes(CERTIFICATE_START_MIGRATION_ID)) return { data, changed: false }

  const now = new Date().toISOString()
  const nextSettings = {
    ...data.settings,
    appliedMigrations: [...appliedMigrations, CERTIFICATE_START_MIGRATION_ID],
    lastModifiedAt: now,
  }
  const plan = data.plans.find((candidate) => candidate.id === CERTIFICATE_PLAN_ID)
  if (!plan) return { data: { ...data, settings: nextSettings }, changed: false }

  const updatedPlan = { ...plan, startDate: '2026-07-16', updatedAt: now }
  const generated = generateCountSchedule(updatedPlan, data.settings)
  const dateBySequence = new Map(generated.map((item) => [item.plannedSequence, item.date]))
  return {
    changed: true,
    data: {
      ...data,
      plans: data.plans.map((candidate) => candidate.id === CERTIFICATE_PLAN_ID ? updatedPlan : candidate),
      items: data.items.map((item) => {
        if (item.planId !== CERTIFICATE_PLAN_ID || !item.plannedSequence) return item
        const date = dateBySequence.get(item.plannedSequence)
        return date ? { ...item, date, updatedAt: now } : item
      }),
      settings: nextSettings,
    },
  }
}
