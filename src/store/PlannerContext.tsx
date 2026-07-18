'use client'

import { addDays, differenceInCalendarDays } from 'date-fns'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createEmptyData, createSampleData, ensureAugustCurriculum, ensureCertificateStartDate, ensureSummerRoutine } from '../data/seed'
import { ensureEnglishGrammarPlan } from '../data/englishGrammarPlan'
import { createBackup, readAllData, validateBackup, writeAllData } from '../data/database'
import { chooseNewestPlannerData, readCloudSnapshot, writeCloudSnapshot, type SyncStatus } from '../data/cloudSync'
import { fromDateKey, generateScheduleForPlan, protectCompletedAndRegenerate, toDateKey } from '../lib/dates'
import { archiveExpiredDeadlinePlans } from '../lib/deadlines'
import { createId } from '../lib/ids'
import { timerActualMinutes, timerElapsedSeconds, timerTargetSeconds } from '../lib/itemTimer'
import { timeRangeMinutes } from '../lib/studyTime'
import type {
  AppSettings,
  CategoryType,
  Plan,
  PlannerBackup,
  PlannerData,
  PlanStage,
  Reflection,
  ScheduleItem,
} from '../types'

type PlanDraft = Omit<Plan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
export type OccurrenceEditScope = 'one' | 'future' | 'all'

function touchData(data: PlannerData): PlannerData {
  return { ...data, settings: { ...data.settings, lastModifiedAt: new Date().toISOString() } }
}

interface PlannerContextValue {
  data: PlannerData | null
  loading: boolean
  needsOnboarding: boolean
  toast: string | null
  cloudUser: string | null
  syncStatus: SyncStatus
  initialize: (mode: 'sample' | 'empty') => void
  addPlan: (draft: PlanDraft, stages?: Omit<PlanStage, 'id' | 'planId'>[]) => void
  updatePlan: (draft: PlanDraft, stages?: Omit<PlanStage, 'id' | 'planId'>[]) => void
  deletePlan: (id: string) => void
  duplicatePlan: (id: string) => void
  addManualItem: (item: Pick<ScheduleItem, 'title' | 'date' | 'estimatedMinutes' | 'startTime' | 'endTime' | 'notes' | 'priority' | 'categoryId'>) => void
  updateItem: (id: string, patch: Partial<ScheduleItem>) => void
  editScheduleOccurrence: (id: string, patch: Partial<ScheduleItem>, scope: OccurrenceEditScope) => void
  toggleComplete: (id: string, actualMinutes?: number) => void
  moveItem: (id: string, date: string) => void
  carryItem: (id: string, date: string) => void
  saveReflection: (reflection: Omit<Reflection, 'id' | 'createdAt' | 'updatedAt'>) => void
  addCategory: (name: string, type: CategoryType, color: string) => void
  updateCategory: (id: string, patch: { name?: string; type?: CategoryType; color?: string }) => void
  deleteCategory: (id: string) => void
  updateSettings: (settings: Partial<AppSettings>, recalculate?: boolean) => void
  restoreBackup: (value: unknown) => void
  exportBackup: () => PlannerBackup
  resetData: (mode: 'sample' | 'empty') => void
  clearToast: () => void
}

const PlannerContext = createContext<PlannerContextValue | null>(null)

export function PlannerProvider({ children, cloudUser = null }: { children: ReactNode; cloudUser?: string | null }) {
  const [data, setData] = useState<PlannerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(cloudUser ? 'syncing' : 'local')
  const hydrated = useRef(false)

  useEffect(() => {
    let active = true

    async function hydrate() {
      try {
        const local = await readAllData()
        let selected = local
        if (cloudUser) {
          try {
            const cloud = await readCloudSnapshot()
            selected = chooseNewestPlannerData(local, cloud.data)
            if (active) setSyncStatus('synced')
          } catch {
            if (active) setSyncStatus(navigator.onLine ? 'error' : 'offline')
          }
        }
        const augustMigration = selected ? ensureAugustCurriculum(selected) : null
        const certificateMigration = augustMigration ? ensureCertificateStartDate(augustMigration.data) : null
        const summerMigration = certificateMigration ? ensureSummerRoutine(certificateMigration.data) : null
        const englishMigration = summerMigration ? ensureEnglishGrammarPlan(summerMigration.data) : null
        const ready = englishMigration ? archiveExpiredDeadlinePlans(englishMigration.data) : null
        if (active) {
          setData(ready)
          setNeedsOnboarding(!ready)
          if (summerMigration?.changed && englishMigration?.changed) setToast('방학 루틴과 6개월 영문법 계획을 추가했습니다.')
          else if (englishMigration?.changed) setToast('문마·해커스·어법끝 6개월 영문법 계획을 추가했습니다.')
          else if (summerMigration?.changed) setToast('학습 3종을 7월 27일로 옮기고 운동·스터디카페 루틴을 추가했습니다.')
          else if (augustMigration?.added && certificateMigration?.changed) setToast('8월 계획을 추가하고 정처기 일정을 7월 16일 시작으로 변경했습니다.')
          else if (augustMigration?.added) setToast('요청한 8월 4과목 계획을 기존 기록에 추가했습니다.')
          else if (certificateMigration?.changed) setToast('정처기 24일 계획을 7월 16일 시작으로 변경했습니다.')
        }
      } catch {
        if (active) {
          setNeedsOnboarding(true)
          setToast('저장된 데이터를 읽지 못했습니다. 새 플래너로 시작할 수 있습니다.')
        }
      } finally {
        if (active) {
          hydrated.current = true
          setLoading(false)
        }
      }
    }

    void hydrate()
    return () => { active = false }
  }, [cloudUser])

  useEffect(() => {
    if (!hydrated.current || !data) return
    const localTimer = window.setTimeout(() => {
      writeAllData(data).catch(() => setToast('변경 내용을 기기에 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.'))
    }, 120)
    const cloudTimer = cloudUser ? window.setTimeout(async () => {
      setSyncStatus('syncing')
      try {
        await writeCloudSnapshot(data)
        setSyncStatus('synced')
      } catch {
        setSyncStatus(navigator.onLine ? 'error' : 'offline')
      }
    }, 800) : undefined

    return () => {
      window.clearTimeout(localTimer)
      if (cloudTimer) window.clearTimeout(cloudTimer)
    }
  }, [cloudUser, data])

  useEffect(() => {
    const resolveFinishedCountdowns = () => {
      const timestamp = Date.now()
      const finishedAt = new Date(timestamp).toISOString()
      setData((current) => {
        if (!current) return current
        let changed = false
        const items = current.items.map((item) => {
          if (item.timerMode !== 'countdown' || item.timerStatus !== 'running') return item
          const targetSeconds = timerTargetSeconds(item)
          if (timerElapsedSeconds(item, timestamp) < targetSeconds) return item
          changed = true
          return {
            ...item,
            timerStatus: 'success' as const,
            timerStartedAt: undefined,
            timerElapsedSeconds: targetSeconds,
            timerSucceededAt: finishedAt,
            actualMinutes: timerActualMinutes(item, targetSeconds),
            actualEndedAt: finishedAt,
            status: item.status === 'scheduled' ? 'in-progress' as const : item.status,
            updatedAt: finishedAt,
          }
        })
        return changed ? touchData({ ...current, items }) : current
      })
    }
    resolveFinishedCountdowns()
    const interval = window.setInterval(resolveFinishedCountdowns, 1000)
    return () => window.clearInterval(interval)
  }, [])

  const initialize = useCallback((mode: 'sample' | 'empty') => {
    setData(mode === 'sample' ? createSampleData() : createEmptyData())
    setNeedsOnboarding(false)
    setToast(mode === 'sample' ? '예시 계획을 준비했습니다.' : '빈 플래너를 준비했습니다.')
  }, [])

  const addPlan = useCallback((draft: PlanDraft, stageDrafts: Omit<PlanStage, 'id' | 'planId'>[] = []) => {
    setData((current) => {
      if (!current) return current
      const now = new Date().toISOString()
      const id = draft.id ?? createId('plan')
      const plan: Plan = { ...draft, id, createdAt: now, updatedAt: now }
      const stages = stageDrafts.map((stage) => ({ ...stage, id: createId('stage'), planId: id }))
      const items = generateScheduleForPlan(plan, stages, current.settings)
      return touchData({ ...current, plans: [...current.plans, plan], stages: [...current.stages, ...stages], items: [...current.items, ...items] })
    })
    setToast('계획과 일정을 만들었습니다.')
  }, [])

  const updatePlan = useCallback((draft: PlanDraft, stageDrafts: Omit<PlanStage, 'id' | 'planId'>[] = []) => {
    if (!draft.id) return
    setData((current) => {
      if (!current) return current
      const existing = current.plans.find((plan) => plan.id === draft.id)
      if (!existing) return current
      const plan: Plan = { ...existing, ...draft, id: existing.id, updatedAt: new Date().toISOString() }
      const oldStages = current.stages.filter((stage) => stage.planId === plan.id)
      const stages = stageDrafts.length
        ? stageDrafts.map((stage, index) => ({ ...stage, id: oldStages[index]?.id ?? createId('stage'), planId: plan.id }))
        : oldStages
      const otherItems = current.items.filter((item) => item.planId !== plan.id)
      const ownExisting = current.items.filter((item) => item.planId === plan.id)
      const regenerated = generateScheduleForPlan(plan, stages, current.settings)
      return touchData({
        ...current,
        plans: current.plans.map((candidate) => candidate.id === plan.id ? plan : candidate),
        stages: [...current.stages.filter((stage) => stage.planId !== plan.id), ...stages],
        items: [...otherItems, ...protectCompletedAndRegenerate(ownExisting, regenerated)],
      })
    })
    setToast('계획을 수정했습니다. 완료 기록은 그대로 보존했습니다.')
  }, [])

  const deletePlan = useCallback((id: string) => {
    setData((current) => current ? touchData({
      ...current,
      plans: current.plans.filter((plan) => plan.id !== id),
      stages: current.stages.filter((stage) => stage.planId !== id),
      items: current.items.filter((item) => item.planId !== id),
    }) : current)
    setToast('계획을 삭제했습니다.')
  }, [])

  const duplicatePlan = useCallback((id: string) => {
    setData((current) => {
      if (!current) return current
      const source = current.plans.find((plan) => plan.id === id)
      if (!source) return current
      const now = new Date().toISOString()
      const planId = createId('plan')
      const plan: Plan = { ...source, id: planId, title: `${source.title} 복사본`, createdAt: now, updatedAt: now }
      const sourceStages = current.stages.filter((stage) => stage.planId === id)
      const stages = sourceStages.map((stage) => ({ ...stage, id: createId('stage'), planId }))
      const items = generateScheduleForPlan(plan, stages, current.settings)
      return touchData({ ...current, plans: [...current.plans, plan], stages: [...current.stages, ...stages], items: [...current.items, ...items] })
    })
    setToast('계획 복사본을 만들었습니다.')
  }, [])

  const addManualItem = useCallback((item: Pick<ScheduleItem, 'title' | 'date' | 'estimatedMinutes' | 'startTime' | 'endTime' | 'notes' | 'priority' | 'categoryId'>) => {
    setData((current) => {
      if (!current) return current
      const now = new Date().toISOString()
      return touchData({ ...current, items: [...current.items, {
        ...item,
        id: createId('item'),
        allDay: !item.startTime,
        status: 'scheduled',
        isAutoGenerated: false,
        isRestDayOverride: current.settings.defaultRestWeekdays.includes(new Date(`${item.date}T12:00:00`).getDay()),
        createdAt: now,
        updatedAt: now,
      }] })
    })
    setToast('일정을 추가했습니다.')
  }, [])

  const updateItem = useCallback((id: string, patch: Partial<ScheduleItem>) => {
    setData((current) => current ? touchData({
      ...current,
      items: current.items.map((item) => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item),
    }) : current)
  }, [])

  const editScheduleOccurrence = useCallback((id: string, patch: Partial<ScheduleItem>, scope: OccurrenceEditScope) => {
    setData((current) => {
      if (!current) return current
      const target = current.items.find((item) => item.id === id)
      if (!target) return current
      const plan = target.planId ? current.plans.find((candidate) => candidate.id === target.planId) : undefined
      const effectiveScope = plan && plan.recurrenceRule.frequency !== 'none' ? scope : 'one'
      const dateDelta = patch.date
        ? differenceInCalendarDays(fromDateKey(patch.date), fromDateKey(target.date))
        : 0
      const now = new Date().toISOString()

      const isAffected = (item: ScheduleItem) => {
        if (effectiveScope !== 'one' && ['completed', 'cancelled'].includes(item.status)) return false
        if (item.id === target.id) return true
        if (effectiveScope === 'one' || item.planId !== target.planId) return false
        return effectiveScope === 'all' || item.date >= target.date
      }

      return touchData({
        ...current,
        items: current.items.map((item) => {
          if (!isAffected(item)) return item
          const shiftedDate = patch.date
            ? (item.id === target.id ? patch.date : toDateKey(addDays(fromDateKey(item.date), dateDelta)))
            : item.date
          return {
            ...item,
            ...patch,
            date: shiftedDate,
            allDay: patch.startTime === undefined ? item.allDay : !patch.startTime,
            isAutoGenerated: false,
            updatedAt: now,
          }
        }),
      })
    })
    const scopeLabel = scope === 'all' ? '전체 반복 일정' : scope === 'future' ? '이 일정과 이후 일정' : '이 일정'
    setToast(`${scopeLabel}을 수정했습니다. 완료 기록은 변경하지 않았습니다.`)
  }, [])

  const toggleComplete = useCallback((id: string, actualMinutes?: number) => {
    setData((current) => {
      if (!current) return current
      const target = current.items.find((item) => item.id === id)
      if (!target) return current
      const completing = target.status !== 'completed'
      const actualSequence = completing && target.planId
        ? current.items.filter((item) => item.planId === target.planId && item.status === 'completed').length + 1
        : undefined
      const now = new Date()
      const measuredSeconds = timerElapsedSeconds(target, now.getTime())
      const measuredMinutes = measuredSeconds > 0 ? timerActualMinutes(target, measuredSeconds) : undefined
      const hasTimerRecord = Boolean(target.timerElapsedSeconds || target.actualStartedAt)
      return touchData({ ...current, items: current.items.map((item) => item.id === id ? {
        ...item,
        status: completing ? 'completed' : hasTimerRecord ? 'in-progress' : 'scheduled',
        completedAt: completing ? now.toISOString() : undefined,
        actualMinutes: completing ? (actualMinutes ?? measuredMinutes ?? item.actualMinutes ?? timeRangeMinutes(item.startTime, item.endTime) ?? item.estimatedMinutes) : hasTimerRecord ? item.actualMinutes : undefined,
        timerStatus: item.timerStatus === 'running' ? 'paused' : item.timerStatus,
        timerStartedAt: item.timerStatus === 'running' ? undefined : item.timerStartedAt,
        timerElapsedSeconds: item.timerStatus === 'running' ? measuredSeconds : item.timerElapsedSeconds,
        actualEndedAt: item.timerStatus === 'running' ? now.toISOString() : item.actualEndedAt,
        actualSequence,
        updatedAt: now.toISOString(),
      } : item) })
    })
    setToast('일정 상태를 변경했습니다. 다시 누르면 되돌릴 수 있습니다.')
  }, [])

  const moveItem = useCallback((id: string, date: string) => {
    updateItem(id, { date, status: 'scheduled' })
    setToast(`${date}로 일정을 이동했습니다.`)
  }, [updateItem])

  const carryItem = useCallback((id: string, date: string) => {
    setData((current) => {
      if (!current) return current
      const source = current.items.find((item) => item.id === id)
      if (!source) return current
      const now = new Date().toISOString()
      const carried: ScheduleItem = { ...source, id: createId('item'), date, status: 'scheduled', plannedSequence: undefined, isAutoGenerated: false, createdAt: now, updatedAt: now }
      return touchData({ ...current, items: [...current.items.map((item) => item.id === id ? { ...item, status: 'carried' as const, updatedAt: now } : item), carried] })
    })
    setToast(`${date}로 이월했습니다. 원래 일정도 기록에 남겼습니다.`)
  }, [])

  const saveReflection = useCallback((reflection: Omit<Reflection, 'id' | 'createdAt' | 'updatedAt'>) => {
    setData((current) => {
      if (!current) return current
      const now = new Date().toISOString()
      const existing = current.reflections.find((item) => item.date === reflection.date && item.periodType === reflection.periodType)
      const next = existing
        ? current.reflections.map((item) => item.id === existing.id ? { ...item, ...reflection, updatedAt: now } : item)
        : [...current.reflections, { ...reflection, id: createId('reflection'), createdAt: now, updatedAt: now }]
      return touchData({ ...current, reflections: next })
    })
    setToast('회고를 저장했습니다.')
  }, [])

  const addCategory = useCallback((name: string, type: CategoryType, color: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setData((current) => current ? touchData({
      ...current,
      categories: [...current.categories, { id: createId('category'), name: trimmed, type, color, order: current.categories.length }],
    }) : current)
    setToast('카테고리를 추가했습니다.')
  }, [])

  const updateCategory = useCallback((id: string, patch: { name?: string; type?: CategoryType; color?: string }) => {
    setData((current) => current ? touchData({
      ...current,
      categories: current.categories.map((category) => category.id === id
        ? { ...category, ...patch, name: patch.name?.trim() || category.name }
        : category),
    }) : current)
    setToast('카테고리를 수정했습니다.')
  }, [])

  const deleteCategory = useCallback((id: string) => {
    setData((current) => {
      if (!current) return current
      if (current.categories.length <= 1) {
        setToast('카테고리는 하나 이상 남겨야 합니다.')
        return current
      }
      const fallback = current.categories.find((category) => category.id !== id)
      if (!fallback) return current
      return touchData({
        ...current,
        categories: current.categories.filter((category) => category.id !== id),
        plans: current.plans.map((plan) => plan.categoryId === id ? { ...plan, categoryId: fallback.id, color: fallback.color, updatedAt: new Date().toISOString() } : plan),
        items: current.items.map((item) => item.categoryId === id ? { ...item, categoryId: fallback.id, updatedAt: new Date().toISOString() } : item),
      })
    })
    setToast('카테고리를 삭제하고 연결된 항목을 다른 카테고리로 옮겼습니다.')
  }, [])

  const updateSettings = useCallback((settings: Partial<AppSettings>, recalculate = false) => {
    setData((current) => {
      if (!current) return current
      const nextSettings = { ...current.settings, ...settings, lastModifiedAt: new Date().toISOString() }
      if (!recalculate) return { ...current, settings: nextSettings }
      const generated = current.plans.flatMap((plan) => generateScheduleForPlan(plan, current.stages.filter((stage) => stage.planId === plan.id), nextSettings))
      return { ...current, settings: nextSettings, items: protectCompletedAndRegenerate(current.items, generated) }
    })
    setToast(recalculate ? '설정에 맞춰 미래 일정을 다시 계산했습니다.' : '설정을 저장했습니다.')
  }, [])

  const restoreBackup = useCallback((value: unknown) => {
    const backup = validateBackup(value)
    const augustMigration = ensureAugustCurriculum(backup.data)
    const certificateMigration = ensureCertificateStartDate(augustMigration.data)
    const summerMigration = ensureSummerRoutine(certificateMigration.data)
    const englishMigration = ensureEnglishGrammarPlan(summerMigration.data)
    setData(touchData(englishMigration.data))
    setNeedsOnboarding(false)
    if (summerMigration.changed && englishMigration.changed) setToast('백업을 복원하고 방학 루틴과 영문법 계획을 적용했습니다.')
    else if (englishMigration.changed) setToast('백업을 복원하고 6개월 영문법 계획을 적용했습니다.')
    else if (summerMigration.changed) setToast('백업을 복원하고 7월 27일 학습·운동·스터디카페 루틴을 적용했습니다.')
    else if (augustMigration.added && certificateMigration.changed) setToast('백업을 복원하고 8월 계획과 정처기 새 일정을 적용했습니다.')
    else if (augustMigration.added) setToast('백업을 복원하고 8월 4과목 계획을 추가했습니다.')
    else if (certificateMigration.changed) setToast('백업을 복원하고 정처기 일정을 7월 16일 시작으로 변경했습니다.')
    else setToast('백업 데이터를 복원했습니다.')
  }, [])

  const exportBackup = useCallback(() => {
    if (!data) throw new Error('내보낼 데이터가 없습니다.')
    return createBackup(data)
  }, [data])

  const resetData = useCallback((mode: 'sample' | 'empty') => initialize(mode), [initialize])
  const clearToast = useCallback(() => setToast(null), [])

  const value = useMemo<PlannerContextValue>(() => ({
    data, loading, needsOnboarding, toast, cloudUser, syncStatus, initialize, addPlan, updatePlan, deletePlan, duplicatePlan,
    addManualItem, updateItem, editScheduleOccurrence, toggleComplete, moveItem, carryItem, saveReflection,
    addCategory, updateCategory, deleteCategory, updateSettings, restoreBackup, exportBackup, resetData, clearToast,
  }), [data, loading, needsOnboarding, toast, cloudUser, syncStatus, initialize, addPlan, updatePlan, deletePlan, duplicatePlan,
    addManualItem, updateItem, editScheduleOccurrence, toggleComplete, moveItem, carryItem, saveReflection,
    addCategory, updateCategory, deleteCategory, updateSettings, restoreBackup, exportBackup, resetData, clearToast])

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
}

// Context hook is intentionally colocated with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function usePlanner() {
  const context = useContext(PlannerContext)
  if (!context) throw new Error('usePlanner는 PlannerProvider 안에서 사용해야 합니다.')
  return context
}
