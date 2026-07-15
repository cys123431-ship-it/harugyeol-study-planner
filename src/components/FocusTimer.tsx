import { Pause, Play, RotateCcw, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { todayKey } from '../lib/dates'
import { usePlanner } from '../store/PlannerContext'

interface TimerState { mode: 'countdown' | 'stopwatch'; running: boolean; startedAt?: number; accumulated: number; duration: number; itemId?: string }
const storageKey = 'haru-timer-state'
const initial: TimerState = { mode: 'countdown', running: false, accumulated: 0, duration: 25 * 60 }

function readTimer(): TimerState {
  try { return { ...initial, ...JSON.parse(localStorage.getItem(storageKey) ?? '{}') } } catch { return initial }
}

export function FocusTimer({ onClose }: { onClose: () => void }) {
  const { data, updateItem } = usePlanner()
  const [timer, setTimer] = useState<TimerState>(readTimer)
  const [now, setNow] = useState(0)
  const todayItems = data?.items.filter((item) => item.date === todayKey() && item.status !== 'completed') ?? []

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(timer))
    if (!timer.running) return
    const tick = window.setInterval(() => {
      const timestamp = Date.now()
      const liveElapsed = timer.accumulated + (timer.startedAt ? Math.floor((timestamp - timer.startedAt) / 1000) : 0)
      if (timer.mode === 'countdown' && liveElapsed >= timer.duration) {
        setTimer((current) => ({ ...current, running: false, accumulated: current.duration, startedAt: undefined }))
        if ('Notification' in window && Notification.permission === 'granted') new Notification('집중 시간이 끝났어요', { body: '잠깐 쉬어 가거나 공부 시간을 기록해 보세요.' })
        return
      }
      setNow(timestamp)
    }, 500)
    return () => window.clearInterval(tick)
  }, [timer])

  const elapsed = timer.accumulated + (timer.running && timer.startedAt && now ? Math.floor((now - timer.startedAt) / 1000) : 0)
  const displaySeconds = timer.mode === 'countdown' ? Math.max(0, timer.duration - elapsed) : elapsed
  const finished = timer.mode === 'countdown' && displaySeconds === 0
  const minutes = String(Math.floor(displaySeconds / 60)).padStart(2, '0')
  const seconds = String(displaySeconds % 60).padStart(2, '0')
  const progress = timer.mode === 'countdown' ? Math.min(100, (elapsed / timer.duration) * 100) : 0
  const circumference = 2 * Math.PI * 88
  const offset = circumference - (progress / 100) * circumference

  const toggle = () => setTimer((current) => current.running
    ? { ...current, running: false, accumulated: current.accumulated + Math.floor((Date.now() - (current.startedAt ?? Date.now())) / 1000), startedAt: undefined }
    : { ...current, running: true, startedAt: Date.now() })
  const reset = () => setTimer((current) => ({ ...current, running: false, startedAt: undefined, accumulated: 0 }))
  const studiedMinutes = Math.max(1, Math.round(elapsed / 60))
  const canApply = elapsed >= 60 && timer.itemId
  const modeLabel = useMemo(() => timer.mode === 'countdown' ? '카운트다운' : '스톱워치', [timer.mode])

  const applyTime = () => {
    if (!timer.itemId) return
    const item = data?.items.find((candidate) => candidate.id === timer.itemId)
    updateItem(timer.itemId, { actualMinutes: (item?.actualMinutes ?? 0) + studiedMinutes })
    reset()
    onClose()
  }

  return <div className="modal-backdrop timer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="dialog timer-dialog" role="dialog" aria-modal="true" aria-labelledby="timer-title">
      <header><div><span className="eyebrow">집중 타이머</span><h2 id="timer-title">한 번에 한 가지에 집중해요</h2></div><button className="icon-button" onClick={onClose} aria-label="닫기"><X /></button></header>
      <div className="timer-mode"><button className={timer.mode === 'countdown' ? 'active' : ''} onClick={() => setTimer({ ...initial, mode: 'countdown' })}>카운트다운</button><button className={timer.mode === 'stopwatch' ? 'active' : ''} onClick={() => setTimer({ ...initial, mode: 'stopwatch' })}>스톱워치</button></div>
      <div className="timer-face" aria-label={`${modeLabel} ${minutes}분 ${seconds}초`}>
        <svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" className="timer-track" /><circle cx="100" cy="100" r="88" className="timer-progress" style={{ strokeDasharray: circumference, strokeDashoffset: offset }} /></svg>
        <div><span>{minutes}:{seconds}</span><small>{finished ? '집중 완료' : timer.running ? '집중 중' : '준비됨'}</small></div>
      </div>
      {timer.mode === 'countdown' && !timer.running && elapsed === 0 && <div className="duration-options">{[15, 25, 40, 50].map((minute) => <button key={minute} className={timer.duration === minute * 60 ? 'active' : ''} onClick={() => setTimer((current) => ({ ...current, duration: minute * 60 }))}>{minute}분</button>)}</div>}
      <label className="field full"><span>연결할 오늘 일정 <small>선택</small></span><select value={timer.itemId ?? ''} onChange={(event) => setTimer((current) => ({ ...current, itemId: event.target.value || undefined }))}><option value="">연결하지 않음</option>{todayItems.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <div className="timer-controls"><button className="timer-reset" onClick={reset} aria-label="타이머 초기화"><RotateCcw /></button><button className="timer-main" onClick={toggle}>{timer.running ? <Pause /> : <Play fill="currentColor" />}{timer.running ? '잠시 멈춤' : '집중 시작'}</button></div>
      {canApply && <button className="secondary-button wide" onClick={applyTime}>공부 시간 {studiedMinutes}분 반영</button>}
    </section>
  </div>
}
