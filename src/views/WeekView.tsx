import { addDays, addWeeks, endOfWeek, format, startOfWeek } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock3, Flag } from 'lucide-react'
import { useState } from 'react'
import { fromDateKey, isRestDay, toDateKey, todayKey } from '../lib/dates'
import { actualStudyMinutes, formatStudyMinutes, plannedStudyMinutes } from '../lib/studyTime'
import { ScheduleRow } from '../components/ScheduleRow'
import { usePlanner } from '../store/PlannerContext'

export function WeekView() {
  const { data, saveReflection } = usePlanner()
  const [anchor, setAnchor] = useState(fromDateKey(todayKey()))
  const weekStartsOn = data?.settings.weekStartsOn ?? 1
  const start = startOfWeek(anchor, { weekStartsOn })
  const end = endOfWeek(anchor, { weekStartsOn })
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index))
  const items = data?.items ?? []
  const rangeItems = items.filter((item) => item.date >= toDateKey(start) && item.date <= toDateKey(end))
  const studyRangeItems = rangeItems.filter((item) => !['cancelled', 'skipped', 'carried'].includes(item.status))
  const completed = rangeItems.filter((item) => item.status === 'completed').length
  const expectedMinutes = studyRangeItems.reduce((sum, item) => sum + plannedStudyMinutes(item), 0)
  const actualMinutes = studyRangeItems.reduce((sum, item) => sum + actualStudyMinutes(item), 0)
  const key = toDateKey(start)
  const reflection = data?.reflections.find((item) => item.date === key && item.periodType === 'weekly')
  const [good, setGood] = useState(reflection?.good ?? '')
  const [improvement, setImprovement] = useState(reflection?.improvement ?? '')

  const subjects = (() => {
    const map = new Map<string, number>()
    rangeItems.forEach((item) => map.set(item.title.replace(/ · Day \d+/, ''), (map.get(item.title.replace(/ · Day \d+/, '')) ?? 0) + 1))
    return [...map.entries()].slice(0, 5)
  })()
  const save = () => saveReflection({ date: key, periodType: 'weekly', good, difficult: reflection?.difficult ?? '', improvement, freeText: reflection?.freeText ?? '' })

  return <div className="page week-page">
    <header className="page-header split-header"><div><span className="eyebrow">주간 플래너</span><h1>{format(start, 'M월 d일', { locale: ko })} — {format(end, 'M월 d일', { locale: ko })}</h1><p>한 주의 밀도를 한눈에 보고, 무리한 날은 미리 조정하세요.</p></div><div className="date-nav"><button onClick={() => setAnchor(addWeeks(anchor, -1))} aria-label="이전 주"><ChevronLeft /></button><button onClick={() => setAnchor(fromDateKey(todayKey()))}>이번 주</button><button onClick={() => setAnchor(addWeeks(anchor, 1))} aria-label="다음 주"><ChevronRight /></button></div></header>
    <section className="week-summary-line"><div><span>주간 완료율</span><strong>{rangeItems.length ? Math.round((completed / rangeItems.length) * 100) : 0}%</strong></div><div><span>계획 공부</span><strong>{formatStudyMinutes(expectedMinutes)}</strong></div><div><span>완료 공부</span><strong>{formatStudyMinutes(actualMinutes)}</strong></div><div><span>학습 항목</span><strong>{rangeItems.length}개</strong></div></section>
    <section className="paper-week" aria-label="주간 일정">
      {days.map((day) => {
        const date = toDateKey(day)
        const dayItems = rangeItems.filter((item) => item.date === date)
        const dayStudyItems = dayItems.filter((item) => !['cancelled', 'skipped', 'carried'].includes(item.status))
        const dayPlanned = dayStudyItems.reduce((sum, item) => sum + plannedStudyMinutes(item), 0)
        const dayActual = dayStudyItems.reduce((sum, item) => sum + actualStudyMinutes(item), 0)
        const rest = isRestDay(day, data?.settings.defaultRestWeekdays ?? [0])
        const isToday = date === todayKey()
        return <article key={date} className={`${rest ? 'rest-day' : ''} ${isToday ? 'today' : ''}`}>
          <header><span>{format(day, 'EEE', { locale: ko })}</span><strong>{format(day, 'd')}</strong>{isToday && <small>오늘</small>}</header>
          {rest && <div className="rest-label">휴식</div>}
          <div className="week-items">{dayItems.slice(0, 6).map((item) => <ScheduleRow key={item.id} item={item} compact />)}{dayItems.length > 6 && <small className="more-count">+{dayItems.length - 6}개 더 있음</small>}{!dayItems.length && !rest && <span className="empty-day">여유</span>}</div>
          <footer><Clock3 size={13} /> 완료 {formatStudyMinutes(dayActual)} · 계획 {formatStudyMinutes(dayPlanned)}</footer>
        </article>
      })}
    </section>
    <div className="week-bottom">
      <section className="subject-list"><div className="section-heading"><div><span className="eyebrow"><Flag size={14} /> 이번 주 목표</span><h2>과목별 할 일</h2></div></div>{subjects.map(([subject, count]) => <div key={subject}><span>{subject}</span><strong>{count}회</strong></div>)}{!subjects.length && <p className="muted">이번 주에 예정된 항목이 없습니다.</p>}</section>
      <section className="weekly-reflection"><span className="eyebrow">주간 메모</span><div className="lined-input"><label>이번 주 잘한 점<textarea value={good} onChange={(event) => setGood(event.target.value)} onBlur={save} placeholder="작은 진전도 충분해요." /></label><label>다음 주 개선점<textarea value={improvement} onChange={(event) => setImprovement(event.target.value)} onBlur={save} placeholder="한 가지면 충분해요." /></label></div><button className="secondary-button" onClick={save}>주간 메모 저장</button></section>
    </div>
  </div>
}
