import { Check, ChevronDown, Clock3, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { nextEligibleDate, todayKey } from '../lib/dates'
import { formatStudyMinutes, plannedStudyMinutes, timeRangeMinutes } from '../lib/studyTime'
import { usePlanner, type OccurrenceEditScope } from '../store/PlannerContext'
import type { ScheduleItem } from '../types'

export function ScheduleRow({ item, compact = false }: { item: ScheduleItem; compact?: boolean }) {
  const { data, toggleComplete, updateItem, editScheduleOccurrence, carryItem } = usePlanner()
  const [expanded, setExpanded] = useState(false)
  const [editTitle, setEditTitle] = useState(item.title)
  const [moveDate, setMoveDate] = useState(item.date)
  const [editTime, setEditTime] = useState(item.startTime ?? '')
  const [editEndTime, setEditEndTime] = useState(item.endTime ?? '')
  const [editMinutes, setEditMinutes] = useState(item.estimatedMinutes)
  const [editScope, setEditScope] = useState<OccurrenceEditScope>('one')
  const plan = data?.plans.find((candidate) => candidate.id === item.planId)
  const stage = data?.stages.find((candidate) => candidate.id === item.stageId)
  const category = data?.categories.find((candidate) => candidate.id === (item.categoryId ?? plan?.categoryId))
  const completed = item.status === 'completed'
  const hasSeries = Boolean(plan && plan.recurrenceRule.frequency !== 'none')
  const calculatedMinutes = timeRangeMinutes(editTime, editEndTime)
  const invalidTimeRange = Boolean(editEndTime && calculatedMinutes === null)
  const timeLabel = item.startTime ? `${item.startTime}${item.endTime ? `–${item.endTime}` : ''}` : '시간 미정'
  const statusLabel: Record<string, string> = { scheduled: '예정', 'in-progress': '진행 중', completed: '완료', missed: '미완료', skipped: '건너뜀', carried: '이월됨', cancelled: '취소' }

  const carryToNext = () => {
    const next = nextEligibleDate(todayKey(), data?.settings.defaultRestWeekdays ?? [0])
    carryItem(item.id, next)
  }

  const applyEdit = () => {
    if (invalidTimeRange) return
    const duration = calculatedMinutes ?? Math.max(0, editMinutes)
    editScheduleOccurrence(item.id, {
      title: editTitle.trim() || item.title,
      date: moveDate,
      startTime: editTime || undefined,
      endTime: editEndTime || undefined,
      estimatedMinutes: duration,
      actualMinutes: completed && calculatedMinutes !== null ? calculatedMinutes : item.actualMinutes,
      status: completed ? item.status : 'scheduled',
    }, hasSeries ? editScope : 'one')
  }

  const changeStartTime = (value: string) => {
    setEditTime(value)
    const calculated = timeRangeMinutes(value, editEndTime)
    if (calculated !== null) setEditMinutes(calculated)
  }

  const changeEndTime = (value: string) => {
    setEditEndTime(value)
    const calculated = timeRangeMinutes(editTime, value)
    if (calculated !== null) setEditMinutes(calculated)
  }

  return <div className={`schedule-row ${completed ? 'is-complete' : ''} ${compact ? 'compact' : ''}`}>
    <button className="check-button" onClick={() => toggleComplete(item.id)} aria-label={completed ? `${item.title} 완료 취소` : `${item.title} 완료`} aria-pressed={completed}>{completed ? <Check size={17} /> : null}</button>
    <button className="schedule-main" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
      <span className="color-line" style={{ background: stage?.color ?? plan?.color ?? category?.color ?? '#8aa8a0' }} />
      <span className="schedule-copy"><strong>{item.title}</strong><small>{category?.name ?? '직접 추가'} · {timeLabel}{plannedStudyMinutes(item) ? ` · ${formatStudyMinutes(plannedStudyMinutes(item))}` : ''}</small></span>
      {!compact && <span className={`status-tag status-${item.status}`}>{statusLabel[item.status]}</span>}
      <ChevronDown size={17} className={expanded ? 'rotated' : ''} />
    </button>
    {expanded && <div className="schedule-detail">
      <div className="detail-stats"><span><Clock3 size={15} /> 계획 {item.plannedSequence ? `${item.plannedSequence}회차 · ` : ''}{formatStudyMinutes(plannedStudyMinutes(item))}</span>{item.actualSequence && <span>실제 완료 {item.actualSequence}회차</span>}{item.actualMinutes && <span>실제 {formatStudyMinutes(item.actualMinutes)}</span>}</div>
      <div className="schedule-edit-grid">
        <label className="field full"><span>일정 이름</span><input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} /></label>
        <label className="field"><span>날짜</span><input type="date" value={moveDate} onChange={(event) => setMoveDate(event.target.value)} /></label>
        <label className="field"><span>시작 시각</span><input type="time" value={editTime} onChange={(event) => changeStartTime(event.target.value)} /></label>
        <label className="field"><span>종료 시각</span><input type="time" value={editEndTime} onChange={(event) => changeEndTime(event.target.value)} /></label>
        <label className="field"><span>공부 시간 {calculatedMinutes !== null && <small>자동</small>}</span><input type="number" min={0} step={5} value={editMinutes} onChange={(event) => setEditMinutes(Number(event.target.value))} /></label>
        {hasSeries && <label className="field"><span>수정 범위</span><select value={editScope} onChange={(event) => setEditScope(event.target.value as OccurrenceEditScope)}><option value="one">이 일정만</option><option value="future">이 일정과 이후 일정</option><option value="all">전체 반복 일정</option></select></label>}
      </div>
      {invalidTimeRange && <p className="time-range-error">시작 시각과 종료 시각은 서로 달라야 합니다.</p>}
      {hasSeries && <p className="edit-scope-note">완료한 일정은 범위 수정에서 보호됩니다.</p>}
      <label className="field full"><span>메모</span><textarea value={item.notes} onChange={(event) => updateItem(item.id, { notes: event.target.value })} placeholder="학습 범위, 페이지, 링크를 기록하세요." rows={2} /></label>
      <div className="schedule-actions">
        <button className="apply-schedule-edit" onClick={applyEdit} disabled={invalidTimeRange}>변경 적용</button>
        <button onClick={() => updateItem(item.id, { status: 'skipped' })}>건너뛰기</button>
        <button onClick={carryToNext}>다음 학습일로 이월</button>
        {completed && <button onClick={() => toggleComplete(item.id)}><RotateCcw size={14} /> 완료 취소</button>}
      </div>
    </div>}
  </div>
}
