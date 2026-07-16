import { describe, expect, it } from 'vitest'
import { createEmptyData, createSampleData } from './seed'
import {
  createEnglishGrammarTemplate,
  ENGLISH_GRAMMAR_CATEGORY_ID,
  ENGLISH_GRAMMAR_MIGRATION_ID,
  ENGLISH_GRAMMAR_PLAN_ID,
  englishGrammarSchedule,
  ensureEnglishGrammarPlan,
} from './englishGrammarPlan'

describe('6개월 영문법 계획', () => {
  it('첨부 계획의 157개 학습일과 세부 범위를 그대로 만든다', () => {
    const template = createEnglishGrammarTemplate()
    expect(englishGrammarSchedule).toHaveLength(157)
    expect(template.plan).toMatchObject({ startDate: '2026-08-01', endDate: '2027-01-30', excludedWeekdays: [0] })
    expect(template.items).toHaveLength(157)
    expect(template.items[0]).toMatchObject({ date: '2026-08-01', estimatedMinutes: 100 })
    expect(template.items[0].notes).toContain('문마 P1 구와 절')
    expect(template.items.find((item) => item.date === '2026-10-02')).toMatchObject({ estimatedMinutes: 110 })
    expect(template.items.find((item) => item.date === '2026-10-02')?.notes).toContain('Part I U1 P1~2')
    expect(template.items.find((item) => item.date === '2026-12-01')).toMatchObject({ estimatedMinutes: 135 })
    expect(template.items.at(-1)?.date).toBe('2027-01-30')
    expect(template.items.at(-1)?.notes).toContain('실전 모의고사 5회')
    expect(template.items.some((item) => new Date(`${item.date}T12:00:00`).getDay() === 0)).toBe(false)
  })

  it('기존 데이터에 계획을 한 번만 추가하고 동기화 표시를 남긴다', () => {
    const sample = createSampleData()
    const legacy = {
      ...sample,
      categories: sample.categories.filter((category) => category.id !== ENGLISH_GRAMMAR_CATEGORY_ID),
      plans: sample.plans.filter((plan) => plan.id !== ENGLISH_GRAMMAR_PLAN_ID),
      items: sample.items.filter((item) => item.planId !== ENGLISH_GRAMMAR_PLAN_ID),
      settings: { ...sample.settings, appliedMigrations: sample.settings.appliedMigrations.filter((id) => id !== ENGLISH_GRAMMAR_MIGRATION_ID) },
    }

    const first = ensureEnglishGrammarPlan(legacy)
    expect(first.changed).toBe(true)
    expect(first.data.categories.some((category) => category.id === ENGLISH_GRAMMAR_CATEGORY_ID)).toBe(true)
    expect(first.data.plans.filter((plan) => plan.id === ENGLISH_GRAMMAR_PLAN_ID)).toHaveLength(1)
    expect(first.data.items.filter((item) => item.planId === ENGLISH_GRAMMAR_PLAN_ID)).toHaveLength(157)
    expect(first.data.settings.appliedMigrations).toContain(ENGLISH_GRAMMAR_MIGRATION_ID)

    const second = ensureEnglishGrammarPlan(first.data)
    expect(second.changed).toBe(false)
    expect(second.data).toBe(first.data)
  })

  it('새 빈 플래너에는 영문법 계획을 강제로 만들지 않는다', () => {
    const empty = createEmptyData()
    expect(empty.settings.appliedMigrations).toContain(ENGLISH_GRAMMAR_MIGRATION_ID)
    expect(ensureEnglishGrammarPlan(empty)).toEqual({ data: empty, changed: false })
  })
})
