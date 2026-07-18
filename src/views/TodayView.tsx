import { AlarmClock, ArrowRight, CalendarPlus, ChevronRight, Clock3, Coffee, Focus, ListChecks, TimerReset } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatKoreanDate, isRestDay, plannedAndActualProgress, todayKey } from '../lib/dates'
import { formatDday, getDday } from '../lib/deadlines'
import { actualStudyMinutes, formatStudyMinutes, plannedStudyMinutes } from '../lib/studyTime'
import { ScheduleRow } from '../components/ScheduleRow'
import { usePlanner } from '../store/PlannerContext'

export function TodayView({ onOpenTimer, onAddItem, onAddPlan }: { onOpenTimer: (itemId?: string) => void; onAddItem: () => void; onAddPlan: () => void }) {
  const { data, saveReflection } = usePlanner()
  const today = todayKey()
  const [mode, setMode] = useState(data?.settings.defaultView ?? 'checklist')
  const dailyReflection = data?.reflections.find((reflection) => reflection.date === today && reflection.periodType === 'daily')
  const [memo, setMemo] = useState(dailyReflection?.freeText ?? '')
  const items = useMemo(() => data?.items.filter((item) => item.date === today && item.status !== 'cancelled').sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99')) ?? [], [data?.items, today])
  const studyItems = items.filter((item) => Boolean(item.planId))
  const otherItems = items.filter((item) => !item.planId)
  const completed = items.filter((item) => item.status === 'completed').length
  const estimated = items.filter((item) => item.status !== 'completed').reduce((sum, item) => sum + plannedStudyMinutes(item), 0)
  const actual = items.reduce((sum, item) => sum + actualStudyMinutes(item), 0)
  const rest = isRestDay(today, data?.settings.defaultRestWeekdays ?? [0])
  const primaryPlan = data?.plans.find((plan) => plan.status === 'active')
  const progress = primaryPlan ? plannedAndActualProgress(primaryPlan.id, data?.items ?? []) : null
  const percentage = items.length ? Math.round((completed / items.length) * 100) : 0
  const nextDeadline = data?.plans
    .filter((plan) => plan.planType === 'deadline' && ['active', 'upcoming'].includes(plan.status) && getDday(plan, today) >= 0)
    .sort((a, b) => getDday(a, today) - getDday(b, today))[0]

  const saveMemo = () => saveReflection({ date: today, periodType: 'daily', good: dailyReflection?.good ?? '', difficult: dailyReflection?.difficult ?? '', improvement: dailyReflection?.improvement ?? '', freeText: memo })

  return <div className="page today-page">
    <header className="page-header today-header">
      <div><span className="date-kicker">{formatKoreanDate(today, 'yyyy년 M월 d일 · EEEE')}</span><h1>{rest ? '오늘은 온전히 쉬는 날이에요.' : '오늘의 흐름을 가볍게 시작해요.'}</h1><p>{rest ? '자동 학습은 만들지 않았습니다. 필요한 일정만 직접 더할 수 있어요.' : '계획한 순서보다, 지금 시작할 한 가지에 집중해 보세요.'}</p></div>
      <div className={`day-state ${rest ? 'rest' : 'study'}`}>{rest ? <Coffee /> : <Focus />}<span><small>오늘의 상태</small><strong>{rest ? '휴식일' : '학습일'}</strong></span></div>
    </header>

    <section className="today-overview" aria-label="오늘 요약">
      <div className="focus-summary">
        <div className="section-label"><span>오늘의 핵심 목표</span><small>{completed}/{items.length} 완료</small></div>
        <h2>{studyItems.find((item) => item.status !== 'completed')?.title ?? (items.length ? '오늘의 계획을 모두 마쳤어요' : '아직 정해진 계획이 없어요')}</h2>
        <div className="summary-meta"><span><Clock3 size={16} /> 남은 예상 {formatStudyMinutes(estimated)}</span><span><TimerReset size={16} /> 기록 공부 {formatStudyMinutes(actual)}</span>{nextDeadline && <span className="deadline-summary"><CalendarPlus size={16} /> {formatDday(getDday(nextDeadline, today))} · {nextDeadline.title}</span>}</div>
        {!rest && <button className="primary-button" onClick={() => onOpenTimer()}><AlarmClock size={18} /> 집중 타이머 시작</button>}
      </div>
      <div className="day-progress">
        <div className="progress-ring" style={{ '--progress': `${percentage * 3.6}deg` } as React.CSSProperties}><span><strong>{percentage}%</strong><small>오늘 완료</small></span></div>
        <div><span className="section-label">계획 진도</span><strong>{primaryPlan?.title ?? '활성 계획 없음'}</strong><small>{progress ? `계획 ${progress.planned}회 · 실제 완료 ${progress.actual}회` : '계획을 추가해 시작해 보세요.'}</small></div>
      </div>
    </section>

    <section className="schedule-section">
      <div className="section-heading"><div><span className="eyebrow"><ListChecks size={15} /> 오늘 할 일</span><h2>지금부터 하나씩</h2></div><div className="view-toggle"><button className={mode === 'checklist' ? 'active' : ''} onClick={() => setMode('checklist')}>목록</button><button className={mode === 'timeline' ? 'active' : ''} onClick={() => setMode('timeline')}>시간순</button></div></div>
      {!items.length ? <div className="empty-state"><CalendarPlus /><h3>아직 오늘의 계획이 없습니다.</h3><p>가볍게 일정 하나를 더하거나 예시 계획을 불러올 수 있어요.</p><div><button className="primary-button" onClick={onAddItem}>일정 추가</button><button className="secondary-button" onClick={onAddPlan}>계획 추가</button></div></div>
        : mode === 'checklist' ? <div className="schedule-list">
          {studyItems.length > 0 && <div className="schedule-group"><div className="group-title"><span>학습</span><small>{studyItems.filter((item) => item.status === 'completed').length}/{studyItems.length}</small></div>{studyItems.map((item) => <ScheduleRow key={item.id} item={item} onOpenTimer={onOpenTimer} />)}</div>}
          {otherItems.length > 0 && <div className="schedule-group"><div className="group-title"><span>기타 일정</span><small>{otherItems.length}</small></div>{otherItems.map((item) => <ScheduleRow key={item.id} item={item} onOpenTimer={onOpenTimer} />)}</div>}
        </div> : <div className="timeline-list">
          {items.map((item) => <div className="timeline-entry" key={item.id}><time>{item.startTime ?? '미정'}</time><span className="timeline-dot" /><ScheduleRow item={item} compact onOpenTimer={onOpenTimer} /></div>)}
        </div>}
      {items.length > 0 && <button className="add-inline" onClick={onAddItem}>+ 일정 하나 더하기</button>}
    </section>

    <section className="today-notes">
      <div><span className="eyebrow">오늘의 메모</span><h2>잊지 않을 한 줄</h2><p>완벽한 기록보다 내일의 나에게 도움이 될 내용을 남겨 보세요.</p></div>
      <div className="note-paper"><textarea value={memo} onChange={(event) => setMemo(event.target.value)} onBlur={saveMemo} placeholder="오늘 기억할 것, 떠오른 생각, 내일 준비할 것…" aria-label="오늘의 메모" /><button onClick={saveMemo}>메모 저장 <ChevronRight size={16} /></button></div>
    </section>
    <button className="next-page-link" onClick={() => document.querySelector<HTMLButtonElement>('.sidebar nav button:nth-child(2)')?.click()}>이번 주 전체 흐름 보기 <ArrowRight size={17} /></button>
  </div>
}
