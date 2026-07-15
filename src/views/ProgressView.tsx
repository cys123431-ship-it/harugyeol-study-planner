import { Activity, Clock3, TrendingUp } from 'lucide-react'
import { addDays, format, startOfWeek } from 'date-fns'
import { ko } from 'date-fns/locale'
import { achievementRate, fromDateKey, learningStreak, plannedAndActualProgress, toDateKey, todayKey } from '../lib/dates'
import { usePlanner } from '../store/PlannerContext'

export function ProgressView() {
  const { data } = usePlanner()
  const items = data?.items ?? []
  const completed = items.filter((item) => item.status === 'completed')
  const totalMinutes = completed.reduce((sum, item) => sum + (item.actualMinutes ?? item.estimatedMinutes), 0)
  const activePlans = data?.plans.filter((plan) => plan.status === 'active') ?? []
  const overallRate = achievementRate(items)
  const streak = data ? learningStreak(items, data.settings) : 0
  const weekStart = startOfWeek(fromDateKey(todayKey()), { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  const dayMinutes = days.map((day) => completed.filter((item) => item.date === toDateKey(day)).reduce((sum, item) => sum + (item.actualMinutes ?? item.estimatedMinutes), 0))
  const maxMinutes = Math.max(...dayMinutes, 60)

  return <div className="page progress-page">
    <header className="page-header"><span className="eyebrow">나의 진도</span><h1>숫자보다 흐름을 봅니다.</h1><p>휴식일은 달성률에서 제외하고, 실제로 완료한 기록만 반영했어요.</p></header>
    <section className="progress-highlights"><div><span className="metric-icon mint"><Activity /></span><small>전체 완료율</small><strong>{overallRate}%</strong><p>휴식일·취소 일정 제외</p></div><div><span className="metric-icon blue"><Clock3 /></span><small>누적 학습 시간</small><strong>{Math.floor(totalMinutes / 60)}<em>시간</em> {totalMinutes % 60}<em>분</em></strong><p>완료 일정의 실제 시간</p></div><div><span className="metric-icon apricot"><TrendingUp /></span><small>연속 학습일</small><strong>{streak}<em>일</em></strong><p>휴식일은 흐름을 끊지 않아요</p></div></section>
    <div className="progress-layout">
      <section className="plan-progress-section"><div className="section-heading"><div><span className="eyebrow">계획별 완료율</span><h2>목표까지 남은 거리</h2></div></div>{activePlans.map((plan) => { const progress = plannedAndActualProgress(plan.id, items); return <div className="plan-progress-row" key={plan.id}><div><i style={{ background: plan.color }} /><span><strong>{plan.title}</strong><small>계획 {progress.planned}회 · 실제 완료 {progress.actual}회</small></span><em>{progress.percent}%</em></div><div className="large-progress"><span style={{ width: `${progress.percent}%`, background: plan.color }} /></div></div> })}{!activePlans.length && <p className="muted">진행 중인 계획이 없습니다.</p>}</section>
      <section className="weekly-chart"><div className="section-heading"><div><span className="eyebrow">이번 주 학습 시간</span><h2>{dayMinutes.reduce((sum, value) => sum + value, 0)}분</h2></div></div><div className="bar-chart" aria-label="요일별 학습 시간 막대 그래프">{days.map((day, index) => <div key={toDateKey(day)}><span className="bar-value">{dayMinutes[index] ? `${dayMinutes[index]}분` : ''}</span><div className="bar-track"><span style={{ height: `${Math.max(4, (dayMinutes[index] / maxMinutes) * 100)}%` }} /></div><small>{format(day, 'EEE', { locale: ko })}</small></div>)}</div></section>
    </div>
    <section className="gentle-note"><span>기록 안내</span><p>완료하지 못한 날은 실패가 아니라 계획을 조정할 신호입니다. 이월하거나 날짜를 옮겨 다음 흐름을 이어갈 수 있어요.</p></section>
  </div>
}
