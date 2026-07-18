import { addMonths, format, isSameMonth } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { fromDateKey, isRestDay, monthGrid, toDateKey, todayKey } from '../lib/dates'
import { actualStudyMinutes, formatStudyMinutes, plannedStudyMinutes } from '../lib/studyTime'
import { ScheduleRow } from '../components/ScheduleRow'
import { usePlanner } from '../store/PlannerContext'

export function MonthView() {
  const { data } = usePlanner()
  const [month, setMonth] = useState(fromDateKey(todayKey()))
  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [category, setCategory] = useState('all')
  const days = monthGrid(month, data?.settings.weekStartsOn ?? 1)
  const items = (data?.items ?? []).filter((item) => category === 'all' || item.categoryId === category)
  const selectedItems = items.filter((item) => item.date === selectedDate)
  const selectedStudyItems = selectedItems.filter((item) => !['cancelled', 'skipped', 'carried'].includes(item.status))
  const selectedPlanned = selectedStudyItems.reduce((sum, item) => sum + plannedStudyMinutes(item), 0)
  const selectedActual = selectedStudyItems.reduce((sum, item) => sum + actualStudyMinutes(item), 0)
  const dayLabels = (data?.settings.weekStartsOn ?? 1) === 1 ? ['월', '화', '수', '목', '금', '토', '일'] : ['일', '월', '화', '수', '목', '금', '토']

  return <div className="page month-page">
    <header className="page-header split-header"><div><span className="eyebrow">월간 캘린더</span><h1>{format(month, 'yyyy년 M월', { locale: ko })}</h1><p>색은 계획의 종류를, 숫자는 그날의 일정량을 보여 줍니다.</p></div><div className="month-tools"><label><SlidersHorizontal size={16} /><span className="sr-only">카테고리 필터</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">모든 카테고리</option>{data?.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="date-nav"><button onClick={() => setMonth(addMonths(month, -1))} aria-label="이전 달"><ChevronLeft /></button><button onClick={() => { setMonth(fromDateKey(todayKey())); setSelectedDate(todayKey()) }}>오늘</button><button onClick={() => setMonth(addMonths(month, 1))} aria-label="다음 달"><ChevronRight /></button></div></div></header>
    <div className="month-layout">
      <section className="calendar-grid" aria-label={`${format(month, 'yyyy년 M월')} 달력`}>
        {dayLabels.map((label) => <div key={label} className="weekday-label">{label}</div>)}
        {days.map((day) => {
          const date = toDateKey(day)
          const dayItems = items.filter((item) => item.date === date)
          const dayStudyItems = dayItems.filter((item) => !['cancelled', 'skipped', 'carried'].includes(item.status))
          const dayPlanned = dayStudyItems.reduce((sum, item) => sum + plannedStudyMinutes(item), 0)
          const dayActual = dayStudyItems.reduce((sum, item) => sum + actualStudyMinutes(item), 0)
          const rest = isRestDay(day, data?.settings.defaultRestWeekdays ?? [0])
          const selected = date === selectedDate
          return <button key={date} className={`calendar-day ${!isSameMonth(day, month) ? 'outside' : ''} ${date === todayKey() ? 'today' : ''} ${selected ? 'selected' : ''}`} onClick={() => setSelectedDate(date)} aria-label={`${format(day, 'M월 d일 EEEE', { locale: ko })}, 일정 ${dayItems.length}개, 기록 ${dayActual}분, 계획 ${dayPlanned}분${rest ? ', 휴식일' : ''}`}>
            <span className="day-number">{format(day, 'd')}</span>{rest && <small className="rest-chip">휴식</small>}
            {dayPlanned > 0 && <small className="day-study-time">{dayActual}/{dayPlanned}분</small>}
            <div className="calendar-items">{dayItems.slice(0, 2).map((item) => { const plan = data?.plans.find((candidate) => candidate.id === item.planId); const stage = data?.stages.find((candidate) => candidate.id === item.stageId); return <span key={item.id}><i style={{ background: stage?.color ?? plan?.color ?? '#ad9a88' }} />{item.title}</span> })}</div>
            {dayItems.length > 2 && <small className="day-count">+{dayItems.length - 2}</small>}
          </button>
        })}
      </section>
      <aside className="date-detail"><div className="detail-date"><span>{format(fromDateKey(selectedDate), 'EEEE', { locale: ko })}</span><strong>{format(fromDateKey(selectedDate), 'M월 d일', { locale: ko })}</strong><small>{isRestDay(selectedDate, data?.settings.defaultRestWeekdays ?? [0]) ? '휴식일 · ' : ''}{selectedItems.length}개 일정 · 기록 {formatStudyMinutes(selectedActual)} / 계획 {formatStudyMinutes(selectedPlanned)}</small></div><div className="detail-list">{selectedItems.map((item) => <ScheduleRow key={item.id} item={item} compact />)}{!selectedItems.length && <div className="small-empty"><span>비어 있는 날이에요.</span><small>일정 없이 여유롭게 보내도 좋습니다.</small></div>}</div></aside>
    </div>
  </div>
}
