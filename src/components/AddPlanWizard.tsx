import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import { useState } from 'react'
import { estimatedCompletionDate, formatKoreanDate, todayKey } from '../lib/dates'
import { usePlanner } from '../store/PlannerContext'
import type { CategoryType, Plan, PlanStage, PlanType } from '../types'

const typeOptions: { value: PlanType; label: string; description: string }[] = [
  { value: 'single', label: '단일 할 일', description: '특정 날짜에 한 번 실행해요' },
  { value: 'recurring', label: '반복 계획', description: '기간 동안 규칙적으로 반복해요' },
  { value: 'count', label: '횟수 완성형', description: '정해진 횟수를 채우면 끝나요' },
  { value: 'cumulative', label: '누적 추가형', description: '학습일마다 단계를 쌓아가요' },
  { value: 'deadline', label: '시험·마감', description: 'D-day와 준비 진도를 봐요' },
  { value: 'habit', label: '습관', description: '꾸준한 흐름을 기록해요' },
  { value: 'free', label: '자유 일정', description: '약속과 개인 일정을 적어요' },
]

const colors = ['#75a99f', '#8096c7', '#9a8cc4', '#ca8fa6', '#d59a72', '#b08f73']

export function AddPlanWizard({ onClose, plan }: { onClose: () => void; plan: Plan | null }) {
  const { data, addPlan, updatePlan } = usePlanner()
  const [step, setStep] = useState(plan ? 2 : 1)
  const [planType, setPlanType] = useState<PlanType>(plan?.planType ?? 'count')
  const [categoryType, setCategoryType] = useState<CategoryType>('study')
  const [title, setTitle] = useState(plan?.title ?? '')
  const [description, setDescription] = useState(plan?.description ?? '')
  const [categoryId, setCategoryId] = useState(plan?.categoryId ?? data?.categories[0]?.id ?? '')
  const [color, setColor] = useState(plan?.color ?? colors[0])
  const [startDate, setStartDate] = useState(plan?.startDate ?? todayKey())
  const [endDate, setEndDate] = useState(plan?.endDate ?? '')
  const [targetCount, setTargetCount] = useState(plan?.targetCount ?? 24)
  const [targetMinutes, setTargetMinutes] = useState(plan?.targetMinutes ?? 50)
  const [frequency, setFrequency] = useState(plan?.recurrenceRule.frequency ?? 'daily')
  const initialStages = plan ? data?.stages.filter((stage) => stage.planId === plan.id).sort((a, b) => a.order - b.order).map((stage) => stage.title).join(', ') : ''
  const [stageText, setStageText] = useState(initialStages || 'C언어, 컴퓨터구조, 자료구조, 네트워크')
  const [interval, setInterval] = useState(plan ? data?.stages.find((stage) => stage.planId === plan.id)?.unlockAfterEligibleDays || 3 : 3)
  const [error, setError] = useState('')

  const stages = stageText.split(',').map((value) => value.trim()).filter(Boolean)
  const computedEnd = (() => {
    if (planType !== 'count' || targetCount <= 0) return endDate
    try { return estimatedCompletionDate(startDate, targetCount, data?.settings.defaultRestWeekdays ?? [0]) } catch { return '' }
  })()

  const next = () => {
    setError('')
    if (step === 2 && !title.trim()) return setError('계획 이름을 입력해 주세요.')
    if (step === 3 && endDate && endDate < startDate) return setError('종료일은 시작일보다 빠를 수 없습니다.')
    if (step === 4 && planType === 'count' && targetCount <= 0) return setError('목표 횟수는 1회 이상이어야 합니다.')
    setStep((value) => Math.min(value + 1, 5))
  }

  const save = () => {
    try {
      const now = new Date().toISOString()
      const draft = {
        id: plan?.id,
        title: title.trim(), description, categoryId, planType, startDate,
        endDate: planType === 'count' ? computedEnd : (endDate || startDate),
        timezone: data?.settings.timezone ?? 'Asia/Seoul',
        targetCount: planType === 'count' ? targetCount : undefined,
        targetMinutes,
        recurrenceRule: { frequency, interval: 1 },
        excludedWeekdays: [], excludedDates: [], carryOverPolicy: 'ask' as const,
        color, status: 'active' as const,
        ...(plan ? { createdAt: plan.createdAt, updatedAt: now } : {}),
      }
      const stageDrafts: Omit<PlanStage, 'id' | 'planId'>[] = planType === 'cumulative' ? stages.map((stage, index) => ({
        order: index, title: stage, unlockAfterEligibleDays: index * interval, keepPreviousStages: true, color: colors[index % colors.length], defaultDuration: targetMinutes,
      })) : []
      if (plan) updatePlan(draft, stageDrafts)
      else addPlan(draft, stageDrafts)
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '계획을 저장하지 못했습니다.')
    }
  }

  const summary = planType === 'count'
    ? `${formatKoreanDate(startDate, 'yyyy년 M월 d일')}부터 휴식일을 제외하고 총 ${targetCount}회를 진행합니다. 예상 완료일은 ${computedEnd ? formatKoreanDate(computedEnd, 'yyyy년 M월 d일') : '계산할 수 없음'}입니다.`
    : planType === 'cumulative'
      ? `${formatKoreanDate(startDate, 'yyyy년 M월 d일')}부터 ${interval}학습일마다 ${stages.join(' → ')} 순서로 항목을 누적합니다.`
      : `${formatKoreanDate(startDate, 'yyyy년 M월 d일')}에 시작하며 ${frequency === 'none' ? '한 번 실행' : '설정한 기간 동안 반복'}합니다.`

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="dialog wizard" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
      <header><div><span className="eyebrow">{plan ? '계획 수정' : '새 계획'} · {step}/5</span><h2 id="wizard-title">{['', '무엇을 계획하나요?', '이름과 분류를 정해요', '언제 실행할까요?', '목표를 어떻게 채울까요?', '마지막으로 확인해요'][step]}</h2></div><button className="icon-button" onClick={onClose} aria-label="닫기"><X /></button></header>
      <div className="wizard-progress" aria-hidden="true">{[1, 2, 3, 4, 5].map((value) => <span key={value} className={value <= step ? 'active' : ''} />)}</div>
      <div className="wizard-body">
        {step === 1 && <div className="type-grid">{typeOptions.map((option) => <button key={option.value} className={planType === option.value ? 'selected' : ''} onClick={() => setPlanType(option.value)}><span className="radio-mark">{planType === option.value && <Check size={14} />}</span><strong>{option.label}</strong><small>{option.description}</small></button>)}</div>}
        {step === 2 && <div className="form-grid">
          <label className="field full"><span>계획 이름</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 정보처리기사 실기 완주" /></label>
          <label className="field"><span>분류</span><select value={categoryType} onChange={(event) => setCategoryType(event.target.value as CategoryType)}><option value="study">공부</option><option value="exam">시험</option><option value="assignment">과제</option><option value="habit">습관</option><option value="event">일정</option><option value="project">프로젝트</option><option value="other">기타</option></select></label>
          <label className="field"><span>과목·카테고리</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{data?.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <fieldset className="color-field full"><legend>구분 색상</legend><div>{colors.map((candidate) => <button key={candidate} className={color === candidate ? 'selected' : ''} style={{ background: candidate }} onClick={() => setColor(candidate)} aria-label={`${candidate} 색상`} aria-pressed={color === candidate} />)}</div></fieldset>
          <label className="field full"><span>설명 <small>선택</small></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="이 계획을 통해 이루고 싶은 것을 적어 두세요." /></label>
        </div>}
        {step === 3 && <div className="form-grid">
          <label className="field"><span>시작일</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          {planType !== 'count' && <label className="field"><span>종료일</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>}
          {!['single', 'free', 'deadline', 'count', 'cumulative'].includes(planType) && <label className="field full"><span>반복 규칙</span><select value={frequency} onChange={(event) => setFrequency(event.target.value as typeof frequency)}><option value="daily">매일</option><option value="weekdays">평일</option><option value="weekly">매주</option><option value="monthly">매월</option></select></label>}
          <div className="rest-rule full"><span>기본 휴식일</span><strong>{data?.settings.defaultRestWeekdays.includes(0) ? '매주 일요일' : '설정에서 지정한 요일'}</strong><small>휴식일에는 자동 학습을 만들지 않고 진도에도 포함하지 않습니다.</small></div>
        </div>}
        {step === 4 && <div className="form-grid">
          {planType === 'count' && <label className="field"><span>총 목표 횟수</span><input type="number" min={1} value={targetCount} onChange={(event) => setTargetCount(Number(event.target.value))} /></label>}
          {planType === 'cumulative' && <><label className="field full"><span>누적할 항목 <small>쉼표로 구분</small></span><textarea value={stageText} onChange={(event) => setStageText(event.target.value)} rows={3} /></label><label className="field"><span>새 단계 추가 간격</span><div className="suffix-input"><input type="number" min={1} value={interval} onChange={(event) => setInterval(Number(event.target.value))} /><span>학습일</span></div></label></>}
          <label className="field"><span>1회 예상 시간</span><div className="suffix-input"><input type="number" min={5} step={5} value={targetMinutes} onChange={(event) => setTargetMinutes(Number(event.target.value))} /><span>분</span></div></label>
          <div className="goal-preview full"><span>목표 형태</span><strong>{typeOptions.find((option) => option.value === planType)?.label}</strong><p>완료 버튼을 눌러야 실제 진도가 올라갑니다. 계획된 회차와 실제 완료 회차는 따로 기록됩니다.</p></div>
        </div>}
        {step === 5 && <div className="confirmation"><span className="confirmation-mark"><Check /></span><h3>{title}</h3><p>{summary}</p><dl><div><dt>분류</dt><dd>{typeOptions.find((option) => option.value === planType)?.label}</dd></div><div><dt>기본 휴식</dt><dd>일요일 제외</dd></div><div><dt>예상 시간</dt><dd>1회 {targetMinutes}분</dd></div></dl></div>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      <footer><button className="text-button" onClick={step === 1 ? onClose : () => setStep((value) => value - 1)}>{step === 1 ? '취소' : <><ArrowLeft size={16} /> 이전</>}</button>{step < 5 ? <button className="primary-button" onClick={next}>다음 <ArrowRight size={16} /></button> : <button className="primary-button" onClick={save}>{plan ? '변경 저장' : '계획 만들기'}</button>}</footer>
    </section>
  </div>
}
