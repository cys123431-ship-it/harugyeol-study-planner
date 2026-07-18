import { Activity, Clock3, TrendingUp } from 'lucide-react'
import { eachDayOfInterval, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useMemo, useState } from 'react'
import { achievementRate, fromDateKey, learningStreak, plannedAndActualProgress, toDateKey, todayKey } from '../lib/dates'
import { actualStudyMinutes, formatStudyMinutes, periodDateRange, plannedStudyMinutes } from '../lib/studyTime'
import { usePlanner } from '../store/PlannerContext'
import type { PeriodType, ScheduleItem } from '../types'

const periodLabels: Record<PeriodType, string> = { daily: '오늘', weekly: '이번 주', monthly: '이번 달' }

export function ProgressView() {
  const { data } = usePlanner()
  const [period, setPeriod] = useState<PeriodType>('weekly')
  const items = useMemo(() => data?.items ?? [], [data?.items])
  const totalMinutes = items.reduce((sum, item) => sum + actualStudyMinutes(item), 0)
  const activePlans = data?.plans.filter((plan) => plan.status === 'active') ?? []
  const overallRate = achievementRate(items)
  const streak = data ? learningStreak(items, data.settings) : 0

  const dashboard = useMemo(() => {
    const range = periodDateRange(todayKey(), period)
    const rangeItems = items.filter((item) => item.date >= range.start && item.date <= range.end && !['cancelled', 'skipped', 'carried'].includes(item.status))
    const planned = rangeItems.reduce((sum, item) => sum + plannedStudyMinutes(item), 0)
    const actual = rangeItems.reduce((sum, item) => sum + actualStudyMinutes(item), 0)
    const completedSessions = rangeItems.filter((item) => item.status === 'completed').length
    const dates = eachDayOfInterval({ start: fromDateKey(range.start), end: fromDateKey(range.end) })

    const summarize = (label: string, bucketItems: ScheduleItem[]) => ({
      label,
      planned: bucketItems.reduce((sum, item) => sum + plannedStudyMinutes(item), 0),
      actual: bucketItems.reduce((sum, item) => sum + actualStudyMinutes(item), 0),
    })

    const buckets = period === 'daily'
      ? (rangeItems.length
          ? rangeItems.map((item, index) => summarize(item.startTime ?? `${index + 1}`, [item]))
          : [summarize('오늘', [])])
      : period === 'weekly'
        ? dates.map((day) => {
            const key = toDateKey(day)
            return summarize(format(day, 'EEE', { locale: ko }), rangeItems.filter((item) => item.date === key))
          })
        : Array.from({ length: Math.ceil(dates.length / 7) }, (_, index) => {
            const bucketDates = dates.slice(index * 7, index * 7 + 7).map(toDateKey)
            return summarize(`${index + 1}주`, rangeItems.filter((item) => bucketDates.includes(item.date)))
          })

    return {
      actual,
      buckets,
      completedSessions,
      percent: planned ? Math.min(100, Math.round((actual / planned) * 100)) : 0,
      planned,
    }
  }, [items, period])

  const maxBucketMinutes = Math.max(...dashboard.buckets.flatMap((bucket) => [bucket.planned, bucket.actual]), 60)

  return <div className="page progress-page">
    <header className="page-header"><span className="eyebrow">나의 진도</span><h1>공부 시간을 한눈에 봅니다.</h1><p>직접 입력한 시간과 타이머로 측정한 공부량을 일간, 주간, 월간으로 확인하세요.</p></header>
    <section className="progress-highlights"><div><span className="metric-icon mint"><Activity /></span><small>전체 완료율</small><strong>{overallRate}%</strong><p>휴식일·취소 일정 제외</p></div><div><span className="metric-icon blue"><Clock3 /></span><small>누적 학습 시간</small><strong>{Math.floor(totalMinutes / 60)}<em>시간</em> {totalMinutes % 60}<em>분</em></strong><p>직접 입력·타이머 실제 공부량</p></div><div><span className="metric-icon apricot"><TrendingUp /></span><small>연속 학습일</small><strong>{streak}<em>일</em></strong><p>휴식일은 흐름을 끊지 않아요</p></div></section>
    <section className="study-time-dashboard" aria-label="기간별 공부량 대시보드">
      <div className="study-dashboard-header"><div><span className="eyebrow">공부량 대시보드</span><h2>{periodLabels[period]} 기록</h2></div><div className="status-tabs" role="group" aria-label="공부량 조회 기간">{(['daily', 'weekly', 'monthly'] as PeriodType[]).map((value) => <button key={value} className={period === value ? 'active' : ''} aria-pressed={period === value} onClick={() => setPeriod(value)}>{value === 'daily' ? '일간' : value === 'weekly' ? '주간' : '월간'}</button>)}</div></div>
      <div className="study-period-summary"><div><span>계획 공부량</span><strong>{formatStudyMinutes(dashboard.planned)}</strong></div><div><span>기록 공부량</span><strong>{formatStudyMinutes(dashboard.actual)}</strong></div><div><span>시간 달성률</span><strong>{dashboard.percent}%</strong></div><div><span>완료 세션</span><strong>{dashboard.completedSessions}개</strong></div></div>
      <div className="period-bar-chart" style={{ gridTemplateColumns: `repeat(${dashboard.buckets.length}, minmax(34px, 1fr))` }} aria-label={`${periodLabels[period]} 공부 시간 막대 그래프`}>
        {dashboard.buckets.map((bucket, index) => <div key={`${bucket.label}-${index}`}><span className="bar-value">{bucket.actual ? formatStudyMinutes(bucket.actual) : ''}</span><div className="bar-track" title={`${bucket.label}: 계획 ${formatStudyMinutes(bucket.planned)}, 기록 ${formatStudyMinutes(bucket.actual)}`}><span className="planned-bar" style={{ height: `${Math.max(bucket.planned ? 4 : 0, (bucket.planned / maxBucketMinutes) * 100)}%` }} /><span className="actual-bar" style={{ height: `${Math.max(bucket.actual ? 4 : 0, (bucket.actual / maxBucketMinutes) * 100)}%` }} /></div><small>{bucket.label}</small></div>)}
      </div>
      <div className="chart-legend"><span><i className="planned" /> 계획</span><span><i className="actual" /> 기록</span></div>
    </section>
    <section className="plan-progress-section"><div className="section-heading"><div><span className="eyebrow">계획별 완료율</span><h2>목표까지 남은 거리</h2></div></div>{activePlans.map((plan) => { const progress = plannedAndActualProgress(plan.id, items); return <div className="plan-progress-row" key={plan.id}><div><i style={{ background: plan.color }} /><span><strong>{plan.title}</strong><small>계획 {progress.planned}회 · 실제 완료 {progress.actual}회</small></span><em>{progress.percent}%</em></div><div className="large-progress"><span style={{ width: `${progress.percent}%`, background: plan.color }} /></div></div> })}{!activePlans.length && <p className="muted">진행 중인 계획이 없습니다.</p>}</section>
    <section className="gentle-note"><span>시간 기록 안내</span><p>시작·종료 시각을 직접 입력하거나 오늘 일정의 타이머를 사용할 수 있습니다. 타이머는 정지하거나 목표 시간을 달성하는 즉시 실제 공부량에 반영됩니다.</p></section>
  </div>
}
