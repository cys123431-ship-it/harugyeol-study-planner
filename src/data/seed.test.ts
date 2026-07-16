import { describe, expect, it } from 'vitest'
import { nthEligibleDate } from '../lib/dates'
import {
  AUGUST_CURRICULUM_MIGRATION_ID,
  AUGUST_PLAN_ID,
  CERTIFICATE_PLAN_ID,
  CERTIFICATE_START_MIGRATION_ID,
  EXERCISE_PLAN_ID,
  MAJOR_PLAN_ID,
  STUDY_CAFE_PLAN_ID,
  SUMMER_ROUTINE_MIGRATION_ID,
  createEmptyData,
  createSampleData,
  ensureAugustCurriculum,
  ensureCertificateStartDate,
  ensureSummerRoutine,
} from './seed'

describe('8월 계획 데이터 보강', () => {
  it('기존 기록을 보존하면서 빠진 8월 계획과 104개 일정을 한 번만 추가한다', () => {
    const sample = createSampleData()
    const completedItem = { ...sample.items.find((item) => item.planId !== AUGUST_PLAN_ID)!, status: 'completed' as const, actualMinutes: 55 }
    const legacy = {
      ...sample,
      plans: sample.plans.filter((plan) => plan.id !== AUGUST_PLAN_ID),
      stages: sample.stages.filter((stage) => stage.planId !== AUGUST_PLAN_ID),
      items: [completedItem, ...sample.items.filter((item) => item.planId !== AUGUST_PLAN_ID && item.id !== completedItem.id)],
      settings: { ...sample.settings, appliedMigrations: [] },
    }

    const first = ensureAugustCurriculum(legacy)
    expect(first.added).toBe(true)
    expect(first.data.plans.filter((plan) => plan.id === AUGUST_PLAN_ID)).toHaveLength(1)
    expect(first.data.stages.filter((stage) => stage.planId === AUGUST_PLAN_ID)).toHaveLength(4)
    expect(first.data.items.filter((item) => item.planId === AUGUST_PLAN_ID)).toHaveLength(104)
    expect(first.data.items.find((item) => item.id === completedItem.id)).toMatchObject({ status: 'completed', actualMinutes: 55 })

    const second = ensureAugustCurriculum(first.data)
    expect(second.added).toBe(false)
    expect(second.data).toBe(first.data)
  })

  it('사용자가 빈 플래너를 선택했거나 이후 삭제한 경우에는 다시 만들지 않는다', () => {
    const empty = createEmptyData()
    expect(empty.settings.appliedMigrations).toContain(AUGUST_CURRICULUM_MIGRATION_ID)
    expect(ensureAugustCurriculum(empty)).toEqual({ data: empty, added: false })
  })

  it('계획이 이미 있으면 중복 없이 적용 완료 상태만 기록한다', () => {
    const sample = createSampleData()
    const legacySample = { ...sample, settings: { ...sample.settings, appliedMigrations: [] } }
    const result = ensureAugustCurriculum(legacySample)
    expect(result.added).toBe(false)
    expect(result.data.plans.filter((plan) => plan.id === AUGUST_PLAN_ID)).toHaveLength(1)
    expect(result.data.settings.appliedMigrations).toContain(AUGUST_CURRICULUM_MIGRATION_ID)
  })
})

describe('정처기 시작일 데이터 변경', () => {
  it('24개 일정의 날짜를 7월 16일 시작으로 다시 계산하고 기존 기록은 보존한다', () => {
    const sample = createSampleData()
    const legacy = {
      ...sample,
      plans: sample.plans.map((plan) => plan.id === CERTIFICATE_PLAN_ID ? { ...plan, startDate: '2026-07-15' } : plan),
      items: sample.items.map((item) => item.planId === CERTIFICATE_PLAN_ID && item.plannedSequence
        ? {
            ...item,
            date: nthEligibleDate('2026-07-15', item.plannedSequence, [0]),
            status: item.plannedSequence === 1 ? 'completed' as const : item.status,
            actualMinutes: item.plannedSequence === 1 ? 65 : item.actualMinutes,
            notes: item.plannedSequence === 1 ? '사용자가 남긴 메모' : item.notes,
          }
        : item),
      settings: { ...sample.settings, appliedMigrations: sample.settings.appliedMigrations.filter((id) => id !== CERTIFICATE_START_MIGRATION_ID) },
    }

    const first = ensureCertificateStartDate(legacy)
    const certificateItems = first.data.items.filter((item) => item.planId === CERTIFICATE_PLAN_ID).sort((a, b) => (a.plannedSequence ?? 0) - (b.plannedSequence ?? 0))
    expect(first.changed).toBe(true)
    expect(first.data.plans.find((plan) => plan.id === CERTIFICATE_PLAN_ID)?.startDate).toBe('2026-07-16')
    expect(certificateItems).toHaveLength(24)
    expect(certificateItems[0]).toMatchObject({ date: '2026-07-16', status: 'completed', actualMinutes: 65, notes: '사용자가 남긴 메모' })
    expect(certificateItems.at(-1)).toMatchObject({ date: '2026-08-12', plannedSequence: 24 })
    expect(certificateItems.some((item) => new Date(`${item.date}T12:00:00`).getDay() === 0)).toBe(false)

    const second = ensureCertificateStartDate(first.data)
    expect(second.changed).toBe(false)
    expect(second.data).toBe(first.data)
  })

  it('정처기 계획이 없는 빈 플래너에는 계획을 새로 만들지 않는다', () => {
    const empty = createEmptyData()
    expect(empty.settings.appliedMigrations).toContain(CERTIFICATE_START_MIGRATION_ID)
    expect(ensureCertificateStartDate(empty)).toEqual({ data: empty, changed: false })
  })
})

describe('7월 27일 학습·방학 루틴 적용', () => {
  it('기존 기록을 보존해 학습 3종을 재배치하고 운동·스터디카페 일정을 추가한다', () => {
    const sample = createSampleData()
    const legacy = {
      ...sample,
      plans: sample.plans
        .filter((plan) => ![EXERCISE_PLAN_ID, STUDY_CAFE_PLAN_ID].includes(plan.id))
        .map((plan) => {
          if (plan.id === CERTIFICATE_PLAN_ID) return { ...plan, startDate: '2026-07-16' }
          if (plan.id === MAJOR_PLAN_ID) return { ...plan, startDate: '2026-07-16', endDate: '2026-07-31' }
          if (plan.id === AUGUST_PLAN_ID) return { ...plan, startDate: '2026-08-01', endDate: '2026-08-31' }
          return plan
        }),
      items: sample.items
        .filter((item) => ![EXERCISE_PLAN_ID, STUDY_CAFE_PLAN_ID].includes(item.planId ?? ''))
        .map((item) => item.planId === CERTIFICATE_PLAN_ID && item.plannedSequence
          ? {
              ...item,
              date: nthEligibleDate('2026-07-16', item.plannedSequence, [0]),
              status: item.plannedSequence === 1 ? 'completed' as const : item.status,
              actualMinutes: item.plannedSequence === 1 ? 70 : item.actualMinutes,
              notes: item.plannedSequence === 1 ? '완료 기록 보존' : item.notes,
            }
          : item),
      settings: {
        ...sample.settings,
        defaultRestWeekdays: [],
        appliedMigrations: sample.settings.appliedMigrations.filter((id) => id !== SUMMER_ROUTINE_MIGRATION_ID),
      },
    }

    const first = ensureSummerRoutine(legacy)
    expect(first.changed).toBe(true)
    expect(first.data.settings.defaultRestWeekdays).toContain(0)
    expect(first.data.plans).toHaveLength(5)
    expect(first.data.plans.filter((plan) => [CERTIFICATE_PLAN_ID, MAJOR_PLAN_ID, AUGUST_PLAN_ID].includes(plan.id)).every((plan) => plan.startDate === '2026-07-27')).toBe(true)
    expect(first.data.plans.find((plan) => plan.id === MAJOR_PLAN_ID)?.endDate).toBe('2026-08-11')
    expect(first.data.plans.find((plan) => plan.id === AUGUST_PLAN_ID)?.endDate).toBe('2026-08-25')

    const certificateItems = first.data.items.filter((item) => item.planId === CERTIFICATE_PLAN_ID).sort((a, b) => (a.plannedSequence ?? 0) - (b.plannedSequence ?? 0))
    expect(certificateItems[0]).toMatchObject({ date: '2026-07-27', status: 'completed', actualMinutes: 70, notes: '완료 기록 보존' })
    expect(certificateItems.at(-1)).toMatchObject({ date: '2026-08-22', plannedSequence: 24 })

    const exerciseItems = first.data.items.filter((item) => item.planId === EXERCISE_PLAN_ID)
    expect(exerciseItems).toHaveLength(40)
    expect(exerciseItems[0]).toMatchObject({ date: '2026-07-16', startTime: '16:50', endTime: '17:50', estimatedMinutes: 60 })
    expect(exerciseItems.at(-1)?.date).toBe('2026-08-31')

    const cafeItems = first.data.items.filter((item) => item.planId === STUDY_CAFE_PLAN_ID)
    expect(cafeItems).toHaveLength(41)
    expect(cafeItems.find((item) => item.date === '2026-07-15')).toMatchObject({ status: 'completed', actualMinutes: 60 })
    expect(cafeItems.find((item) => item.date === '2026-07-25')).toMatchObject({ startTime: '18:00', endTime: '02:00', estimatedMinutes: 480 })
    expect(cafeItems.find((item) => item.date === '2026-07-27')).toMatchObject({ startTime: '18:00', endTime: '02:00', estimatedMinutes: 480 })
    expect(cafeItems.find((item) => item.date === '2026-08-31')).toMatchObject({ startTime: '18:00', endTime: '02:00', estimatedMinutes: 480 })
    expect(first.data.items.filter((item) => item.planId && [CERTIFICATE_PLAN_ID, MAJOR_PLAN_ID, AUGUST_PLAN_ID, EXERCISE_PLAN_ID, STUDY_CAFE_PLAN_ID].includes(item.planId)).some((item) => new Date(`${item.date}T12:00:00`).getDay() === 0)).toBe(false)

    const second = ensureSummerRoutine(first.data)
    expect(second.changed).toBe(false)
    expect(second.data).toBe(first.data)
  })

  it('새 빈 플래너에는 요청 계획을 강제로 다시 만들지 않는다', () => {
    const empty = createEmptyData()
    expect(empty.settings.appliedMigrations).toContain(SUMMER_ROUTINE_MIGRATION_ID)
    expect(ensureSummerRoutine(empty)).toEqual({ data: empty, changed: false })
  })
})
