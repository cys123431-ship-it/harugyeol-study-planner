import { describe, expect, it } from 'vitest'
import { AUGUST_CURRICULUM_MIGRATION_ID, AUGUST_PLAN_ID, createEmptyData, createSampleData, ensureAugustCurriculum } from './seed'

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
