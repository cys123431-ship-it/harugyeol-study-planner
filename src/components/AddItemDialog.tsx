import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { todayKey } from '../lib/dates'
import { timeRangeMinutes } from '../lib/studyTime'
import { usePlanner } from '../store/PlannerContext'

export function AddItemDialog({ onClose, initialDate }: { onClose: () => void; initialDate?: string }) {
  const { data, addManualItem } = usePlanner()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(initialDate ?? todayKey())
  const [time, setTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [minutes, setMinutes] = useState(30)
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal')
  const [notes, setNotes] = useState('')

  const restDay = data?.settings.defaultRestWeekdays.includes(new Date(`${date}T12:00:00`).getDay())
  const calculatedMinutes = timeRangeMinutes(time, endTime)
  const invalidTimeRange = Boolean(endTime && calculatedMinutes === null)

  const changeStartTime = (value: string) => {
    setTime(value)
    const calculated = timeRangeMinutes(value, endTime)
    if (calculated !== null) setMinutes(calculated)
  }

  const changeEndTime = (value: string) => {
    setEndTime(value)
    const calculated = timeRangeMinutes(time, value)
    if (calculated !== null) setMinutes(calculated)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim() || invalidTimeRange) return
    if (restDay && !window.confirm('이 날짜는 휴식일입니다. 그래도 일정을 추가하시겠습니까?')) return
    addManualItem({ title: title.trim(), date, startTime: time || undefined, endTime: endTime || undefined, estimatedMinutes: minutes, notes, priority, categoryId: data?.categories[0]?.id })
    onClose()
  }

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="dialog compact-dialog" role="dialog" aria-modal="true" aria-labelledby="item-dialog-title">
      <header><div><span className="eyebrow">빠른 추가</span><h2 id="item-dialog-title">오늘의 흐름에 더하기</h2></div><button className="icon-button" onClick={onClose} aria-label="닫기"><X /></button></header>
      <form onSubmit={submit}>
        <label className="field full"><span>일정 이름</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 3장 연습문제 풀기" required /></label>
        <div className="form-grid">
          <label className="field"><span>날짜</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
          <label className="field"><span>시작 시간 <small>선택</small></span><input type="time" value={time} onChange={(event) => changeStartTime(event.target.value)} /></label>
          <label className="field"><span>종료 시간 <small>선택</small></span><input type="time" value={endTime} onChange={(event) => changeEndTime(event.target.value)} /></label>
          <label className="field"><span>공부 시간 {calculatedMinutes !== null && <small>자동 계산</small>}</span><input type="number" min={0} step={5} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} /></label>
          <label className="field"><span>우선순위</span><select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}><option value="low">여유</option><option value="normal">보통</option><option value="high">중요</option></select></label>
        </div>
        {invalidTimeRange && <p className="inline-notice">종료 시간은 시작 시간보다 늦어야 합니다.</p>}
        {restDay && <p className="inline-notice">선택한 날짜는 휴식일입니다. 저장할 때 한 번 더 확인합니다.</p>}
        <label className="field full"><span>메모 <small>선택</small></span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="페이지, 준비물, 링크 등을 적어 두세요." rows={3} /></label>
        <footer><button type="button" className="text-button" onClick={onClose}>취소</button><button className="primary-button" disabled={!title.trim() || invalidTimeRange}>일정 추가</button></footer>
      </form>
    </section>
  </div>
}
