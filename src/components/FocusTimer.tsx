import { Pause, Play, RotateCcw, Target, Timer, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { todayKey } from '../lib/dates'
import {
  DEFAULT_TIMER_TARGET_MINUTES,
  timerActualMinutes,
  timerDisplaySeconds,
  timerElapsedSeconds,
  timerRecordedMinutes,
  timerTargetSeconds,
} from '../lib/itemTimer'
import { formatStudyMinutes } from '../lib/studyTime'
import { usePlanner } from '../store/PlannerContext'
import type { ScheduleItem, TimerMode } from '../types'

function clockLabel(iso?: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function finishPatch(item: ScheduleItem, elapsedSeconds: number, now: Date, success: boolean): Partial<ScheduleItem> {
  const boundedElapsed = success ? Math.min(elapsedSeconds, timerTargetSeconds(item)) : elapsedSeconds
  return {
    timerStatus: success ? 'success' : 'paused',
    timerStartedAt: undefined,
    timerElapsedSeconds: boundedElapsed,
    timerSucceededAt: success ? now.toISOString() : undefined,
    actualMinutes: timerActualMinutes(item, boundedElapsed),
    actualEndedAt: now.toISOString(),
    status: item.status === 'scheduled' ? 'in-progress' : item.status,
  }
}

export function FocusTimer({ onClose, initialItemId }: { onClose: () => void; initialItemId?: string }) {
  const { data, updateItem } = usePlanner()
  const todayItems = useMemo(() => data?.items
    .filter((item) => item.date === todayKey() && !['completed', 'cancelled', 'skipped', 'carried'].includes(item.status))
    .sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99')) ?? [], [data?.items])
  const [itemId, setItemId] = useState(() => initialItemId ?? todayItems[0]?.id ?? '')
  const [now, setNow] = useState(Date.now())
  const item = todayItems.find((candidate) => candidate.id === itemId)
  const mode: TimerMode = item?.timerMode ?? 'stopwatch'
  const running = item?.timerStatus === 'running'
  const elapsed = item ? timerElapsedSeconds(item, now) : 0
  const displaySeconds = item ? timerDisplaySeconds(item, now) : 0
  const finished = item?.timerStatus === 'success' || (mode === 'countdown' && displaySeconds === 0 && elapsed > 0)
  const displayMinutes = String(Math.floor(displaySeconds / 60)).padStart(2, '0')
  const seconds = String(displaySeconds % 60).padStart(2, '0')
  const progress = item && mode === 'countdown' ? Math.min(100, (elapsed / timerTargetSeconds(item)) * 100) : 0
  const circumference = 2 * Math.PI * 88
  const offset = circumference - (progress / 100) * circumference

  useEffect(() => {
    if (!item || item.timerStatus !== 'running') return
    let resolved = false
    const tick = () => {
      const timestamp = Date.now()
      setNow(timestamp)
      if (resolved || item.timerMode !== 'countdown' || timerElapsedSeconds(item, timestamp) < timerTargetSeconds(item)) return
      resolved = true
      const finishedAt = new Date(timestamp)
      updateItem(item.id, finishPatch(item, timerTargetSeconds(item), finishedAt, true))
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('목표 시간 달성!', { body: `${item.title} 목표 공부 시간을 채웠어요.` })
      }
    }
    tick()
    const interval = window.setInterval(tick, 500)
    return () => window.clearInterval(interval)
  }, [item, updateItem])

  const selectMode = (nextMode: TimerMode) => {
    if (!item || running || nextMode === mode) return
    updateItem(item.id, {
      timerMode: nextMode,
      timerStatus: 'idle',
      timerStartedAt: undefined,
      timerElapsedSeconds: 0,
      timerBaseActualMinutes: undefined,
      timerSucceededAt: undefined,
    })
    setNow(Date.now())
  }

  const start = () => {
    if (!item) return
    const startedAt = new Date()
    const startNewSession = item.timerStatus === 'success' || item.timerStatus === 'idle' || !item.timerStatus
    updateItem(item.id, {
      timerMode: mode,
      timerStatus: 'running',
      timerStartedAt: startedAt.toISOString(),
      timerElapsedSeconds: startNewSession ? 0 : item.timerElapsedSeconds ?? 0,
      timerBaseActualMinutes: startNewSession ? item.actualMinutes ?? 0 : item.timerBaseActualMinutes ?? item.actualMinutes ?? 0,
      timerTargetMinutes: item.timerTargetMinutes ?? DEFAULT_TIMER_TARGET_MINUTES,
      timerSucceededAt: undefined,
      actualStartedAt: startNewSession ? startedAt.toISOString() : item.actualStartedAt,
      actualEndedAt: undefined,
      status: item.status === 'scheduled' ? 'in-progress' : item.status,
    })
    setNow(startedAt.getTime())
  }

  const stop = () => {
    if (!item || !running) return
    const stoppedAt = new Date()
    const currentElapsed = timerElapsedSeconds(item, stoppedAt.getTime())
    const success = mode === 'countdown' && currentElapsed >= timerTargetSeconds(item)
    updateItem(item.id, finishPatch(item, currentElapsed, stoppedAt, success))
    setNow(stoppedAt.getTime())
  }

  const reset = () => {
    if (!item || running) return
    updateItem(item.id, {
      timerStatus: 'idle',
      timerStartedAt: undefined,
      timerElapsedSeconds: 0,
      timerBaseActualMinutes: undefined,
      timerSucceededAt: undefined,
    })
    setNow(Date.now())
  }

  const setTarget = (minutes: number) => {
    if (!item || running) return
    updateItem(item.id, {
      timerMode: 'countdown',
      timerStatus: 'idle',
      timerStartedAt: undefined,
      timerElapsedSeconds: 0,
      timerTargetMinutes: Math.min(720, Math.max(1, Math.floor(minutes))),
      timerBaseActualMinutes: undefined,
      timerSucceededAt: undefined,
    })
    setNow(Date.now())
  }

  const statusText = finished
    ? '목표 달성'
    : running
      ? mode === 'countdown' ? '목표를 향해 집중 중' : '공부 시간 기록 중'
      : item?.timerStatus === 'paused'
        ? '정지됨 · 이어서 시작할 수 있어요'
        : '시작할 준비가 됐어요'

  return <div className="modal-backdrop timer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="dialog timer-dialog" role="dialog" aria-modal="true" aria-labelledby="timer-title">
      <header><div><span className="eyebrow">일정별 공부 타이머</span><h2 id="timer-title">시작과 정지를 자동으로 기록해요</h2></div><button className="icon-button" onClick={onClose} aria-label="닫기"><X /></button></header>

      <label className="field full timer-item-select"><span>기록할 오늘 일정</span><select value={itemId} onChange={(event) => { setItemId(event.target.value); setNow(Date.now()) }} disabled={running}><option value="">일정을 선택하세요</option>{todayItems.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}</select></label>

      <div className="timer-mode" role="group" aria-label="타이머 방식">
        <button className={mode === 'stopwatch' ? 'active' : ''} onClick={() => selectMode('stopwatch')} disabled={!item || running}><Timer size={15} />기록 타이머</button>
        <button className={mode === 'countdown' ? 'active' : ''} onClick={() => selectMode('countdown')} disabled={!item || running}><Target size={15} />목표 타이머</button>
      </div>

      <div className={`timer-face ${finished ? 'success' : ''}`} aria-label={`${mode === 'countdown' ? '남은 시간' : '공부 시간'} ${displayMinutes}분 ${seconds}초`}>
        <svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" className="timer-track" /><circle cx="100" cy="100" r="88" className="timer-progress" style={{ strokeDasharray: circumference, strokeDashoffset: offset }} /></svg>
        <div><span>{displayMinutes}:{seconds}</span><small>{statusText}</small></div>
      </div>

      {item && mode === 'countdown' && !running && <div className="timer-target-editor">
        <label><span>목표 시간</span><span className="target-input"><input type="number" min={1} max={720} value={item.timerTargetMinutes ?? DEFAULT_TIMER_TARGET_MINUTES} onChange={(event) => setTarget(Number(event.target.value))} aria-label="목표 시간(분)" /><em>분</em></span></label>
        <div className="duration-options">{[25, 50, 90, 120].map((minute) => <button key={minute} className={(item.timerTargetMinutes ?? DEFAULT_TIMER_TARGET_MINUTES) === minute ? 'active' : ''} onClick={() => setTarget(minute)}>{minute}분</button>)}</div>
      </div>}

      {item && <div className="timer-record-summary">
        <span>이번 측정 <strong>{formatStudyMinutes(timerRecordedMinutes(elapsed))}</strong></span>
        <span>실제 기록 <strong>{formatStudyMinutes(item.actualMinutes ?? 0)}</strong></span>
        <span>측정 시각 <strong>{clockLabel(item.actualStartedAt) || '—'}{item.actualStartedAt ? `–${clockLabel(item.actualEndedAt) || '진행 중'}` : ''}</strong></span>
      </div>}

      <div className="timer-controls">
        <button className="timer-reset" onClick={reset} aria-label="타이머 초기화" disabled={!item || running}><RotateCcw /></button>
        <button className={`timer-main ${running ? 'stop' : ''}`} onClick={running ? stop : start} disabled={!item}>{running ? <Pause /> : <Play fill="currentColor" />}{running ? '정지하고 기록' : item?.timerStatus === 'paused' ? '이어서 시작' : finished ? '다시 시작' : '시작'}</button>
      </div>
      <p className="timer-persistence-note">타이머를 시작한 뒤 창이나 사이트를 닫아도 진행 상태가 저장됩니다.</p>
    </section>
  </div>
}
